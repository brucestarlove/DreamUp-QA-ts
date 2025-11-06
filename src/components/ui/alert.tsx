import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

type GradientColorScheme = 
  | 'chic'
  | 'purple-pink'
  | 'violet-purple'
  | 'pink-violet'
  | 'blue-cyan'
  | 'cyan-teal'
  | 'teal-emerald'
  | 'emerald-cyan'
  | 'yellow-green'
  | 'blues'
  | 'cosmic'

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      colorScheme: {
        chic: "border-light-blue/30 bg-mid-navy/30 text-light-blue",
        'purple-pink': "border-purple-500/40 bg-gradient-to-br from-purple-900/20 to-pink-900/20 text-purple-200 backdrop-blur-sm",
        'violet-purple': "border-violet-500/40 bg-gradient-to-br from-violet-900/20 to-purple-900/20 text-violet-200 backdrop-blur-sm",
        'pink-violet': "border-pink-500/40 bg-gradient-to-br from-pink-900/20 to-violet-900/20 text-pink-200 backdrop-blur-sm",
        'blue-cyan': "border-blue-500/40 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 text-blue-200 backdrop-blur-sm",
        'cyan-teal': "border-cyan-500/40 bg-gradient-to-br from-cyan-900/20 to-teal-900/20 text-cyan-200 backdrop-blur-sm",
        'teal-emerald': "border-teal-500/40 bg-gradient-to-br from-teal-900/20 to-emerald-900/20 text-teal-200 backdrop-blur-sm",
        'emerald-cyan': "border-emerald-500/40 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 text-emerald-200 backdrop-blur-sm",
        'yellow-green': "border-yellow-500/40 bg-gradient-to-br from-yellow-900/20 to-green-900/20 text-yellow-200 backdrop-blur-sm",
        'blues': "border-blue-400/40 bg-gradient-to-br from-blue-900/20 to-blue-800/20 text-blue-200 backdrop-blur-sm",
        'cosmic': "border-purple-500/40 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-violet-900/20 text-purple-200 backdrop-blur-sm",
      },
      variant: {
        default: "",
        destructive: "",
      },
    },
    compoundVariants: [
      {
        colorScheme: "chic",
        variant: "destructive",
        className: "border-error/50 bg-error/10 text-error",
      },
      {
        colorScheme: ["purple-pink", "violet-purple", "pink-violet", "blue-cyan", "cyan-teal", "teal-emerald", "emerald-cyan", "yellow-green", "blues", "cosmic"],
        variant: "destructive",
        className: "border-pink-500/50 bg-pink-900/20 text-pink-300",
      },
    ],
    defaultVariants: {
      colorScheme: "chic",
      variant: "default",
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement> {
  colorScheme?: GradientColorScheme
  variant?: "default" | "destructive"
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ colorScheme = "chic", variant = "default", className, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ colorScheme, variant }), className)}
      {...props}
    />
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight text-white-primary", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed text-white-secondary", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
