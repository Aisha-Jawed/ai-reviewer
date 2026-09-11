const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

// Gemini's responseSchema only accepts a restricted OpenAPI-style subset.
// zod-to-json-schema adds keys like "$schema" and "additionalProperties"
// that Gemini can reject or silently mishandle. This strips them out.
function toGeminiSchema(zodSchema) {
    const schema = zodToJsonSchema(zodSchema, {
        target: "openApi3",
        $refStrategy: "none"   // inline all definitions, Gemini can't resolve $ref
    })
    delete schema.$schema
    return stripUnsupportedKeys(schema)
}

function stripUnsupportedKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(stripUnsupportedKeys)
    }
    if (obj && typeof obj === "object") {
        const cleaned = {}
        for (const [ key, value ] of Object.entries(obj)) {
            if (key === "$schema" || key === "additionalProperties") continue
            cleaned[ key ] = stripUnsupportedKeys(value)
        }
        return cleaned
    }
    return obj
}

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `You are an expert technical interview coach. Based on the candidate details below, generate an interview preparation report.

Candidate Resume:
${resume}

Candidate Self Description:
${selfDescription}

Target Job Description:
${jobDescription}

Respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) matching EXACTLY this structure and these field names:

{
  "title": "string - the job title this report is for",
  "matchScore": number between 0 and 100,
  "technicalQuestions": [
    { "question": "string", "intention": "string", "answer": "string" }
  ],
  "behavioralQuestions": [
    { "question": "string", "intention": "string", "answer": "string" }
  ],
  "skillGaps": [
    { "skill": "string", "severity": "low" | "medium" | "high" }
  ],
  "preparationPlan": [
    { "day": number, "focus": "string", "tasks": ["string", "string"] }
  ]
}

Generate at least 5 technicalQuestions, at least 4 behavioralQuestions, at least 3 skillGaps, and a preparationPlan covering at least 5 days. Use exactly these field names — do not rename, omit, or nest them differently.`

    let response
    try {
        response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        })
    } catch (err) {
        console.error("Gemini generateInterviewReport error:", err?.message || err)
        throw new Error("Failed to generate interview report from AI. " + (err?.message || ""))
    }

    if (!response?.text) {
        console.error("Gemini returned empty response:", JSON.stringify(response))
        throw new Error("AI returned an empty response.")
    }

    let parsed
    try {
        // Strip markdown code fences in case the model adds them anyway
        const cleaned = response.text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "")
        parsed = JSON.parse(cleaned)
    } catch (err) {
        console.error("Failed to parse AI response as JSON:", response.text)
        throw new Error("AI response was not valid JSON.")
    }

    console.log("AI report keys:", Object.keys(parsed))

    if (!parsed.title || typeof parsed.title !== "string" || !parsed.title.trim()) {
        parsed.title = jobDescription?.split("\n")[ 0 ]?.slice(0, 100) || "Interview Report"
    }

    return parsed
}
async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    let response
    try {
        response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: toGeminiSchema(resumePdfSchema),
            }
        })
    } catch (err) {
        console.error("Gemini generateResumePdf error:", err?.message || err)
        throw new Error("Failed to generate resume from AI. " + (err?.message || ""))
    }

    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }