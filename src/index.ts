import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./config/Database";
import "./models/UserModel";
import UseRoute from "./routes/UserRoute";
import AuthRoute from "./routes/AuthRoute";
import WorkPlacementRoute from "./routes/WorkPlacementRoute";
import EmployeeRoute from "./routes/Employee";
import PresenceRoute from "./routes/PresenceRoute";

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT;

// (async () => {
//   try {
//     await db.sync({ alter: true });
//     console.log("Synced databases!");
//   } catch (err) {
//     console.error("Failed to sync DB:", err);
//   }
// })();

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);
app.use(express.json());
app.use(UseRoute);
app.use(AuthRoute);
app.use(WorkPlacementRoute);
app.use(EmployeeRoute);
app.use(PresenceRoute);

app.get("/", (req, res) => {
  res.send("Hello from TypeScript and nodemon!");
});

app.listen(PORT, () => {
  console.log(`Server running at PORT: ${PORT}`);
});
