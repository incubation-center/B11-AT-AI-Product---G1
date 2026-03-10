import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerSession } from "@/lib/auth-server";

export default async function DashboardPage() {
  const session = await getServerSession();
  const user = session?.user;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff,_#eef4ff_48%,_#fff7eb)] px-4 py-8 text-[#002e6b]">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c61c2f]">
            Protected Area
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Welcome back{user?.name ? `, ${user.name}` : ""}.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Everything inside <code>app/(protect)</code> now requires an active
            backend session. Without a valid Better Auth cookie, the layout
            redirects to <code>/sign-in</code>.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold">Current session</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">User ID</dt>
                <dd className="mt-1 font-medium text-slate-900">{user?.id ?? "-"}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-1 font-medium text-slate-900">{user?.email ?? "-"}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Email verified</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {user?.emailVerified ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold">Next routes</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Put owner-only pages such as store setup, products, orders, and
              billing under <code>app/(protect)</code>. Marketing and auth pages
              belong under <code>app/(public)</code>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#c61c2f] px-4 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-red-200/70 transition hover:bg-[#a71726]"
              >
                Back to landing page
              </Link>
              <Link
                href="/telegram"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#002e6b]/20 bg-white px-4 text-xs font-semibold uppercase tracking-wide text-[#002e6b] transition hover:bg-[#002e6b]/5"
              >
                Open Telegram mini app
              </Link>
            </div>
            <div className="mt-6">
              <SignOutButton />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
