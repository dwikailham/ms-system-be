import { Sequelize } from "sequelize";

const db = new Sequelize("ms_system", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

export default db;
