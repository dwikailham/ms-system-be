import express from "express";
import { accessValidation } from "../middleware";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/Users";

const router = express.Router();

router.get("/users", accessValidation, getUsers);
router.get("/users/:id", accessValidation, getUserById);
router.post("/users", accessValidation, createUser);
router.patch("/users/:id", accessValidation, updateUser);
router.delete("/users/:id", accessValidation, deleteUser);

export default router;
