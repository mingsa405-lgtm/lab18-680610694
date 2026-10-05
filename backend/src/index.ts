import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
dotenv.config();

// import middlewares
import morgan from "morgan";
import cors from "cors";
import invalidJsonMiddleware from "./middlewares/invalidJsonMiddleware.ts";
import notFoundMiddleware from "./middlewares/notFoundMiddleware.ts";

// Check DB connection
import { checkDatabaseConnection } from "./libs/checkDbConnection.ts";
checkDatabaseConnection();

// import routers
import studentRouter_v3 from "./routes/studentsRoutes_v3.ts";
import courseRouter_v3 from "./routes/coursesRouters_v3.ts";
import userRouter_v3 from "./routes/usersRouters_v3.ts";
import fileRouter_v1 from "./routes/fileRouters_v1.ts";
import enrollmentRouter_v3 from "./routes/enrollmentsRouters_v3.ts";

const app = express();
const port = process.env.PORT || 3000;

// ดึงรายการ origins ที่อนุญาต, ตัดช่องว่าง และตัดเครื่องหมาย / ท้าย URL ออก
const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""));

// โดเมนที่อนุญาตเสมอ
const defaultAllowed = [
  "https://lab18-680610694-frontend.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

// CORS middleware (รองรับ Preflight ในตัว)
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        defaultAllowed.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// body parser middleware
app.use(express.json());

// logger middleware
app.use(morgan("dev"));

// JSON parser middleware
app.use(invalidJsonMiddleware);

// Endpoints
app.get("/", (req: Request, res: Response) => {
  res.send("Lecture10 API services");
});

app.get("/me", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Student Information",
    data: {
      studentId: "680610694",
      firstName: "ปัณณวัฒน์ ",
      lastName: "วงษ์แก้วจันทร์",
      program: "CPE",
      section: "001",
    },
  });
});

// use routers
app.use("/api/v3/users", userRouter_v3);
app.use("/api/v3/students", studentRouter_v3);
app.use("/api/v3/courses", courseRouter_v3);
app.use("/api/v3/file", fileRouter_v1);
app.use("/api/v3/enrollments", enrollmentRouter_v3);

// endpoint check middleware
app.use(notFoundMiddleware);

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

// Export app for vercel deployment
export default app;