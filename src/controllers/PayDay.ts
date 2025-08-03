import { Request, Response } from "express";
import { Op, Model } from "sequelize";

import {
  EmployeeModel,
  WorkPlacementModel,
  PresenceModel,
  PayDayModel,
} from "../models";
import { PresenceWithEmployeeName } from "./Presence";
import { v4 as uuidv4 } from "uuid";

type TBodyParamsPayRoll = {
  work_placement_id: number;
  start_date: string;
  end_date: string;
  employees: Array<{
    employee_id: string;
    total_days: number;
    total_salary: number;
  }>;
};

export const getListPresenceByParams = async (req: Request, res: Response) => {
  const work_placement_id = (req.query?.work_placement_id as string) || "";
  const { startDate, endDate } = req.query as {
    startDate?: string;
    endDate?: string;
  };

  try {
    if (!startDate || !endDate || !work_placement_id) {
      return res.status(200).json([]);
    }

    const res_work_placement_id = await WorkPlacementModel.findOne({
      where: { uuid: work_placement_id },
      attributes: ["id"],
      raw: true,
    });

    if (!res_work_placement_id) {
      res.status(400).json({ message: "WORK PLACEMENT NOT FOUND" });
    }

    const response = (await PresenceModel.findAll({
      where: {
        work_placement_id: res_work_placement_id?.id,
        ...(startDate && endDate
          ? { date: { [Op.between]: [startDate, endDate] } }
          : undefined),
        is_paid: false,
      },
      attributes: [
        "uuid",
        "date",
        "attendance",
        "is_paid",
        "employee_id",
        "notes",
      ],
      include: [
        {
          model: EmployeeModel,
          attributes: ["name", "id", "salary"],
          as: "employee",
        },
      ],
      raw: true,
    })) as unknown as PresenceWithEmployeeName[];

    const groupedByDate: any = {};

    for (const record of response) {
      const { date, employee_id, notes, attendance } = record;

      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }

      groupedByDate[date].push({
        employee_id,
        work_placement_id,
        notes,
        attendance,
        name_employee: record["employee.name"],
        salary_employee: record["employee.salary"],
      });
    }

    // 3. Convert to desired array format
    const result = Object.entries(groupedByDate).map(([date, employees]) => ({
      date,
      employees,
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const getPayDayByDetail = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const payday = await PayDayModel.findOne({
    where: { payday_id: req.params.id },
  });

  if (!payday) return res.status(400).json({ message: "DATA NOT FOUND" });

  // Get all related presence records
  try {
    const presenceRecords = await PresenceModel.findAll({
      where: {
        payday_id: payday.id,
      },
      attributes: ["date", "employee_id", "work_placement_id"],
      order: [["date", "ASC"]],
      raw: true,
    });

    // Group by date
    const grouped: any = {};

    presenceRecords.forEach(({ date, employee_id, work_placement_id }) => {
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push({ employee_id, work_placement_id });
    });

    // Final format
    const result = Object.entries(grouped).map(([date, employees]) => ({
      date,
      employees,
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json("INTERNAL SERVER ERROR");
  }
};

export const submitPayroll = async (
  req: Request<{}, {}, TBodyParamsPayRoll>,
  res: Response
) => {
  const { employees, end_date, start_date, work_placement_id } = req.body;
  if (!employees.length || !end_date || !start_date || !work_placement_id) {
    return res.status(400).json({ message: "BAD REQUEST" });
  }
  try {
    const payload = employees.map((el) => ({
      ...el,
      payday_id: uuidv4(),
      start_date,
      end_date,
      work_placement_id,
    }));

    const createdPaydays = await PayDayModel.bulkCreate(payload, {
      returning: true,
    });

    for (const payday of createdPaydays) {
      await PresenceModel.update(
        {
          is_paid: true,
          payday_id: payday.id,
        },
        {
          where: {
            employee_id: payday.employee_id,
            work_placement_id: payday.work_placement_id,
            date: {
              [Op.between]: [payday.start_date, payday.end_date],
            },
          },
        }
      );
    }

    res.status(201).json({ message: "Payment success created!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const updateBackFill = async (req: Request, res: Response) => {
  const paydays = await PayDayModel.findAll({ raw: true });

  if (!paydays) {
    return res.status(400).json({ message: "DATA NOT FOUND" });
  }

  await Promise.all(
    paydays.map(async (payday) => {
      await PresenceModel.update(
        { payday_id: payday.id },
        {
          where: {
            employee_id: payday.employee_id,
            work_placement_id: payday.work_placement_id,
            date: {
              [Op.between]: [payday.start_date, payday.end_date],
            },
            is_paid: true,
          },
        }
      );
    })
  );

  res.status(200).json({ message: "Payday IDs backfilled successfully." });
};
