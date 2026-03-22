import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff4de,_#fff_38%,_#eef3ff)] px-4 py-10 text-[#002e6b]">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,_#002e6b,_#0a4b93_58%,_#ffbd59)] p-8 text-white shadow-[0_30px_80px_rgba(0,46,107,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Coolhat Access
          </p>
          <h1 className="mt-6 max-w-sm text-4xl font-semibold leading-tight">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/82">
            {description}
          </p>
          <div className="mt-10 grid gap-3 text-sm text-white/85 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-2xl font-semibold">1</div>
              <p className="mt-2">Create an account with email and password.</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-2xl font-semibold">2</div>
              <p className="mt-2">
                Verify your email and start your store setup.
              </p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="text-2xl font-semibold">3</div>
              <p className="mt-2">
                Manage products and Telegram flows from one place.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
