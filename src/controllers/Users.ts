import Users from "../models/UserModel";
import argon2 from "argon2";
import { Request, Response } from "express";
import { Op } from "sequelize";

type UserBody = {
  name: string;
  username: string;
  password: string;
  role: string;
};

export const getUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const search = (req.query.search as string)?.trim();

  const whereClause = search
    ? {
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
        ],
      }
    : undefined;

  try {
    const { count, rows } = await Users.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: [
        "uuid",
        "username",
        "name",
        "role",
        "createdAt",
        "is_active",
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
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const user = await Users.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(400).json({ message: "User not exists" });
  }

  try {
    const response = await Users.findOne({
      where: { uuid: req.params.id },
      attributes: ["uuid", "username", "name", "role"],
    });
    res.status(200).json(response);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createUser = async (
  req: Request<{}, {}, UserBody>,
  res: Response
) => {
  const { name, username, password, role } = req.body;
  try {
    const existingUser = await Users.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashPassword = await argon2.hash(password);
    Users.create({
      name,
      username,
      password: hashPassword,
      role,
    });

    res.status(201).json({ message: "Registered!" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const user = await Users.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { name, username, password, role, is_active } = req.body;

  let hashPassword;
  if (password === "" || password === null) {
    hashPassword = user.password;
  } else {
    hashPassword = await argon2.hash(password);
  }

  try {
    Users.update(
      {
        name,
        username,
        password: hashPassword,
        role,
        is_active,
      },
      {
        where: {
          id: user.id,
        },
      }
    );

    res.status(200).json({ message: "User success updated!" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const user = await Users.findOne({
    where: { uuid: req.params.id },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    Users.destroy({
      where: {
        id: user.id,
      },
    });

    res.status(200).json({ message: "User success deleted!" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
