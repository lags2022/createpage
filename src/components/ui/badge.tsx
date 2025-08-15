import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

const variantClass: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:
    "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30",
  secondary:
    "bg-secondary text-secondary-foreground ring-1 ring-inset ring-border/60",
  outline:
    "bg-transparent text-foreground ring-1 ring-inset ring-border/70",
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
        variantClass[variant],
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = "Badge"

export { Badge }
