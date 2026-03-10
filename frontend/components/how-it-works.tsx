"use client";

import { motion } from "framer-motion";
import { BotMessageSquare, Pencil, Send } from "lucide-react";
import type React from "react";

import { cn } from "@/lib/utils";

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

const StepCard: React.FC<StepCardProps> = ({
  icon,
  title,
  description,
  benefits,
}) => (
  <div
    className={cn(
      "relative rounded-2xl border border-slate-200 bg-white p-6 text-[#002e6b] transition-all duration-300 ease-in-out",
      "hover:scale-105 hover:shadow-xl hover:shadow-slate-200/80 hover:border-[#ffbd59]/60"
    )}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#002e6b]/5 text-[#c61c2f]">
      {icon}
    </div>
    <h3 className="mb-2 text-lg font-semibold text-[#002e6b]">{title}</h3>
    <p className="mb-5 text-sm leading-relaxed text-slate-500">{description}</p>
    <ul className="space-y-3">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-center gap-3 text-sm">
          <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#ffbd59]/20">
            <div className="h-2 w-2 rounded-full bg-[#ffbd59]" />
          </div>
          <span className="text-slate-600">{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
);

const stepsData = [
  {
    icon: <Pencil className="h-6 w-6" />,
    title: "Describe your shop",
    description:
      "Tell Coolhat about your products, pricing, and customers. It turns that into a ready-to-share storefront and product catalog.",
    benefits: [
      "AI-generated product descriptions",
      "Instant storefront preview",
      "Easy edits at any time",
    ],
  },
  {
    icon: <Send className="h-6 w-6" />,
    title: "Connect your Telegram",
    description:
      "Link the channel you already use every day. New orders, buyer questions, and updates land right there.",
    benefits: [
      "No new dashboard to learn",
      "Real-time order notifications",
      "Works with existing groups",
    ],
  },
  {
    icon: <BotMessageSquare className="h-6 w-6" />,
    title: "Let the AI handle it",
    description:
      "Your AI assistant answers product questions, recommends items, and generates clean checkout links for buyers.",
    benefits: [
      "24/7 customer responses",
      "Smart product recommendations",
      "One-tap checkout links",
    ],
  },
];

export function HowItWorks() {
  return (
    <motion.section
      id="how-it-works"
      className="bg-white py-16 text-[#002e6b] md:py-20"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#ffbd59]">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#002e6b] md:text-4xl">
            From product idea to AI-assisted storefront in three steps.
          </h2>
        </div>

        {/* Step indicators */}
        <div className="relative mx-auto mb-8 max-w-4xl">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2 bg-slate-200"
          />
          <div className="relative grid grid-cols-3">
            {stepsData.map((_, index) => (
              <div
                key={index}
                className="flex h-8 w-8 items-center justify-center justify-self-center rounded-full bg-[#ffbd59] text-sm font-bold text-white ring-4 ring-white"
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Step cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
