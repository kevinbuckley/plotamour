"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

export function SidebarLink({ href, label, icon, exact }: SidebarLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md py-2 text-sm transition-all duration-150",
        active
          ? "border-l-[3px] border-primary bg-primary/[0.08] pl-[9px] pr-3 font-semibold text-primary"
          : "px-3 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      <svg
        className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {icon}
      </svg>
      {label}
    </Link>
  );
}
