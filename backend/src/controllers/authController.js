import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import generateToken from "../utils/generateToken.js";

export const registerAdmin = async (req, res) => {
  const { email, password, name, setupKey } = req.body;

  if (!process.env.ADMIN_SETUP_KEY) {
    return res.status(500).json({ error: "Admin registration is not configured" });
  }

  if (setupKey !== process.env.ADMIN_SETUP_KEY) {
    return res.status(403).json({ error: "Invalid setup key" });
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return res.status(409).json({ error: "Admin with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await Admin.create({ email, name, passwordHash });
  return res.status(201).json({ admin: admin.toJSON() });
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = generateToken({ id: admin._id.toString() });

  res.json({
    token,
    admin: {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
    },
  });
};

export const currentAdmin = async (req, res) => {
  res.json({ admin: req.admin });
};
