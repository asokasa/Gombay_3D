import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./lib/connectDB.js";
import { ensureCloudinaryFolders, hasCloudinaryCredentials } from "./lib/cloudinary.js";
import ensureDefaultAdmin from "./lib/ensureDefaultAdmin.js";
import ensureDefaultCalculatorSettings from "./lib/ensureDefaultCalculatorSettings.js";
import ensureDefaultFilaments from "./lib/ensureDefaultFilaments.js";
import authRoutes from "./routes/authRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendEnvPath = path.resolve(__dirname, "../.env");
const rootEnvPath = path.resolve(__dirname, "../../.env");

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  }),
);
app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/quote-requests", quoteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", mediaRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Uploaded file exceeds the 50MB limit" });
  }
  if (err.message === "Unsupported file extension") {
    return res.status(400).json({ error: "Unsupported file extension" });
  }
  if (err.message === "Unsupported image file extension") {
    return res.status(400).json({ error: "Unsupported image file extension" });
  }
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await ensureDefaultAdmin();
    await ensureDefaultFilaments();
    await ensureDefaultCalculatorSettings();
    if (hasCloudinaryCredentials()) {
      await ensureCloudinaryFolders();
    }
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  start();
}

export default app;
