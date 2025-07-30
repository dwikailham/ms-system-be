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
router.get(
  "/work-placement/detail/:id",
  accessValidation,
  getWorkPlacementById
);
router.post("/work-placement", accessValidation, createWorkPlacement);
router.patch(
  "/work-placement/update/:id",
  accessValidation,
  updateWorkPlacement
);
router.delete(
  "/work-placement/delete/:id",
  accessValidation,
  deleteWorkPlacement
);

export default router;
