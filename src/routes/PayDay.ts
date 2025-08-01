import express from "express";
import { accessValidation } from "../middleware";
import {
  getListPresenceByParams,
  submitPayroll,
  updateBackFill,
} from "../controllers/PayDay";

const router = express.Router();

router.get("/payday/list-presence", accessValidation, getListPresenceByParams);
router.post("/payday", accessValidation, submitPayroll);
router.post("/payday/backfill", accessValidation, updateBackFill);

export default router;
