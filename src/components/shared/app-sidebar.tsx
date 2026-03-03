import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface AppSidebarProps {
  projectId?: string;
  currentView?: string;
}

export function AppSidebar({ projectId, currentView }: AppSidebarProps) {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-muted/50">
      {/* Logo */}
      <div className="flex items-center px-4 py-4">
        <Link href="/projects" className="text-lg font-semibold tracking-tight">
          plotamour
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-2">
        <SidebarLink
          href="/projects"
          label="All Projects"
          active={!projectId}
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          }
        />

        {projectId && (
          <>
            <div className="px-3 pt-4 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current Book
            </div>
            <SidebarLink
              href={`/project/${projectId}/timeline`}
              label="Timeline"
              active={currentView === "timeline"}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                />
              }
            />
            <SidebarLink
              href={`/project/${projectId}/outline`}
              label="Outline"
              active={currentView === "outline"}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              }
            />
            <SidebarLink
              href={`/project/${projectId}/characters`}
              label="Characters"
              active={currentView === "characters"}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              }
            />
            <SidebarLink
              href={`/project/${projectId}/places`}
              label="Places"
              active={currentView === "places"}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              }
            />
            <SidebarLink
              href={`/project/${projectId}/notes`}
              label="Notes"
              active={currentView === "notes"}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              }
            />
          </>
        )}
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-border p-3">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-background font-medium text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent"
      )}
    >
      <svg
        className="h-4 w-4"
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
