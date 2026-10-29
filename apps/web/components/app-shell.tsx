"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { dict } from "@/lib/dictionaries/ru";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/hooks/use-session";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useSession();

  async function handleLogout() {
    await api.POST("/auth/logout");
    queryClient.setQueryData(["me"], null);
    router.push("/");
  }

  const links = [
    { href: "/dashboard", label: dict.nav.dashboard },
    { href: "/profile", label: dict.nav.profile },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-raised">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-on">
                E
              </span>
              <span className="text-[15px] font-semibold text-text">{dict.nav.brand}</span>
            </Link>
            <nav className="flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith(link.href)
                      ? "bg-accent-soft text-accent-strong"
                      : "text-text-secondary hover:bg-bg-sunken hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-text-faint">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-sunken hover:text-text"
                >
                  {dict.nav.logout}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
