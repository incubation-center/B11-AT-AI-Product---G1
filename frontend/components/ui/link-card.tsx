// file: components/ui/link-card.tsx
import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface LinkCardProps extends Omit<HTMLMotionProps<"a">, "title"> {
  title: string;
  description: string;
  imageUrl: string;
  href: string;
}

const LinkCard = React.forwardRef<HTMLAnchorElement, LinkCardProps>(
  ({ className, title, description, imageUrl, href, ...props }, ref) => {
    const cardVariants = {
      initial: { scale: 1, y: 0 },
      hover: {
        scale: 1.03,
        y: -5,
        transition: {
          type: "spring" as const,
          stiffness: 300,
          damping: 15,
        },
      },
    };

    return (
      <motion.a
        ref={ref}
        href={href}
        rel="noopener noreferrer"
        className={cn(
          "group relative flex h-80 w-full flex-col justify-between overflow-hidden",
          "rounded-2xl border border-slate-200 bg-white p-6 text-[#002e6b] shadow-xl shadow-slate-200/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c61c2f] focus-visible:ring-offset-2",
          className
        )}
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        aria-label={`Learn more about ${title}`}
        {...props}
      >
        {/* Text content */}
        <div className="z-10">
          <h3 className="mb-2 font-serif text-2xl font-medium tracking-tight text-[#002e6b]">
            {title}
          </h3>
          <p className="max-w-[75%] text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        </div>

        {/* Image in bottom-right corner */}
        <div className="absolute bottom-0 right-0 h-44 w-44 translate-x-6 translate-y-6">
          <motion.img
            src={imageUrl}
            alt={`${title} illustration`}
            className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-110"
          />
        </div>
      </motion.a>
    );
  }
);

LinkCard.displayName = "LinkCard";

export { LinkCard };
