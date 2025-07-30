import PrecenseModel, { ATTENDANCE } from "../models/PresenceModel";
import EmployeeModel from "../models/EmployeeModel";
import db from "../config/Database";
import WorkPlacementModel from "../models/WorkPlacementModel";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";

type BodyParams = {
  date: string;
  work_placement_id: string;
  employees: Array<{
    attendance:
      | ATTENDANCE.ABSENT
      | ATTENDANCE.LEAVE
      | ATTENDANCE.PRESENT
      | ATTENDANCE.SICK;
    notes: string;
    employee_id: string;
  }>;
};

type PresenceWithEmployeeName = {
  uuid: string;
  date: string;
  employee_id: number;
  notes: string;
  attendance: string;
  "employee.uuid": string;
  "employee.name": string;
  "work_placement.name": string;
  "work_placement.uuid": string;
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
    const { rows: uuidRows } = await PrecenseModel.findAndCountAll({
      where: {
        ...(startDate && endDate
          ? { date: { [Op.between]: [startDate, endDate] } }
          : undefined),
      },
      attributes: [[PrecenseModel.sequelize!.col("uuid"), "uuid"]],
      group: ["uuid", "date", "work_placement_id"],
      order: [["date", "DESC"]],
      raw: true,
    });

    const allUuids = uuidRows.map((row) => row.uuid);
    const paginatedUuids = allUuids.slice(offset, offset + limit);

    const presenceData = (await PrecenseModel.findAll({
      where: {
        uuid: { [Op.in]: paginatedUuids },
      },
      attributes: ["uuid", "date", "employee_id"],
      include: [
        {
          model: EmployeeModel,
          attributes: ["name", "uuid", "id"],
          as: "employee",
        },
        {
          model: WorkPlacementModel,
          attributes: ["name"],
          as: "work_placement",
        },
      ],
      order: [["uuid", "DESC"]],
      raw: true,
    })) as unknown as PresenceWithEmployeeName[];

    const grouped = Object.values(
      presenceData.reduce((acc, curr) => {
        const uuid = curr.uuid;

        if (!acc[uuid]) {
          acc[uuid] = {
            uuid: curr.uuid,
            date: curr.date,
            work_placement: curr["work_placement.name"],
            employees: [],
          };
        }

        acc[uuid].employees.push({
          name: curr["employee.name"], // Make sure this line is here
        });

        return acc;
      }, {} as Record<string, any>)
    );

    const result = Object.values(grouped);
    res.status(200).json({
      meta: {
        total: allUuids.length,
        totalPages: Math.ceil(allUuids.length / limit),
        currentPage: page,
        pageSize: limit,
      },
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const getById = async (req: Request<{ id: string }>, res: Response) => {
  const user = await PrecenseModel.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(400).json({ message: "Presence not exists" });
  }

  try {
    const response = (await PrecenseModel.findAll({
      where: { uuid: req.params.id },
      attributes: ["uuid", "date", "notes", "attendance"],
      include: [
        {
          model: WorkPlacementModel,
          attributes: ["name", "uuid"],
          as: "work_placement",
        },
        {
          model: EmployeeModel,
          attributes: ["name", "uuid", "id"],
          as: "employee",
        },
      ],
      raw: true,
    })) as unknown as PresenceWithEmployeeName[];

    const grouped = Object.values(
      response.reduce((acc, curr) => {
        const uuid = curr.uuid;

        if (!acc[uuid]) {
          acc[uuid] = {
            uuid: curr.uuid,
            date: curr.date,
            work_placement: {
              name: curr["work_placement.name"],
              id: curr["work_placement.uuid"],
            },
            employees: [],
          };
        }

        acc[uuid].employees.push({
          name: curr["employee.name"],
          id: curr["employee.uuid"],
          attendance: curr.attendance,
          notes: curr.notes,
        });

        return acc;
      }, {} as Record<string, any>)
    );

    res.status(200).json(grouped[0]);
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const createData = async (
  req: Request<{}, {}, BodyParams>,
  res: Response
) => {
  const { date, employees, work_placement_id } = req.body;
  if (!Array.isArray(employees) || !date || !work_placement_id) {
    return res.status(400).json({ message: "BAD REQUEST" });
  }

  const existingWorkPlacement = await WorkPlacementModel.findOne({
    where: { uuid: work_placement_id },
  });

  if (!existingWorkPlacement) {
    return res.status(400).json({ message: "WORK PLACEMENT NOT FOUND" });
  }

  const employeeIds = employees.map((el) => el.employee_id);
  const existingEmployees = await EmployeeModel.findAll({
    where: { uuid: employeeIds },
  });

  if (existingEmployees.length === 0) {
    res.status(400).json({ message: "EMPLOYEE NOT FOUND" });
  }

  const formatEmployee = existingEmployees.map((el) => ({
    id: el.id,
    uuid: el.uuid,
  }));

  const groupUuid = uuidv4();
  try {
    const bulkData = employees.map((entry) => {
      return {
        uuid: groupUuid,
        date,
        work_placement_id: existingWorkPlacement?.id,
        employee_id: formatEmployee.find(
          (el) => el?.uuid === entry?.employee_id
        )?.id,
        attendance: entry.attendance,
        notes: entry.notes || "",
      };
    });

    await PrecenseModel.bulkCreate(bulkData);

    res.status(201).json({ message: "Presence success created!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const updateData = async (req: Request, res: Response) => {
  const presenceId = await PrecenseModel.findOne({
    where: { uuid: req.params.id },
  });

  if (!presenceId) {
    return res.status(400).json({ message: "Presence not found" });
  }

  const uuid = req.params.id;

  const { date, employees, work_placement_id } = req.body as BodyParams;

  if (!Array.isArray(employees) || !date || !work_placement_id) {
    return res.status(400).json({ message: "BAD REQUEST" });
  }

  const existingWorkPlacement = await WorkPlacementModel.findOne({
    where: { uuid: work_placement_id },
  });

  if (!existingWorkPlacement) {
    return res.status(400).json({ message: "WORK PLACEMENT NOT FOUND" });
  }

  const employeeIds = employees.map((el) => el.employee_id);
  const existingEmployees = await EmployeeModel.findAll({
    where: { uuid: employeeIds },
  });

  if (existingEmployees.length === 0) {
    res.status(400).json({ message: "EMPLOYEE NOT FOUND" });
  }

  const formatEmployee = existingEmployees.map((el) => ({
    id: el.id,
    uuid: el.uuid,
  }));

  const t = await db.transaction();

  try {
    await PrecenseModel.destroy({ where: { uuid: req.params.id } });

    const newRecords = employees.map((entry) => {
      return {
        uuid,
        date,
        work_placement_id: existingWorkPlacement?.id,
        employee_id: formatEmployee.find(
          (el) => el?.uuid === entry?.employee_id
        )?.id,
        attendance: entry.attendance,
        notes: entry.notes || "",
      };
    });

    await PrecenseModel.bulkCreate(newRecords, { transaction: t });

    await t.commit();

    res.status(200).json({ message: "Presence success updated!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const deleteData = async (req: Request, res: Response) => {
  const user = await PrecenseModel.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(404).json({ message: "Presence not found" });
  }

  try {
    PrecenseModel.destroy({
      where: {
        uuid: req.params.id,
      },
    });

    res.status(200).json({ message: "Presence success deleted!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};
