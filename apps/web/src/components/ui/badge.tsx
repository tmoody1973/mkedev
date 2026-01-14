import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors border-2 border-black dark:border-white",
  {
    variants: {
      variant: {
        default:
          "bg-sky-500 text-white shadow-[2px_2px_0_black] dark:shadow-[2px_2px_0_white]",
        secondary:
          "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100 shadow-[2px_2px_0_black] dark:shadow-[2px_2px_0_white]",
        destructive:
          "bg-red-500 text-white shadow-[2px_2px_0_black] dark:shadow-[2px_2px_0_white]",
        outline:
          "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-[2px_2px_0_black] dark:shadow-[2px_2px_0_white]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
