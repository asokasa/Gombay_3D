import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export default async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).lean();

    if (!admin) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.admin = { id: admin._id.toString(), username: admin.username || null, email: admin.email, name: admin.name };
    next();
  } catch (error) {
    console.error("Authentication error", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}
