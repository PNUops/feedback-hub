import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

/** 관리자 passcode 헤더 이름. */
export const ADMIN_HEADER = "x-admin-password";
/** 관리자 passcode 쿠키 이름(서버 컴포넌트에서 판별용). */
export const ADMIN_COOKIE = "fb_admin";
/** 비공개 피드백 열람 비밀번호 헤더 이름. */
export const FEEDBACK_PW_HEADER = "x-feedback-password";

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** 요청이 관리자 passcode를 올바르게 제시했는지. ADMIN_PASSWORD 미설정이면 항상 false. */
export function isAdmin(req: Request): boolean {
  const provided = req.headers.get(ADMIN_HEADER);
  const expected = process.env.ADMIN_PASSWORD;
  if (!provided || !expected) return false;
  return constantTimeEqual(provided, expected);
}

/** 서버 컴포넌트에서 관리자 여부 판별(요청 객체 없이 쿠키로). */
export async function isAdminServer(): Promise<boolean> {
  const provided = (await cookies()).get(ADMIN_COOKIE)?.value;
  const expected = process.env.ADMIN_PASSWORD;
  if (!provided || !expected) return false;
  return constantTimeEqual(provided, expected);
}

/** 관리 전용 핸들러 가드. 통과 못 하면 401 Response를 반환(호출부에서 그대로 return). */
export function requireAdmin(req: Request): Response | null {
  if (!isAdmin(req)) {
    return Response.json({ error: "개발자 권한이 필요합니다." }, { status: 401 });
  }
  return null;
}

/**
 * 비공개 피드백 열람 권한 여부.
 * 관리자거나, 헤더로 올바른 열람 비밀번호를 제시하면 true.
 */
export async function canViewFeedback(
  req: Request,
  feedback: { isPrivate: boolean; accessPasswordHash: string | null },
): Promise<boolean> {
  if (!feedback.isPrivate) return true;
  if (isAdmin(req)) return true;
  const pw = req.headers.get(FEEDBACK_PW_HEADER);
  if (!pw || !feedback.accessPasswordHash) return false;
  return bcrypt.compare(pw, feedback.accessPasswordHash);
}

/** 열람 비밀번호를 저장용 해시로. */
export function hashAccessPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

/** 특정 피드백의 열람 비밀번호 검증(unlock 엔드포인트용). */
export async function verifyFeedbackPassword(feedbackId: number, pw: string): Promise<boolean> {
  const fb = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { accessPasswordHash: true },
  });
  if (!fb?.accessPasswordHash) return false;
  return bcrypt.compare(pw, fb.accessPasswordHash);
}
