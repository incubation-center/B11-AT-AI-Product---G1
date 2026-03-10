"use client";

import { Card, CardBody } from "@heroui/react";
import { BotMessageSquare, LineChart, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

import { SectionIntro } from "@/components/ui/section-intro";

const items = [
  {
    icon: BotMessageSquare,
    title: "AI that knows your products",
    body: "Coolhat connects directly to your real catalog, so the assistant can answer questions about ingredients, stock, pricing, and bundles instead of guessing.",
  },
  {
    icon: Smartphone,
    title: "Built for Telegram first",
    body: "SME owners live in Telegram. Coolhat sends orders, updates, and customer chats straight to your phone so you don’t need to learn a new dashboard.",
  },
  {
    icon: LineChart,
    title: "From idea to storefront in days",
    body: "Start from a simple description of your shop. Coolhat helps you generate products, copy, and a shoppable storefront without hiring a full dev team.",
  },
];

export function Features() {
  return (
    <motion.section
      id="why"
      className="bg-white py-20 text-[#002e6b] md:py-24"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-6xl px-4">
        <SectionIntro
          eyebrow="Why Coolhat"
          title="One assistant for your customers and your team."
          description="Coolhat combines an AI product expert, storefront builder, and Telegram Mini App into one simple flow, so small shops can sell online with the same experience as bigger brands."
          className="max-w-2xl"
          eyebrowClassName="text-[#c61c2f]"
          descriptionClassName="text-[#002e6b]"
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.title}
              className="border border-slate-200 bg-white shadow-xl shadow-slate-200/80"
            >
              <CardBody className="space-y-3 p-5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#c61c2f]/10 text-[#c61c2f]">
                  <item.icon size={18} />
                </div>
                <h3 className="text-sm font-semibold text-[#002e6b]">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-700">
                  {item.body}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

