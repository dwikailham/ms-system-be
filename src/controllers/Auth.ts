import Users from "../models/UserModel";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

import { UserAttributes } from "../models/UserModel";

interface ValidationRequest extends Request {
  user_data: UserAttributes;
}

export const Login = async (req: Request, res: Response) => {
  const user = await Users.findOne({
    where: { username: req.body.username },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const matchPassword = await argon2.verify(user.password, req.body.password);
  if (!matchPassword) {
    return res.status(400).json({ message: "Invalid Email or Password" });
  }
  if (!user.is_active) {
    return res.status(400).json({ message: "User In Active" });
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

export const Me = async (req: Request, res: Response) => {
  const validationRequest = req as ValidationRequest;
  const { authorization } = validationRequest.headers;

  if (!authorization) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = authorization.split(" ")[1];
  const JWT_SECRET = process.env.JWT_SECRET!;

  try {
    const jwt_decode = jwt.verify(token, JWT_SECRET);
    if (typeof jwt_decode !== "string") {
      const user = await Users.findOne({
        where: { uuid: jwt_decode.uuid as string },
        attributes: ["name", "username", "role", "uuid"],
      });
      res.status(200).json({ user_data: user });
    }
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // res.status(200).json({ user_data: data, token });
};

export const Logout = (req: Request, res: Response) => {
  return res.status(200).json({ message: "Logout successful" });
};
