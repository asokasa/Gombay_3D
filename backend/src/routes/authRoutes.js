import { Router } from "express";
import { body } from "express-validator";

import asyncHandler from "../middleware/asyncHandler.js";
import authenticate from "../middleware/authenticate.js";
import validateRequest from "../middleware/validateRequest.js";
import { registerAdmin, loginAdmin, currentAdmin } from "../controllers/authController.js";

const router = Router();

router.post(
  "/register",
  validateRequest([
    body("username")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters")
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage("Username contains invalid characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("name").notEmpty().withMessage("Name is required"),
    body("setupKey").notEmpty().withMessage("Setup key is required"),
  ]),
  asyncHandler(registerAdmin),
);

router.post(
  "/login",
  validateRequest([
    body().custom((value) => {
      const hasIdentifier = Boolean(value?.identifier || value?.email);
      if (!hasIdentifier) {
        throw new Error("Username or email is required");
      }
      return true;
    }),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  asyncHandler(loginAdmin),
);

router.get("/me", authenticate, asyncHandler(currentAdmin));

export default router;
