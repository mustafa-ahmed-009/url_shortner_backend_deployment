import { Router } from "express";
import { forgotPassword, login, signUp, verifyResetCode , authenticate , checkAuth , logout, resetPassword, sendNewUserVerificationCode, verifyNewUserRegistrationCode ,  } from "../controllers/authController";
import { loginValidator, signupValidator } from "../validators/authValidators";
import { validationMiddleWare } from "../middleWares/validationMiddleWare";
const router = Router() ; 
router.post("/signup",signupValidator,validationMiddleWare,signUp,sendNewUserVerificationCode)
router.post('/verifyRegistrationCode',verifyNewUserRegistrationCode);

router.post("/login",loginValidator,validationMiddleWare,login)
router.post('/forgotPassword',forgotPassword);
router.post('/verifyResetCode',verifyResetCode);
router.post('/resetPassword',resetPassword);
router.get("/check", authenticate, checkAuth);
router.get("/logout", authenticate, logout);
export default router ; 
