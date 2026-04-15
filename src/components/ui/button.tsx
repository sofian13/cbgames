import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border border-[color:var(--brand)]/45 bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-2)] text-white shadow-[0_10px_26px_rgba(46,124,255,0.34)] hover:from-[color:var(--brand-light)] hover:to-[color:var(--brand-accent)] hover:shadow-[0_14px_32px_rgba(139,92,246,0.4)]",
        destructive:
          "border border-red-400/40 bg-red-500/75 text-white hover:bg-red-500/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[color:var(--line-brand)] bg-[rgba(11,16,40,0.78)] text-[color:var(--brand-light)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-[color:var(--brand)] hover:bg-[rgba(46,124,255,0.10)] hover:text-white",
        secondary:
          "border border-[color:var(--line-violet)] bg-[rgba(139,92,246,0.10)] text-[color:var(--brand-accent)] hover:bg-[rgba(139,92,246,0.18)] hover:text-white",
        ghost:
          "text-white/70 hover:bg-[rgba(46,124,255,0.10)] hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
