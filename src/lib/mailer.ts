import nodemailer from "nodemailer";

/**
 * SMTP가 .env로 설정된 경우에만 메일을 보낸다. 미설정이면 조용히 no-op.
 * 빌드/기동에 지장이 없도록 실패도 삼킨다(알림은 부가 기능).
 */
function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  const t = transport();
  if (!t || !to) return;
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM ?? "feedback-hub <no-reply@pnuops.com>",
      to,
      subject,
      text,
    });
  } catch (e) {
    console.error("mail send failed:", e);
  }
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://feedback.pnuops.com";

export function feedbackUrl(id: number): string {
  return `${BASE}/issues/${id}`;
}
