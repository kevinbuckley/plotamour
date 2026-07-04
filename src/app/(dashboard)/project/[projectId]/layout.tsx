import { AppSidebar } from "@/components/shared/app-sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { getProject } from "@/lib/services/projects";
import { getBooks } from "@/lib/services/books";
import { redirect } from "next/navigation";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await getProject(projectId);
  if (!project) redirect("/projects");

  const books = await getBooks(projectId);

  return (
    <div className="flex h-screen">
      <AppSidebar
        projectId={projectId}
        projectType={project.project_type}
        books={books}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <MobileNav
          projectId={projectId}
          projectType={project.project_type}
          books={books}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
