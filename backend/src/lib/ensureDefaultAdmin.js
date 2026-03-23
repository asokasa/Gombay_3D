import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

export default async function ensureDefaultAdmin() {
  const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || "asokasa";
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Vtgbta10*";
  const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || "asokasa@gombay.local";
  const defaultAdminName = process.env.DEFAULT_ADMIN_NAME || "Preset Admin";

  if (!defaultAdminUsername || !defaultAdminPassword) {
    return;
  }

  const normalizedUsername = defaultAdminUsername.toLowerCase().trim();
  const normalizedEmail = defaultAdminEmail.toLowerCase().trim();

  let admin = await Admin.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  const passwordHash = await bcrypt.hash(defaultAdminPassword, 12);

  if (!admin) {
    admin = await Admin.create({
      username: normalizedUsername,
      email: normalizedEmail,
      name: defaultAdminName,
      passwordHash,
    });
    console.log(`Default admin created: ${normalizedUsername}`);
    return admin;
  }

  admin.username = normalizedUsername;
  admin.email = normalizedEmail;
  admin.name = defaultAdminName;
  admin.passwordHash = passwordHash;
  await admin.save();
  console.log(`Default admin updated: ${normalizedUsername}`);
  return admin;
}
