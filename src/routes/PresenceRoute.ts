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
router.get("/presence/detail/:id", accessValidation, getById);
router.post("/presence", accessValidation, createData);
router.patch("/presence/update/:id", accessValidation, updateData);
router.delete("/presence/delete/:id", accessValidation, deleteData);

export default router;
