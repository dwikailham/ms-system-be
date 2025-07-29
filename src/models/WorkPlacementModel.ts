import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/Database";

export interface WorkPlacementAttributes {
  id?: number; // optional if auto-increment
  uuid: string;
  name: string;
  address: string;
  is_active: boolean;
}

export interface UserCreationAttributes
  extends Optional<WorkPlacementAttributes, "id"> {}

class WorkPlacement
  extends Model<WorkPlacementAttributes, {}>
  implements WorkPlacementAttributes
{
  public id!: number;
  public uuid!: string;
  public name!: string;
  public address!: string;
  public is_active!: boolean;
}

const WorkPlacements = WorkPlacement.init(
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
      unique: true,
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
  },
  {
    sequelize: db,
    tableName: "work_placement",
    freezeTableName: true,
  }
);

export default WorkPlacements;
