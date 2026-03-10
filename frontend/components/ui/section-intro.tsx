"use client";

import { cn } from "@/lib/utils";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  eyebrowClassName?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
  eyebrowClassName,
  className,
  titleClassName,
  descriptionClassName,
}: SectionIntroProps) {
  const centered = align === "center";

  return (
    <div className={cn(centered && "text-center", className)}>
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.25em]",
          eyebrowClassName
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-2 text-balance text-2xl font-semibold leading-tight text-[#002e6b] md:text-3xl",
          titleClassName
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-3 text-sm leading-relaxed text-slate-700",
            centered && "mx-auto",
            descriptionClassName
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
