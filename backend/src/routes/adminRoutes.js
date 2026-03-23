import { Router } from "express";
import authenticate from "../middleware/authenticate.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { listQuoteRequests } from "../controllers/quoteController.js";

const router = Router();

router.use(authenticate);

router.get("/quote-requests", asyncHandler(listQuoteRequests));

export default router;
