import nodemailer from "nodemailer";

const DEFAULT_QUOTE_NOTIFICATION_TO = "balint.macsek@gmail.com";

function normalizeList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrencyHuf(value) {
  if (!Number.isFinite(Number(value))) {
    return "n/a";
  }

  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value)));
}

function formatSizeMb(value) {
  if (!Number.isFinite(Number(value))) {
    return "n/a";
  }

  return `${(Number(value) / (1024 * 1024)).toFixed(2)} MB`;
}

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user,
      pass,
    },
  });
}

function getNotificationRecipients() {
  return normalizeList(process.env.QUOTE_NOTIFICATION_TO || DEFAULT_QUOTE_NOTIFICATION_TO);
}

export function isQuoteNotificationConfigured() {
  return Boolean(buildTransporter()) && getNotificationRecipients().length > 0;
}

export async function sendQuoteRequestNotification(quoteRequest) {
  const transporter = buildTransporter();
  const recipients = getNotificationRecipients();

  if (!transporter || recipients.length === 0) {
    console.warn("Quote request email notification skipped because SMTP is not configured.");
    return false;
  }

  const customer = quoteRequest?.customer || {};
  const file = quoteRequest?.file || {};
  const material = quoteRequest?.material || {};
  const quote = quoteRequest?.quote || {};
  const analysis = quoteRequest?.analysis || {};
  const scaledSizeCm = Array.isArray(quoteRequest?.scaledSizeCm) ? quoteRequest.scaledSizeCm : [];
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  const dashboardUrl = process.env.ADMIN_DASHBOARD_URL || "";
  const scaledSizeText = scaledSizeCm.length > 0 ? scaledSizeCm.join(" x ") : "n/a";

  const subject = `New quote request from ${customer.name || "Unknown customer"}`;
  const text = [
    "A new quote request has been submitted.",
    "",
    `Customer: ${customer.name || "n/a"}`,
    `Email: ${customer.email || "n/a"}`,
    `Address: ${customer.address || "n/a"}`,
    `Message: ${customer.message || "n/a"}`,
    "",
    `Material: ${material.label || material.key || "n/a"}`,
    `Estimated total: ${formatCurrencyHuf(quote.total)}`,
    `Estimated print time: ${Number.isFinite(Number(quote.hours)) ? `${Number(quote.hours).toFixed(2)} h` : "n/a"}`,
    `Scaled size: ${scaledSizeText} cm`,
    "",
    `Uploaded file: ${file.originalName || "n/a"}`,
    `File size: ${formatSizeMb(file.sizeBytes)}`,
    `File URL: ${file.url || "n/a"}`,
    `Download path: ${file.downloadPath || "n/a"}`,
    "",
    `Detected unit: ${quoteRequest?.detectedUnitLabel || analysis.detectedUnit || "n/a"}`,
    `Submitted at: ${quoteRequest?.createdAt ? new Date(quoteRequest.createdAt).toISOString() : new Date().toISOString()}`,
    ...(dashboardUrl ? ["", `Admin dashboard: ${dashboardUrl}`] : []),
  ].join("\n");

  await transporter.sendMail({
    from: fromAddress,
    to: recipients.join(", "),
    replyTo: customer.email || undefined,
    subject,
    text,
  });

  return true;
}
