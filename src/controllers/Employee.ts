import EmployeeModel from "../models/EmployeeModel";
import WorkPlacementModel from "../models/WorkPlacementModel";
import { Request, Response } from "express";
import { Op } from "sequelize";

type BodyParams = {
  name: string;
  address: string;
  salary: number;
  work_placement_id: number;
  is_active: boolean;
};

export const getList = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const search = (req.query.search as string)?.trim();

  const whereClause = search
    ? {
        [Op.or]: [{ name: { [Op.like]: `%${search}%` } }],
      }
    : undefined;

  try {
    const { count, rows } = await EmployeeModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: ["uuid", "name", "address", "is_active", "salary"],
      include: [
        {
          model: WorkPlacementModel,
          as: "work_placement",
          attributes: ["uuid", "name"],
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      data: rows,
      meta: {
        totalItems: count,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const getById = async (req: Request<{ id: string }>, res: Response) => {
  const user = await EmployeeModel.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(400).json({ message: "Employee not exists" });
  }

  try {
    const response = await EmployeeModel.findOne({
      where: { uuid: req.params.id },
      attributes: ["uuid", "name", "address", "is_active"],
    });
    res.status(200).json(response);
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const getListEmployeeByWorkPlacement = async (
  req: Request,
  res: Response
) => {
  const work_placement_uuid = req?.query?.workPlacementId;
  try {
    if (work_placement_uuid) {
      const response = await EmployeeModel.findAll({
        where: {
          is_active: true,
        },
        attributes: ["uuid", "name"],
        include: [
          {
            where: {
              uuid: work_placement_uuid,
            },
            model: WorkPlacementModel,
            as: "work_placement",
            attributes: ["name"],
          },
        ],
      });

      res.status(200).json(response);
    } else {
      res.status(200).json([]);
    }
  } catch (err) {
    console.log("ERROR ", err);
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const createData = async (
  req: Request<{}, {}, BodyParams>,
  res: Response
) => {
  const { name, address, work_placement_id, salary } = req.body;
  try {
    const existingData = await EmployeeModel.findOne({ where: { name } });
    const workPlacementId = await WorkPlacementModel.findOne({
      where: { uuid: work_placement_id },
      attributes: ["id"],
    });
    if (existingData) {
      return res.status(400).json({ message: "Data already exists" });
    }
    if (!workPlacementId) {
      return res.status(400).json({ message: "BAD REQUEST" });
    }

    EmployeeModel.create({
      name,
      address,
      salary,
      work_placement_id: workPlacementId.dataValues.id,
      is_active: true,
    });

    res.status(201).json({ message: "Employee success created!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const updateData = async (req: Request, res: Response) => {
  const user = await EmployeeModel.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const { name, address, is_active, salary, work_placement_id } =
    req.body as BodyParams;

  const workPlacementId = await WorkPlacementModel.findOne({
    where: { uuid: work_placement_id },
    attributes: ["id"],
  });

  if (!workPlacementId?.dataValues.id) {
    return res.status(400).json({ message: "BAD REQUEST" });
  }

  try {
    EmployeeModel.update(
      {
        name,
        address,
        is_active,
        salary,
        work_placement_id,
      },
      {
        where: {
          id: user.id,
        },
      }
    );

    res.status(200).json({ message: "Employee success updated!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const deleteData = async (req: Request, res: Response) => {
  const user = await EmployeeModel.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(404).json({ message: "Employee not found" });
  }

  try {
    EmployeeModel.destroy({
      where: {
        id: user.id,
      },
    });

    res.status(200).json({ message: "Employee success deleted!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};
