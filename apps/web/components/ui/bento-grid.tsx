import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-[90rem] grid-cols-1 gap-3 sm:gap-4 p-4 sm:p-6",
        "sm:grid-cols-2 md:grid-cols-3",
        "sm:auto-rows-[15rem] md:auto-rows-[20rem]",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  cta,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  cta?: {
    text: string;
    href: string;
  };
}) => {
  return (
    <div
      className={cn(
        "group/bento shadow-input row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-neutral-200 bg-white p-4 transition duration-200 hover:shadow-xl   ",
        className,
      )}
    >
      {header}
      <div className="flex flex-col justify-between flex-1">
        <div className="transition duration-200 group-hover/bento:translate-x-2">
          {icon}
          <div className="mt-2 mb-2 font-sans font-bold text-neutral-600 ">
            {title}
          </div>
          <div className="font-sans text-sm font-normal text-neutral-600 ">
            {description}
          </div>
        </div>
        {cta && (
          <motion.a
            href={cta.href}
            className="inline-flex items-center mt-4 text-sm font-medium text-[#ff3b30] hover:text-[#ff5e54] transition-colors"
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            {cta.text}
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.a>
        )}
      </div>
    </div>
  );
};
