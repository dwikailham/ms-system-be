import express from "express";
import { accessValidation } from "../middleware";
import {
  getListPresenceByParams,
  submitPayroll,
  updateBackFill,
  getPayDayByDetail,
  getList,
} from "../controllers/PayDay";

const router = express.Router();

router.get("/payday", accessValidation, getList);
router.get("/payday/list-presence", accessValidation, getListPresenceByParams);
router.get("/payday/detail/:id", accessValidation, getPayDayByDetail);
router.post("/payday", accessValidation, submitPayroll);
router.post("/payday/backfill", accessValidation, updateBackFill);

export default router;
