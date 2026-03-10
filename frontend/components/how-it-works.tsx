"use client";

import { motion } from "framer-motion";

import { SectionIntro } from "@/components/ui/section-intro";

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
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-2">
          <SectionIntro
            eyebrow="How it works"
            title="From product idea to AI-assisted storefront in three steps."
            eyebrowClassName="text-[#ffbd59]"
            titleClassName="text-[#002e6b]"
          />
          <ol className="space-y-4 text-sm">
            <li>
              <span className="font-semibold text-[#ffbd59]">1. </span>
              Describe your shop, products, and target customers. Coolhat turns
              that into a first storefront and product list.
            </li>
            <li>
              <span className="font-semibold text-[#ffbd59]">2. </span>
              Connect your Telegram so new orders and questions arrive in a
              channel you already use every day.
            </li>
            <li>
              <span className="font-semibold text-[#ffbd59]">3. </span>
              Let the AI assistant handle common questions, recommend products,
              and generate clean checkout links for your buyers.
            </li>
          </ol>
        </div>
      </div>
    </motion.section>
  );
}
