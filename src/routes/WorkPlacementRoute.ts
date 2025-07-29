import express from "express";
import { accessValidation } from "../middleware";
import {
  createWorkPlacement,
  deleteWorkPlacement,
  getWorkPlacement,
  getWorkPlacementById,
  updateWorkPlacement,
} from "../controllers/WorkPlacements";

const router = express.Router();

router.get("/work-placement", accessValidation, getWorkPlacement);
router.get("/work-placement/:id", accessValidation, getWorkPlacementById);
router.post("/work-placement", accessValidation, createWorkPlacement);
router.patch("/work-placement/:id", accessValidation, updateWorkPlacement);
router.delete("/work-placement/:id", accessValidation, deleteWorkPlacement);

export default router;
