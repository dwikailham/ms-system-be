import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// import db from "./config/Database";
// import "./models/UserModel";
import UseRoute from "./routes/UserRoute";

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT;

// (async () => {
//   await db.sync();
//   try {
//     await db.sync();
//     console.log("Synced database!");
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

app.get("/", (req, res) => {
  res.send("Hello from TypeScript and nodemon!");
});

app.listen(PORT, () => {
  console.log(`Server running at PORT: ${PORT}`);
});
