import Users from "../models/UserModel";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

export const Login = async (req: Request, res: Response) => {
  const user = await Users.findOne({
    where: { username: req.body.username },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const matchPassword = await argon2.verify(user.password, req.body.password);
  if (!matchPassword) {
    return res.status(400).json({ messeage: "Wrong Password" });
  }
  const data = {
    name: user.name,
    username: user.username,
    uuid: user.uuid,
    role: user.role,
  };
  const JWT_SECRET = process.env.JWT_SECRET!;

  const token = jwt.sign(data, JWT_SECRET);

  res.status(200).json({ user_data: data, token });
};

export const Logout = (req: Request, res: Response) => {
  return res.status(200).json({ message: "Logout successful" });
};
