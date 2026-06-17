import { cn } from "@/lib/utils"

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode
  className?: string
  variant?: "default" | "outline" | "accent"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-secondary text-secondary-foreground",
        variant === "accent" && "bg-primary/10 text-primary",
        variant === "outline" && "border border-border text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  )
}
