import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 will-change-transform",
  {
    variants: {
      variant: {
        primary:
          "bg-copper text-ink hover:bg-copper-bright shadow-[0_8px_24px_-6px_rgba(212,165,116,0.4)] hover:shadow-[0_12px_32px_-8px_rgba(232,201,168,0.5)] active:scale-[0.98]",
        outline:
          "border border-border-bright bg-transparent text-foreground hover:border-copper hover:text-copper-bright hover:bg-copper/5",
        ghost:
          "bg-transparent text-muted hover:text-foreground hover:bg-surface-2",
        subtle:
          "bg-surface-2 text-foreground border border-border hover:border-border-bright hover:bg-surface-3",
        glass:
          "glass text-foreground hover:bg-surface-2/80",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
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
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
