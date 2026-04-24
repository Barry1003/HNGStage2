import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import profilesRouter from "./routes/profiles";

const app = express();
const PORT = process.env.PORT || 3000;

app.use((_, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.options("*", (_, res) => res.sendStatus(204));
app.use(express.json());

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err.type === "entity.parse.failed")
      return res
        .status(422)
        .json({ status: "error", message: "Invalid JSON body" });
    next(err);
  },
);

app.use("/api/profiles", profilesRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  },
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
