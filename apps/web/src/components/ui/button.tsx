import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-2 border-black dark:border-white",
  {
    variants: {
      variant: {
        default:
          "bg-sky-500 text-white shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] hover:shadow-[2px_2px_0_black] dark:hover:shadow-[2px_2px_0_white] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        destructive:
          "bg-red-500 text-white shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] hover:shadow-[2px_2px_0_black] dark:hover:shadow-[2px_2px_0_white] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        outline:
          "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] hover:shadow-[2px_2px_0_black] dark:hover:shadow-[2px_2px_0_white] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        secondary:
          "bg-amber-400 text-stone-900 shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] hover:shadow-[2px_2px_0_black] dark:hover:shadow-[2px_2px_0_white] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        ghost:
          "border-transparent shadow-none hover:bg-stone-100 dark:hover:bg-stone-800",
        link: "border-transparent shadow-none text-sky-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
