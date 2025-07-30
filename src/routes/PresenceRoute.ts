import express from "express";
import { accessValidation } from "../middleware";
import {
  createData,
  deleteData,
  getById,
  getList,
  updateData,
} from "../controllers/Presence";

const router = express.Router();

router.get("/presence", accessValidation, getList);
router.get("/presence/:id", accessValidation, getById);
router.post("/presence", accessValidation, createData);
router.patch("/presence/:id", accessValidation, updateData);
router.delete("/presence/:id", accessValidation, deleteData);

export default router;
