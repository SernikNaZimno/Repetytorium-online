"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpenCheck, Moon, Plus, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/stats/", label: "Statystyki", icon: BarChart3 },
  { href: "/create/", label: "Moduł", icon: Plus },
  { href: "/settings/", label: "Ustawienia", icon: Settings },
];

export function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  if (pathname?.startsWith("/play")) return null;
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        <Link href="/" className="mr-auto flex items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <BookOpenCheck className="size-4.5" />
          </span>
          Repetytorium
        </Link>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Button key={href} asChild variant="ghost" size="sm" className={cn(pathname === href && "bg-accent")}>
            <Link href={href} aria-label={label}>
              <Icon />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          </Button>
        ))}
        <Button variant="ghost" size="icon" aria-label="Zmień motyw" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </Button>
      </div>
    </header>
  );
}
