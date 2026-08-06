import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { TopBar } from "@/components/top-bar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Feedback Hub",
  description: "opus, pickle 등 시스템 피드백을 남기고 개발 현황을 관리합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/[email protected]/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AppProvider>
          <TopBar />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
          <Toaster position="top-center" richColors />
        </AppProvider>
      </body>
    </html>
  );
}
