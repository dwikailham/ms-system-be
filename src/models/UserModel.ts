import { DataTypes, Model, Optional } from "sequelize"; // ✅ Correct
import db from "../config/Database";

export interface UserAttributes {
  id?: number; // optional if auto-increment
  uuid: string;
  name: string;
  username: string;
  password: string;
  role: string;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, "id"> {}

class User extends Model<UserAttributes, {}> implements UserAttributes {
  public id!: number;
  public uuid!: string;
  public name!: string;
  public username!: string;
  public password!: string;
  public role!: string;
}

const Users = User.init(
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100],
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [6, 10],
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    sequelize: db,
    tableName: "users",
    freezeTableName: true,
  }
);

export default Users;
