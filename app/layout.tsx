import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import "./globals.css";
import NotificationBell from "../components/NotificationBell";
import SiteNav from "../components/SiteNav";

export const metadata: Metadata = {
  title: "Учебный трекер",
  description: "Трекер учебных задач для 8 класса",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full antialiased">
        <div className="min-h-screen">
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card md:flex">
            <div className="flex h-16 items-center gap-2 border-b border-border px-4">
              <Link
                href="/dashboard/student"
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <BookOpen className="h-6 w-6 shrink-0 text-primary" />
                <span className="truncate text-lg font-semibold">Учебный трекер</span>
              </Link>
              <NotificationBell />
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              <SiteNav variant="sidebar" />
            </nav>
          </aside>

          <main className="flex-1 md:pl-60">
            <div className="flex items-center justify-end border-b border-border bg-card px-4 py-2 md:hidden">
              <NotificationBell />
            </div>
            <div className="px-4 py-4 pb-24 md:px-8 md:py-8 md:pb-8">
              {children}
            </div>
          </main>
        </div>

        <SiteNav variant="bottom" />
      </body>
    </html>
  );
}
