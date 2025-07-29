import { DataTypes, Model, Optional } from "sequelize";
import WorkPlacementModel from "./WorkPlacementModel";
import db from "../config/Database";

export interface EmployeeAttributes {
  id?: number; // optional if auto-increment
  uuid: string;
  name: string;
  address: string;
  salary: number;
  work_placement_id: number;
  is_active: boolean;
}

export interface EmployeeCreationAttributes
  extends Optional<EmployeeAttributes, "id"> {}

class Employee
  extends Model<EmployeeAttributes, {}>
  implements EmployeeAttributes
{
  public id!: number;
  public uuid!: string;
  public name!: string;
  public address!: string;
  public salary!: number;
  public work_placement_id!: number;
  public is_active!: boolean;
}

const Employees = Employee.init(
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
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    salary: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    work_placement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    sequelize: db,
    tableName: "employee",
    freezeTableName: true,
  }
);

WorkPlacementModel.hasMany(Employees);
Employees.belongsTo(WorkPlacementModel, {
  foreignKey: "work_placement_id",
  as: "work_placement",
});

export default Employees;
