import { auth } from "@/lib/auth";
import SidebarClient from "./SideBarClient";

export default async function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return <SidebarClient session={session}>{children}</SidebarClient>;
}