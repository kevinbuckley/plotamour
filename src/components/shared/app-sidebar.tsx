import Link from "next/link";
import { BookSelector } from "@/components/series/book-selector";
import { SidebarLink } from "@/components/shared/sidebar-link";
import { DeleteProjectButton } from "@/components/shared/delete-project-button";
import { createClient } from "@/lib/db/server";
import type { Book, ProjectType } from "@/lib/types/database";

interface AppSidebarProps {
  projectId?: string;
  projectType?: ProjectType;
  books?: Book[];
  currentBookId?: string;
}

/** Deterministic avatar color from a string (name or email) */
function getAvatarStyle(seed: string): { bg: string; text: string } {
  const COLORS = [
    { bg: "oklch(0.92 0.06 274)", text: "oklch(0.38 0.15 274)" },   // indigo
    { bg: "oklch(0.91 0.06 310)", text: "oklch(0.40 0.16 310)" },   // violet
    { bg: "oklch(0.93 0.06 180)", text: "oklch(0.40 0.12 180)" },   // teal
    { bg: "oklch(0.93 0.07 240)", text: "oklch(0.38 0.14 240)" },   // blue
    { bg: "oklch(0.94 0.07 340)", text: "oklch(0.42 0.17 340)" },   // rose
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export async function AppSidebar({
  projectId,
  projectType,
  books,
  currentBookId,
}: AppSidebarProps) {
  const isSeries = projectType === "series";
  const firstBookId = books?.[0]?.id;

  // Fetch user for bottom section
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const email = user?.email ?? "";
  const displayName = fullName ?? email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();
  const avatarStyle = getAvatarStyle(email || displayName);

  return (
    <aside className="hidden md:flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center border-b border-sidebar-border/60 px-4 py-4">
        <Link
          href="/projects"
          className="group flex items-center gap-2"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm transition-shadow group-hover:shadow-md">
            <svg
              className="h-4 w-4 text-primary-foreground"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            plot<span className="text-primary">amour</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        <SidebarLink
          href="/projects"
          label="All Projects"
          exact
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
            {/* Series: show book selector */}
            {isSeries && books && books.length > 0 && (
              <div className="pt-3 pb-1">
                <BookSelector
                  projectId={projectId}
                  books={books}
                  currentBookId={currentBookId ?? firstBookId ?? ""}
                />
              </div>
            )}

            <div className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {isSeries ? "Current Book" : "Project"}
            </div>

            {/* Series overview link */}
            {isSeries && (
              <SidebarLink
                href={`/project/${projectId}/series`}
                label="Series Overview"
                icon={
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                }
              />
            )}

            <SidebarLink
              href={`/project/${projectId}/timeline`}
              label="Timeline"
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

      {/* Delete project — only on drill-down */}
      {projectId && (
        <div className="px-2 pb-1">
          <DeleteProjectButton projectId={projectId} />
        </div>
      )}

      {/* User section */}
      <div className="border-t border-sidebar-border bg-sidebar-accent/30 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          {/* Avatar */}
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-sm"
            style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
          >
            {initial}
          </div>
          {/* Name + email */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground/80 leading-none">
              {displayName}
            </p>
          </div>
          {/* Sign out icon button */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Sign out"
              className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
