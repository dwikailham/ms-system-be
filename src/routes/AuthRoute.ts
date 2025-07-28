import express from "express";
import { Login, Logout, Me } from "../controllers/Auth";
import { accessValidation } from "../middleware";

const router = express.Router();

router.post("/login", Login);
router.get("/me", accessValidation, Me);
router.post("/login", Logout);

export default router;
