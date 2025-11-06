import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'glass' | 'dark-glass' | 'gradient-cyan-purple' | 'gradient-purple-blue' |  'gradient-pink-purple' | 'gradient-cyan-vibrant' | 'default' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variantClasses = {
    glass: "glass-white border border-white/10 shadow-deep",
    'dark-glass': "glass-dark border border-light-blue/20 shadow-elevated",
    'gradient-cyan-purple': "bg-gradient-cyan-purple shadow-elevated text-white",
    'gradient-purple-blue': "bg-gradient-purple-blue shadow-elevated text-white",
    'gradient-pink-purple': "bg-gradient-pink-purple shadow-elevated text-white",
    'gradient-cyan-vibrant': "bg-gradient-cyan-vibrant shadow-elevated text-white",
    default: "bg-card text-card-foreground shadow-default",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-md p-sm",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-md border-b border-white/10", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-h3 font-semibold leading-none tracking-tight text-light-blue", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-body-small text-white/70", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-md", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-md border-t border-white/10", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

