import { check } from "express-validator";

export const createNewUrlValidator = [
check("url").notEmpty().withMessage("you must provide an url")
]