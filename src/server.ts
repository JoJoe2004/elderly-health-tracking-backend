import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route";
import elderlyRoutes from "./routes/elderly.route";
import medicineRoutes from "./routes/medicine.route";
import notificationRoutes from "./routes/notification.route";
import { startMedicineScheduler } from "./schedulers/notification.scheduler";
import lineRoutes from "./routes/line.route";
import healthRoutes from "./routes/health.route";
import { startHealthCleanupScheduler } from "./schedulers/health.scheduler";
import userRoutes from "./routes/user.routes";

startMedicineScheduler();
startHealthCleanupScheduler();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api", userRoutes);
app.use(express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/elderly", elderlyRoutes);
app.use("/api", medicineRoutes);
app.use("/api", notificationRoutes);
app.use("/api", healthRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});


app.use("/api/line", lineRoutes);