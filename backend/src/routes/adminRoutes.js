import { Router } from "express";
import multer from "multer";
import path from "path";
import authenticate from "../middleware/authenticate.js";
import asyncHandler from "../middleware/asyncHandler.js";
import {
  createPremadeModel,
  createReferenceImage,
  deletePremadeModel,
  deleteReferenceImage,
} from "../controllers/mediaController.js";
import {
  deleteQuoteRequest,
  downloadQuoteRequestFile,
  listQuoteRequests,
  updateQuoteRequestStatus,
} from "../controllers/quoteController.js";

const MAX_IMAGE_SIZE = 12 * 1024 * 1024;
const SUPPORTED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
      cb(new Error("Unsupported image file extension"));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.use(authenticate);

router.get("/quote-requests", asyncHandler(listQuoteRequests));
router.patch("/quote-requests/:id/status", asyncHandler(updateQuoteRequestStatus));
router.delete("/quote-requests/:id", asyncHandler(deleteQuoteRequest));
router.get("/quote-requests/:id/download", asyncHandler(downloadQuoteRequestFile));

router.post("/reference-images", imageUpload.single("image"), asyncHandler(createReferenceImage));
router.delete("/reference-images/:id", asyncHandler(deleteReferenceImage));
router.post("/premade-models", imageUpload.single("image"), asyncHandler(createPremadeModel));
router.delete("/premade-models/:id", asyncHandler(deletePremadeModel));

export default router;
