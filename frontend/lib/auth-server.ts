import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { API_URL, type SessionResponse } from "@/lib/auth";

function toCookieHeader(entries: Array<{ name: string; value: string }>) {
  return entries.map(({ name, value }) => `${name}=${value}`).join("; ");
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const cookieHeader = toCookieHeader(cookieStore.getAll());

  if (!cookieHeader) {
    return null;
  }

  const response = await fetch(`${API_URL}/api/auth/get-session`, {
    method: "GET",
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as SessionResponse;
  return data?.user ? data : null;
}

export async function requireServerSession() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return session;
}

export async function redirectIfAuthenticated(pathname = "/dashboard") {
  const session = await getServerSession();

  if (session?.user) {
    redirect(pathname);
  }
}
