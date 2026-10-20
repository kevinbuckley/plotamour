import Link from "next/link";
import { MobileNavSheet } from "@/components/shared/mobile-nav-sheet";
import { SidebarLink } from "@/components/shared/sidebar-link";
import { BookSelector } from "@/components/series/book-selector";
import { DeleteProjectButton } from "@/components/shared/delete-project-button";
import { FeatureRequestButton } from "@/components/shared/feature-request-button";
import { createClient } from "@/lib/db/server";
import type { Book, ProjectType } from "@/lib/types/database";

interface MobileNavProps {
  projectId?: string;
  projectType?: ProjectType;
  books?: Book[];
  currentBookId?: string;
}

/** Deterministic avatar color from a string (name or email) */
function getAvatarStyle(seed: string): { bg: string; text: string } {
  const COLORS = [
    { bg: "oklch(0.92 0.06 274)", text: "oklch(0.38 0.15 274)" },
    { bg: "oklch(0.91 0.06 310)", text: "oklch(0.40 0.16 310)" },
    { bg: "oklch(0.93 0.06 180)", text: "oklch(0.40 0.12 180)" },
    { bg: "oklch(0.93 0.07 240)", text: "oklch(0.38 0.14 240)" },
    { bg: "oklch(0.94 0.07 340)", text: "oklch(0.42 0.17 340)" },
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export async function MobileNav({
  projectId,
  projectType,
  books,
  currentBookId,
}: MobileNavProps) {
  const isSeries = projectType === "series";
  const firstBookId = books?.[0]?.id;

  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const email = user?.email ?? "";
  const displayName = fullName ?? email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();
  const avatarStyle = getAvatarStyle(email || displayName);

  return (
    <header className="flex md:hidden items-center justify-between border-b border-sidebar-border bg-sidebar px-4 h-14 shrink-0">
      {/* Logo */}
      <Link href="/projects" className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
          <svg className="h-4 w-4 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
          </svg>
        </div>
        <span className="text-base font-bold tracking-tight text-foreground">
          plot<span className="text-primary">amour</span>
        </span>
      </Link>

      {/* Hamburger + Sheet */}
      <MobileNavSheet>
        <div className="flex flex-col h-full">
          {/* Nav links */}
          <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  }
                />
                <SidebarLink
                  href={`/project/${projectId}/visualizations`}
                  label="Visualizations"
                  icon={
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
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
                  href={`/project/${projectId}/cast-map`}
                  label="Cast Map"
                  icon={
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
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

                <div className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Insights
                </div>
                <SidebarLink
                  href={`/project/${projectId}/themes`}
                  label="Themes & Motifs"
                  icon={
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  }
                />
                <SidebarLink
                  href={`/project/${projectId}/writing-stats`}
                  label="Writing Stats"
                  icon={
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  }
                />
              </>
            )}
          </nav>

          {/* Delete project */}
          {projectId && (
            <div className="px-2 pb-1">
              <DeleteProjectButton projectId={projectId} />
            </div>
          )}

          {/* Discord + Feature request */}
          <div className="px-2 pb-2 space-y-0.5">
            <a
              href="https://discord.gg/ug2WkRh8"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[#5865F2]/10 text-[#5865F2]"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join our Discord
            </a>
            <FeatureRequestButton />
          </div>

          {/* User section */}
          <div className="border-t border-sidebar-border bg-sidebar-accent/30 p-3">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-sm"
                style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground/80 leading-none">
                  {displayName}
                </p>
              </div>
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
        </div>
      </MobileNavSheet>
    </header>
  );
}
