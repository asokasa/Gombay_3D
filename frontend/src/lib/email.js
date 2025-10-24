import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export function isEmailServiceConfigured() {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

export async function sendQuoteEmail({ subject, message, replyTo, fromName, toEmail }) {
  if (!isEmailServiceConfigured()) {
    throw new Error("Az e-mail szolgáltatás nincs megfelelően konfigurálva.");
  }

  const templateParams = {
    subject,
    message,
    reply_to: replyTo,
    from_name: fromName,
    to_email: toEmail,
  };

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
    publicKey: PUBLIC_KEY,
  });
}
