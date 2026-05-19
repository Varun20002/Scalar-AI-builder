import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap select-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Cartoon primary — terracotta fill, ink outline, hard offset shadow */
        default:
          "bg-primary text-primary-foreground " +
          "border-[2.5px] border-[oklch(0.17_0.015_60)] " +
          "shadow-[0_5px_0_oklch(0.17_0.015_60)] " +
          "hover:-translate-y-0.5 hover:shadow-[0_7px_0_oklch(0.17_0.015_60)] " +
          "active:translate-y-[3px] active:shadow-[0_2px_0_oklch(0.17_0.015_60)] " +
          "transition-all duration-150",
        outline:
          "border border-border bg-background hover:bg-muted hover:text-foreground " +
          "transition-colors duration-150",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 " +
          "transition-colors duration-150",
        ghost:
          "hover:bg-muted hover:text-foreground transition-colors duration-150",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 " +
          "focus-visible:border-destructive/40 focus-visible:ring-destructive/20 " +
          "transition-colors duration-150",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-6",
        xs: "h-6 gap-1 rounded-full px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-full px-4 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-8 text-base",
        icon: "size-9 rounded-full",
        "icon-xs": "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-full [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 rounded-full",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
