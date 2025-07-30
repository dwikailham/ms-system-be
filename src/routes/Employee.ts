import express from "express";
import { accessValidation } from "../middleware";
import {
  createData,
  deleteData,
  getById,
  getList,
  updateData,
  getListEmployeeByWorkPlacement,
} from "../controllers/Employee";

const router = express.Router();

router.get("/employee", accessValidation, getList);
router.get("/employee/detail/:id", accessValidation, getById);
router.get(
  "/employee/get-by-work-placement",
  accessValidation,
  getListEmployeeByWorkPlacement
);
router.post("/employee", accessValidation, createData);
router.patch("/employee/update/:id", accessValidation, updateData);
router.delete("/employee/delete/:id", accessValidation, deleteData);

export default router;
