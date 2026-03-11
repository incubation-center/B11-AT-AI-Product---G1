"use client";

import { Card, CardBody } from "@heroui/react";
import { ArrowRight, MessageCircleMore, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { CTAButton } from "@/components/ui/cta-button";

const description =
  "Coolhat is an AI-powered webstore front builder for SMEs. It gives every shop a virtual assistant that already knows all your products, helps customers find the right items, and connects orders straight into Telegram so owners can manage everything from their phone.";

export function Hero() {
  return (
    <motion.section
      id="get-started"
      className="relative overflow-hidden bg-white pb-24 pt-28 text-[#002e6b]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.06}
        duration={4}
        repeatDelay={1}
        className="[mask-image:radial-gradient(480px_circle_at_center,white,transparent)] text-[#cbd5f5]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 md:flex-row md:items-start">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#002e6b]/10 bg-[#002e6b]/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[#002e6b]">
            <Sparkles size={14} />
            <span>AI shop assistant for SMEs</span>
          </div>
          <h1 className="max-w-xl text-balance text-4xl font-semibold leading-tight tracking-tight text-[#002e6b] sm:text-5xl">
            Your virtual shop assistant is here to help
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#002e6b]">
            {description}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <CTAButton
              as={Link}
              href="#pricing"
              size="lg"
              className="px-7 text-sm shadow-xl shadow-red-200/60"
              endContent={<ArrowRight size={16} />}
            >
              Start 14-day free trial
            </CTAButton>
            <CTAButton
              as={Link}
              href="#how-it-works"
              size="lg"
              tone="secondary"
              variant="bordered"
              className="px-6 text-xs font-medium"
              endContent={<MessageCircleMore size={16} />}
            >
              See how Coolhat works
            </CTAButton>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#002e6b]">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-700">
              No credit card for trial
            </span>
            <span>Live Telegram assistant · Product-aware AI · Storefront in days</span>
          </div>
        </div>

        <div className="flex-1 md:pt-6">
          <Card className="border border-slate-200 bg-white/80 text-[#002e6b] shadow-xl shadow-slate-200/80 backdrop-blur">
            <CardBody className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Live store chat
                  </p>
                  <p className="text-sm font-semibold text-[#002e6b]">
                    Coolhat assistant · Telegram
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700">
                  Online · <span className="text-emerald-600">24/7</span>
                </span>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-6 w-6 rounded-full bg-[#ffbd59] text-center text-[11px] font-semibold text-slate-950">
                    U
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-xs leading-relaxed text-[#002e6b] shadow-sm">
                    Do you have something for sensitive skin under $20?
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-6 w-6 rounded-full bg-[#c61c2f] text-center text-[11px] font-semibold text-white">
                    AI
                  </div>
                  <div className="space-y-2 rounded-2xl rounded-br-sm bg-slate-100 px-3 py-2 text-xs leading-relaxed text-[#002e6b]">
                    <p>
                      I&apos;ve found 3 products that match: all fragrance-free, made
                      for sensitive skin and in your budget.
                    </p>
                    <ul className="list-inside list-disc text-[11px] text-slate-700">
                      <li>Gentle Rice Cleanser - $14.50</li>
                      <li>Calming Toner Mist - $11.90</li>
                      <li>Soothing Night Cream - $19.80</li>
                    </ul>
                    <p className="text-[11px] text-emerald-700">
                      Reply with the product number and I&apos;ll create a checkout
                      link for you.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Powered by your real product catalog, checkout flow, and Telegram
                Mini App - not a generic chatbot.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.section>
  );
}
