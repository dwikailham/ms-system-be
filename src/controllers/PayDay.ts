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

type TListRawPayday = {
  payday_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_salary: number;
  work_placement_id: number;
  "work_placement.name": string;
};

type TListGroupingPayday = {
  payday_id: string;
  start_date: string;
  end_date: string;
  total_salary: number;
  work_placement: string;
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
        salary_employee: attendance === "HADIR" ? record["employee.salary"] : 0,
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

export const getList = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as {
    startDate?: string;
    endDate?: string;
  };

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    const { rows: uuidRows } = await PayDayModel.findAndCountAll({
      where: {
        ...(startDate && endDate
          ? { date: { [Op.between]: [startDate, endDate] } }
          : undefined),
      },
      attributes: [[PayDayModel.sequelize!.col("payday_id"), "payday_id"]],
      group: ["payday_id", "start_date", "end_date", "work_placement_id"],
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    const allUuids = uuidRows.map((row) => row.payday_id);
    const paginatedUuids = allUuids.slice(offset, offset + limit);

    const presenceData = (await PayDayModel.findAll({
      where: {
        payday_id: { [Op.in]: paginatedUuids },
      },
      attributes: [
        "payday_id",
        "start_date",
        "end_date",
        "total_days",
        "total_salary",
      ],
      include: [
        {
          model: WorkPlacementModel,
          attributes: ["name"],
          as: "work_placement",
        },
      ],
      order: [["createdAt", "DESC"]],
      raw: true,
    })) as unknown as TListRawPayday[];

    const grouped = Object.values(
      presenceData.reduce((acc, curr) => {
        const key = `${curr.start_date}_${curr.end_date}`;

        if (!acc[key]) {
          acc[key] = {
            payday_id: curr.payday_id,
            start_date: curr.start_date,
            end_date: curr.end_date,
            work_placement: curr["work_placement.name"],
            total_salary: 0,
          };
        }

        acc[key].total_salary += Number(curr.total_salary);

        return acc;
      }, {} as Record<string, TListGroupingPayday>)
    );

    res.status(200).json({
      meta: {
        total: allUuids.length,
        totalPages: Math.ceil(allUuids.length / limit),
        currentPage: page,
        pageSize: limit,
      },
      data: grouped,
    });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const getPayDayByDetail = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const payday = (await PayDayModel.findOne({
    where: { payday_id: req.params.id },
    include: [
      {
        model: WorkPlacementModel,
        attributes: ["name"],
        as: "work_placement",
      },
    ],
    raw: true,
  })) as unknown as TListRawPayday;

  if (!payday) return res.status(400).json({ message: "DATA NOT FOUND" });

  try {
    const all_data = await PayDayModel.findAll({
      where: {
        start_date: payday.start_date,
        end_date: payday.end_date,
        work_placement_id: payday.work_placement_id,
      },
      attributes: ["employee_id", "total_salary", "total_days"],
      include: [
        {
          model: EmployeeModel,
          attributes: ["name"],
          as: "employee",
        },
      ],
    });

    const response = {
      start_date: payday.start_date,
      end_date: payday.end_date,
      work_placement: payday["work_placement.name"],
      employees: all_data,
    };

    res.status(200).json(response);
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

  const res_work_placement_id = await WorkPlacementModel.findOne({
    where: { uuid: work_placement_id },
    attributes: ["id"],
    raw: true,
  });

  if (!res_work_placement_id) {
    res.status(400).json({ message: "WORK PLACEMENT NOT FOUND" });
  }
  try {
    const payload = employees.map((el) => ({
      ...el,
      payday_id: uuidv4(),
      start_date,
      end_date,
      work_placement_id: res_work_placement_id?.id,
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
