const express= require('express')
const authController=require('../controllers/auth.controller')
const authMiddleWare=require('../middlewares/auth.middleware')
const authRouter=express.Router()
/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post('/register', authController.registerUserController)

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
*/

authRouter.post("/login", authController.loginUserController)

/**
 * @route GET /api/auth/logout
 * @description clear token from the cookie and add the token in blacklist
 * @access Public
*/
authRouter.post("/logout", authController.logoutUserController)

/**
 * @route GET/api/auth/get-me
 * @description get the current logged in user details
 * @access private
 */

authRouter.get("/get-me", authMiddleWare.authUser, authController.getMeController)


module.exports=authRouter
