import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { getServerSession } from "@/lib/auth-server";

export default async function DashboardPage() {
  const session = await getServerSession();
  const user = session?.user;

  return (
    <SidebarDemo
      userName={user?.name}
      userEmail={user?.email}
      emailVerified={user?.emailVerified}
    />
  );
}
