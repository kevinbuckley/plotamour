import { AppSidebar } from "@/components/shared/app-sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { TokenSync } from "@/components/shared/token-sync";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <TokenSync />
      <AppSidebar />
      <div className="flex flex-1 flex-col min-h-0">
        <MobileNav />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
