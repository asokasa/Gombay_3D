import { Router } from "express";
import authenticate from "../middleware/authenticate.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { downloadQuoteRequestFile, listQuoteRequests } from "../controllers/quoteController.js";

const router = Router();

router.use(authenticate);

router.get("/quote-requests", asyncHandler(listQuoteRequests));
router.get("/quote-requests/:id/download", asyncHandler(downloadQuoteRequestFile));

export default router;
