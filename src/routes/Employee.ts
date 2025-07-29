import express from "express";
import { accessValidation } from "../middleware";
import {
  createData,
  deleteData,
  getById,
  getList,
  updateData,
} from "../controllers/Employee";

const router = express.Router();

router.get("/employee", accessValidation, getList);
router.get("/employee/:id", accessValidation, getById);
router.post("/employee", accessValidation, createData);
router.patch("/employee/:id", accessValidation, updateData);
router.delete("/employee/:id", accessValidation, deleteData);

export default router;
