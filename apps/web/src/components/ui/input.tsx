import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full bg-white dark:bg-stone-800 px-3 py-2 text-base border-2 border-black dark:border-white shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-stone-900 dark:file:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
