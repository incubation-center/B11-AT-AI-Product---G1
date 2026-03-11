import type { ReactNode } from "react";

import { requireServerSession } from "@/lib/auth-server";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireServerSession();

  return children;
}
