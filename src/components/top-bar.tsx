"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MessageSquarePlus, ShieldCheck, UserRound, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/app-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { randomNick } from "@/lib/nickname";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
      )}
    >
      {label}
    </Link>
  );
}

export function TopBar() {
  const { ready, name, setName, email, setEmail, isAdmin, loginAdmin, logoutAdmin } = useApp();
  const pathname = usePathname();
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [pw, setPw] = useState("");
  const [nameOpen, setNameOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);

  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <MessagesSquare className="size-4" />
          </span>
          <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            Feedback Hub
          </span>
        </Link>
        {isAdmin && (
          <nav className="hidden sm:flex items-center gap-1 ml-2">
            <NavLink href="/labels" label="분류" active={isActive("/labels")} />
            <NavLink href="/projects" label="프로젝트" active={isActive("/projects")} />
            <NavLink href="/settings" label="설정" active={isActive("/settings")} />
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Dialog
            open={nameOpen}
            onOpenChange={(o) => {
              setNameOpen(o);
              setNameInput(name ?? "");
              setEmailInput(email ?? "");
              setDevOpen(false);
              setPw("");
            }}
          >
            <DialogTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-slate-600")}>
              {isAdmin ? <ShieldCheck className="size-4 text-primary" /> : <UserRound className="size-4" />}
              <span className="hidden sm:inline">{ready ? (name ?? "이름 설정") : ""}</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>내 정보</DialogTitle>
                <DialogDescription>피드백과 의견에 쓰일 이름과 이메일입니다.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    이름 <span className="text-slate-400 font-normal">(선택)</span>
                  </Label>
                  <Input
                    id="name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="신예준 조교 (비우면 임의의 닉네임)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    이메일 <span className="text-slate-400 font-normal">(선택)</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="입력 시 진행 상황을 메일로 안내 드립니다"
                  />
                </div>
              </div>

              <div className="mt-1 rounded-lg border bg-slate-50/60 p-3">
                {isAdmin ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                      <ShieldCheck className="size-4" /> 개발자 모드 켜짐
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        logoutAdmin();
                        toast.message("개발자 모드를 해제했습니다.");
                      }}
                    >
                      해제
                    </Button>
                  </div>
                ) : devOpen ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Input
                        id="pw"
                        type="password"
                        autoFocus
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="개발자 코드"
                        onKeyDown={(e) => e.key === "Enter" && document.getElementById("dev-login")?.click()}
                      />
                      <Button
                        id="dev-login"
                        size="sm"
                        onClick={async () => {
                          const ok = await loginAdmin(pw);
                          if (ok) {
                            setPw("");
                            setDevOpen(false);
                            toast.success("개발자 모드가 켜졌습니다.");
                          } else {
                            toast.error("개발자 코드가 올바르지 않습니다.");
                          }
                        }}
                      >
                        확인
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDevOpen(false);
                          setPw("");
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">개발자이신가요?</span>
                    <Button variant="outline" size="sm" onClick={() => setDevOpen(true)}>
                      개발자 전환
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    const final = nameInput.trim() || randomNick();
                    setName(final);
                    setEmail(emailInput);
                    setNameOpen(false);
                    toast.success(`저장되었습니다 (${final})`);
                  }}
                >
                  저장
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href="/issues/new" className={cn(buttonVariants({ size: "sm" }), "gap-1 shadow-sm")}>
            <MessageSquarePlus className="size-4" />
            <span className="hidden sm:inline">피드백 추가</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
