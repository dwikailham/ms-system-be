import { DataTypes, Model, Optional } from "sequelize";
import WorkPlacementModel from "./WorkPlacementModel";
import EmployeeModel from "./EmployeeModel";
import db from "../config/Database";

export interface PayDayAttributes {
  id?: number; // optional if auto-increment
  payday_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_salary: number;
  work_placement_id: number;
  employee_id: number;
}

export interface EmployeeCreationAttributes
  extends Optional<PayDayAttributes, "id"> {}

class PayDay extends Model<PayDayAttributes, {}> implements PayDayAttributes {
  public id!: number;
  public payday_id!: string;
  public start_date!: string;
  public end_date!: string;
  public total_days!: number;
  public total_salary!: number;
  public work_placement_id!: number;
  public employee_id!: number;
}

const PayDays = PayDay.init(
  {
    payday_id: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    total_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    total_salary: {
      type: DataTypes.DECIMAL,
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
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    sequelize: db,
    tableName: "payday",
    freezeTableName: true,
  }
);

WorkPlacementModel.hasMany(PayDays, {
  foreignKey: "work_placement_id",
  as: "paydays",
});
PayDays.belongsTo(WorkPlacementModel, {
  foreignKey: "work_placement_id",
  as: "work_placement",
});

EmployeeModel.hasMany(PayDays, {
  foreignKey: "employee_id",
  as: "paydays",
});
PayDays.belongsTo(EmployeeModel, {
  foreignKey: "employee_id",
  as: "employee",
});

export default PayDays;
