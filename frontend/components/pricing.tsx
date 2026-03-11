"use client";

import { Button, Card, CardBody, Chip } from "@heroui/react";
import { Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  "Up to 1 live storefront",
  "Built‑in AI shop assistant",
  "Telegram Mini App integration",
  "Unlimited AI product drafting",
  "Owner notifications via Telegram",
];

export function Pricing() {
  return (
    <motion.section
      id="pricing"
      className="bg-white py-20 text-[#002e6b] md:py-24"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c61c2f]">
          Pricing
        </p>
        <h2 className="mt-2 text-balance text-2xl font-semibold leading-tight text-[#002e6b] md:text-3xl">
          Simple plan, designed for growing SMEs.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          Try Coolhat free for 14 days. Keep your products, data, and storefront
          even after the trial — just upgrade to continue using the AI assistant
          and Telegram integration.
        </p>

        <div className="mx-auto mt-10 max-w-xl">
          <Card className="border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
            <CardBody className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 text-left">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Coolhat Starter
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-[#002e6b]">$29</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                </div>
                <Chip
                  color="success"
                  variant="flat"
                  className="border border-emerald-500/40 bg-emerald-500/10 text-[11px] font-medium uppercase tracking-wide text-emerald-800"
                >
                  14 days free trial
                </Chip>
              </div>

              <ul className="space-y-2 text-left text-xs text-slate-700">
                {features.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 rounded-full bg-emerald-500/15 p-0.5 text-emerald-300">
                      <Check size={14} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 text-left">
                <Button
                  as={Link}
                  href="#get-started"
                  size="lg"
                  radius="full"
                  className="w-full bg-[#c61c2f] text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-red-200/70 hover:bg-[#a71726]"
                >
                  Start 14-day free trial
                </Button>
                <p className="text-[11px] text-slate-500">
                  No setup fee · Cancel anytime · Ideal for individual shops and
                  small teams getting their first AI-powered storefront online.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.section>
  );
}

