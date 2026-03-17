import { ProtectedPage } from "@/components/CheckAuth";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "./_components/DashboardSidebar";
import UserProfileDropdownPage from "./_components/UserProfileDropDown";
import { auth } from "@/lib/auth";
import DashboardHeaderPage from "./_components/DashboardHeader";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className=" bg-[#e4e7eb] lg:pl-2.5 lg:pr-2.5">
      <DashboardSidebar>
        <UserProfileDropdownPage isArrowUp isFullName />
      </DashboardSidebar>

      <main className="w-full relative bg-[#f8fafc]">
        <DashboardHeaderPage />
        <Suspense fallback={<p>Loading...</p>}>{children}</Suspense>
        <ProtectedPage />
      </main>
    </SidebarProvider>

  );
}
