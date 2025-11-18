"use client";

import type { ComponentType, JSX } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CalendarDays, Clock3, LayoutGrid, Scissors, Settings, User } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardNavIcon = "layout-grid" | "scissors" | "calendar-days" | "clock" | "user" | "settings";

const iconComponents: Record<DashboardNavIcon, ComponentType<{ className?: string }>> = {
  "layout-grid": LayoutGrid,
  scissors: Scissors,
  "calendar-days": CalendarDays,
  clock: Clock3,
  user: User,
  settings: Settings,
};

export interface DashboardNavItem {
  label: string;
  href: string;
  icon?: DashboardNavIcon;
}

interface SidebarNavProps {
  items: DashboardNavItem[];
  className?: string;
}

interface MobileNavProps {
  items: DashboardNavItem[];
  className?: string;
}

export function SidebarNav({ items, className }: SidebarNavProps): JSX.Element {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-2 text-sm font-medium text-white/70", className)}>
      {items.map((item) => {
        const Icon = item.icon ? iconComponents[item.icon] : undefined;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 transition",
              isActive ? "bg-white/10 text-white shadow-inner shadow-white/5" : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            {Icon ? (
              <Icon className={cn("h-4 w-4", isActive ? "text-yellow-400" : "text-white/50")} />
            ) : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ items, className }: MobileNavProps): JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 flex items-center justify-evenly border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur lg:hidden",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon ? iconComponents[item.icon] : undefined;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 text-xs font-medium transition",
              isActive ? "text-yellow-400" : "text-white/60 hover:text-white/80"
            )}
          >
            {Icon ? (
              <Icon className={cn("h-5 w-5", isActive ? "text-yellow-400" : "text-white/70")} />
            ) : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

