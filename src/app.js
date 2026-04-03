import express from "express";
import cors from "cors";
import morgan from "morgan";
import "./server/dbConfig.js";
import router from "./routes/index.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", router);

export default app;
