import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { listPremadeModels, listReferenceImages } from "../controllers/mediaController.js";
import { listFilaments } from "../controllers/filamentController.js";
import { getCalculatorSettings } from "../controllers/calculatorSettingsController.js";

const router = Router();

router.get("/reference-images", asyncHandler(listReferenceImages));
router.get("/premade-models", asyncHandler(listPremadeModels));
router.get("/filaments", asyncHandler(listFilaments));
router.get("/calculator-settings", asyncHandler(getCalculatorSettings));

export default router;
