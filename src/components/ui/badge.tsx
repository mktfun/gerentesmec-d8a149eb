
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        secondary:
          "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100",
        destructive:
          "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
        outline: "border-gray-300 text-gray-700 hover:bg-gray-50",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
        warning:
          "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
        purple:
          "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100",
        orange:
          "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
