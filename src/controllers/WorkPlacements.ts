import WorkPlacement from "../models/WorkPlacementModel";
import argon2 from "argon2";
import { Request, Response } from "express";
import { Op } from "sequelize";

type BodyParams = {
  name: string;
  address: string;
  is_active: boolean;
};

export const getWorkPlacement = async (req: Request, res: Response) => {
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
    const { count, rows } = await WorkPlacement.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: ["uuid", "name", "address", "is_active"],
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

export const getWorkPlacementById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const user = await WorkPlacement.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(400).json({ message: "Work Placement not exists" });
  }

  try {
    const response = await WorkPlacement.findOne({
      where: { uuid: req.params.id },
      attributes: ["uuid", "name", "address", "is_active"],
    });
    res.status(200).json(response);
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const createWorkPlacement = async (
  req: Request<{}, {}, BodyParams>,
  res: Response
) => {
  const { name, address } = req.body;
  try {
    const existingData = await WorkPlacement.findOne({ where: { name } });
    if (existingData) {
      return res.status(400).json({ message: "Data already exists" });
    }
    WorkPlacement.create({
      name,
      address,
      is_active: true,
    });

    res.status(201).json({ message: "Work Placement success created!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const updateWorkPlacement = async (req: Request, res: Response) => {
  const user = await WorkPlacement.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(404).json({ message: "Work Placement not found" });
  }

  const { name, address, is_active } = req.body;

  try {
    WorkPlacement.update(
      {
        name,
        address,
        is_active,
      },
      {
        where: {
          id: user.id,
        },
      }
    );

    res.status(200).json({ message: "Work Placement success updated!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};

export const deleteWorkPlacement = async (req: Request, res: Response) => {
  const user = await WorkPlacement.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(404).json({ message: "Work Placement not found" });
  }

  try {
    WorkPlacement.destroy({
      where: {
        id: user.id,
      },
    });

    res.status(200).json({ message: "Work Placement success deleted!" });
  } catch (err: any) {
    res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
};
