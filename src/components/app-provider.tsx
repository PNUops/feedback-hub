"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { COOKIE_ADMIN, COOKIE_EMAIL, COOKIE_NAME, deleteCookie, getCookie, setCookie } from "@/lib/cookies";
import { randomNick } from "@/lib/nickname";

type AppState = {
  ready: boolean;
  name: string | null;
  setName: (name: string) => void;
  email: string | null;
  setEmail: (email: string) => void;
  /** 현재 이름을 반환하되, 없으면 임의 닉네임을 부여·저장하고 반환. */
  ensureName: () => string;
  isAdmin: boolean;
  adminPassword: string | null;
  loginAdmin: (pw: string) => Promise<boolean>;
  logoutAdmin: () => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [name, setNameState] = useState<string | null>(null);
  const [email, setEmailState] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  useEffect(() => {
    setNameState(getCookie(COOKIE_NAME));
    setEmailState(getCookie(COOKIE_EMAIL));
    setAdminPassword(getCookie(COOKIE_ADMIN));
    setReady(true);
  }, []);

  const setName = useCallback((n: string) => {
    const trimmed = n.trim();
    setCookie(COOKIE_NAME, trimmed);
    setNameState(trimmed);
  }, []);

  const setEmail = useCallback((e: string) => {
    const trimmed = e.trim();
    setCookie(COOKIE_EMAIL, trimmed);
    setEmailState(trimmed);
  }, []);

  const ensureName = useCallback(() => {
    const current = getCookie(COOKIE_NAME);
    if (current && current.trim()) return current;
    const nick = randomNick();
    setCookie(COOKIE_NAME, nick);
    setNameState(nick);
    return nick;
  }, []);

  const loginAdmin = useCallback(async (pw: string) => {
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "x-admin-password": pw },
    });
    if (!res.ok) return false;
    setCookie(COOKIE_ADMIN, pw);
    setAdminPassword(pw);
    return true;
  }, []);

  const logoutAdmin = useCallback(() => {
    deleteCookie(COOKIE_ADMIN);
    setAdminPassword(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        ready,
        name,
        setName,
        email,
        setEmail,
        ensureName,
        isAdmin: !!adminPassword,
        adminPassword,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
