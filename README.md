# InterviewAI

**AI-powered interview prep — walk into your next interview already ready.**

InterviewAI analyzes your resume (or a quick self-description) against any job description and generates a complete, personalized interview strategy in under a minute: a match score, tailored technical and behavioral questions, identified skill gaps, and a day-by-day preparation roadmap. It can also generate a job-tailored resume PDF on demand.

🔗 **Live App:** [https://ai-reviewer-theta.vercel.app/](https://ai-reviewer-theta.vercel.app/)

---

## ✨ Features

- **AI Match Scoring** — Instantly see how well your profile fits a given job description, scored 0–100.
- **Tailored Question Bank** — AI-generated technical and behavioral interview questions specific to the role, each with the interviewer's likely intention and a model answer.
- **Skill Gap Analysis** — Highlights missing or weak skills relative to the job, tagged by severity.
- **Day-by-Day Prep Roadmap** — A structured, multi-day study plan built around your actual gaps.
- **AI-Tailored Resume Export** — Generates and downloads a resume PDF rewritten to highlight what the specific role is looking for.
- **Resume Upload or Self-Description** — Works with a PDF resume upload or a quick freeform self-description — whichever you have on hand.
- **Report History** — Every generated plan is saved to your account and viewable later; unwanted plans can be deleted.
- **Secure Authentication** — Token-based auth (JWT) that works reliably across browsers and devices, including iOS Safari/Chrome.
- **Responsive UI** — Fully usable on desktop and mobile.

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- React Router
- Axios
- SCSS

**Backend**
- Node.js + Express
- MongoDB with Mongoose (hosted on MongoDB Atlas)
- JWT-based authentication (Bearer token, stored client-side)
- Multer (resume file uploads)
- `pdf-parse` (resume text extraction)
- Puppeteer (server-side PDF generation for tailored resumes)

**AI**
- Google Gemini (`@google/genai`) for report and resume generation
- Zod for structured data validation

**Deployment**
- Frontend: [Vercel](https://vercel.com)
- Backend: [Render](https://render.com)
- Database: [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- A MongoDB connection string (local or Atlas)
- A Google Gemini API key

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd genAI
```

### 2. Backend setup
```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/`:
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

Start the backend:
```bash
node server.js
```

### 3. Frontend setup
```bash
cd Frontend
npm install
```

Create a `.env` file in `Frontend/`:
```
VITE_API_URL=http://localhost:3000
```

Start the frontend:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```
genAI/
├── Backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # Route handlers
│   │   ├── middlewares/     # Auth & file upload middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # AI generation & PDF logic
│   │   └── app.js
│   └── server.js
└── Frontend/
    └── src/
        ├── components/       # Shared components (Navbar)
        ├── features/
        │   ├── auth/         # Login, Register, auth context/hooks
        │   ├── interview/    # Dashboard, report view, interview context/hooks
        │   └── landing/      # Landing page
        ├── lib/              # Shared axios client
        └── App.jsx
```

---

## 🔌 API Overview

### Auth Routes (`/api/auth`)
| Method | Route | Description | Access |
|---|---|---|---|
| POST | `/register` | Register a new user | Public |
| POST | `/login` | Log in and receive a JWT | Public |
| GET | `/logout` | Blacklist the current token | Private |
| GET | `/get-me` | Get the logged-in user's details | Private |

### Interview Routes (`/api/interview`)
| Method | Route | Description | Access |
|---|---|---|---|
| POST | `/` | Generate a new interview report from resume/self-description + job description | Private |
| GET | `/` | Get all interview reports for the logged-in user | Private |
| GET | `/report/:interviewId` | Get a specific interview report | Private |
| DELETE | `/:interviewId` | Delete a specific interview report | Private |
| POST | `/resume/pdf/:interviewReportId` | Generate and download a tailored resume PDF | Private |

All private routes require an `Authorization: Bearer <token>` header.

---

## 🔐 Authentication Flow

InterviewAI uses stateless JWT authentication with the token stored in the browser (`localStorage`) rather than cookies, so it works reliably across all browsers and devices — including cross-domain deployments (frontend on Vercel, backend on Render) and iOS, where third-party cookie restrictions commonly break cookie-based auth.

- On login/register, the backend issues a JWT which the frontend stores locally.
- Every subsequent request attaches the token via an `Authorization: Bearer <token>` header.
- Logging out blacklists the token server-side so it can no longer be reused.

---

## 🧠 How Report Generation Works

1. The user uploads a resume (PDF, parsed server-side with `pdf-parse`) or provides a self-description, plus a target job description.
2. The backend sends this context to Google Gemini with a structured prompt requesting a specific JSON shape: match score, technical questions, behavioral questions, skill gaps, and a preparation roadmap.
3. The response is validated and saved to MongoDB, linked to the logged-in user.
4. The user can revisit, browse, or delete any previously generated report at any time.
5. Optionally, the user can request an AI-tailored resume PDF generated from their saved report data, rendered server-side with Puppeteer.

---

## 📄 License

This project was built as a personal/portfolio project.

---

## 🙋 Author

Built by Aisha Jawed.