import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { listPremadeModels, listReferenceImages } from "../controllers/mediaController.js";

const router = Router();

router.get("/reference-images", asyncHandler(listReferenceImages));
router.get("/premade-models", asyncHandler(listPremadeModels));

export default router;
