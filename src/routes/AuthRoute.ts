import express from "express";
import { Login, Logout } from "../controllers/Auth";

const router = express.Router();

router.post("/login", Login);
router.post("/login", Logout);

export default router;
