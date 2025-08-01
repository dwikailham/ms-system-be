import { DataTypes, Model, Optional } from "sequelize";
import { EmployeeModel, WorkPlacementModel, PayDayModel } from "./index";
import db from "../config/Database";

export enum ATTENDANCE {
  PRESENT = "HADIR",
  ABSENT = "TIDAK_HADIR",
  LEAVE = "IZIN",
  SICK = "SAKIT",
}

export interface PresenceAttributes {
  id?: number;
  uuid: string;
  date: string;
  attendance:
    | ATTENDANCE.ABSENT
    | ATTENDANCE.LEAVE
    | ATTENDANCE.PRESENT
    | ATTENDANCE.SICK;
  notes: string;
  is_paid: boolean;
  employee_id: number;
  work_placement_id: number;
  payday_id: number;
}

export interface EmployeeCreationAttributes
  extends Optional<PresenceAttributes, "id"> {}

class Presence
  extends Model<PresenceAttributes, {}>
  implements PresenceAttributes
{
  public id!: number;
  public uuid!: string;
  public date!: string;
  public attendance!:
    | ATTENDANCE.ABSENT
    | ATTENDANCE.LEAVE
    | ATTENDANCE.PRESENT
    | ATTENDANCE.SICK;
  public notes!: string;
  public employee_id!: number;
  public work_placement_id!: number;
  public is_paid!: boolean;
  public payday_id!: number;
}

const Presences = Presence.init(
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    attendance: {
      type: DataTypes.STRING,
      defaultValue: ATTENDANCE.ABSENT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: "employee", // exact table name (lowercase if that's how you defined it)
        key: "id",
      },
    },
    work_placement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: "work_placement", // exact table name (lowercase if that's how you defined it)
        key: "id",
      },
    },
    payday_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "payday",
        key: "id",
      },
    },
  },
  {
    sequelize: db,
    tableName: "presence",
    freezeTableName: true,
  }
);

EmployeeModel.hasMany(Presences);
Presences.belongsTo(EmployeeModel, {
  foreignKey: "employee_id",
  as: "employee",
});
Presences.belongsTo(WorkPlacementModel, {
  foreignKey: "work_placement_id",
  as: "work_placement",
});

Presence.belongsTo(PayDayModel, {
  foreignKey: "payday_id",
  as: "payday",
});

PayDayModel.hasMany(Presence, {
  foreignKey: "payday_id",
  as: "presences",
});

export default Presences;
