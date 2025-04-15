import { Router } from "express";
import { createNewShortendedUrl, getUserUrls, redirectUser, syncUrls } from "../controllers/urlController";
import { createNewUrlValidator } from "../validators/uRlvalidator";
import { authenticate } from "../controllers/authController";
const router = Router() ; 
router.post("/" ,createNewUrlValidator ,authenticate,createNewShortendedUrl)
router.post("/nonLoggedCreation" ,createNewUrlValidator ,createNewShortendedUrl)
router.post("/sync",  authenticate,syncUrls)
router.get("/urls" ,authenticate,getUserUrls )
router.get("/:slug" ,redirectUser )
export default router