"use client";

import { COOKIE_ADMIN, getCookie } from "./cookies";

type Opts = { feedbackPassword?: string | null; admin?: boolean };

function headers(json: boolean, opts?: Opts): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const adminPw = getCookie(COOKIE_ADMIN);
  if (adminPw) h["x-admin-password"] = adminPw;
  if (opts?.feedbackPassword) h["x-feedback-password"] = opts.feedbackPassword;
  return h;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parse(res: Response) {
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    let msg = `요청 실패 (${res.status})`;
    if (body && typeof body === "object" && "error" in body) {
      const e = (body as { error: unknown }).error;
      if (typeof e === "string") msg = e;
      else if (Array.isArray(e) && e[0] && typeof e[0].message === "string") msg = e[0].message;
    }
    throw new ApiError(res.status, body, msg);
  }
  return body;
}

export async function apiGet(path: string, opts?: Opts) {
  return parse(await fetch(path, { headers: headers(false, opts), cache: "no-store" }));
}

export async function apiSend(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  data?: unknown,
  opts?: Opts,
) {
  return parse(
    await fetch(path, {
      method,
      headers: headers(true, opts),
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  );
}

export async function apiUpload(path: string, file: File, opts?: Opts) {
  const fd = new FormData();
  fd.append("file", file);
  return parse(await fetch(path, { method: "POST", headers: headers(false, opts), body: fd }));
}
