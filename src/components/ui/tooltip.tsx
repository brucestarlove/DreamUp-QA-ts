"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
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

const tooltipContentVariants = cva(
  "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      colorScheme: {
        chic: "bg-dark-navy border-light-blue/30 text-light-blue shadow-elevated",
        'purple-pink': "bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-purple-500/50 text-white backdrop-blur-sm shadow-glow-cyan",
        'violet-purple': "bg-gradient-to-br from-violet-900/90 to-purple-900/90 border-violet-500/50 text-white backdrop-blur-sm shadow-glow-cyan",
        'pink-violet': "bg-gradient-to-br from-pink-900/90 to-violet-900/90 border-pink-500/50 text-white backdrop-blur-sm shadow-glow-cyan",
        'blue-cyan': "bg-gradient-to-br from-blue-900/90 to-cyan-900/90 border-blue-500/50 text-white backdrop-blur-sm shadow-glow-cyan",
        'cyan-teal': "bg-gradient-to-br from-cyan-900/90 to-teal-900/90 border-cyan-500/50 text-white backdrop-blur-sm shadow-glow-cyan",
        'teal-emerald': "bg-gradient-to-br from-teal-900/90 to-emerald-900/90 border-teal-500/50 text-white backdrop-blur-sm shadow-glow-cyan",
        'emerald-cyan': "bg-gradient-to-br from-emerald-900/90 to-cyan-900/90 border-emerald-500/50 text-white backdrop-blur-sm shadow-glow-cyan",
        'yellow-green': "bg-gradient-to-br from-yellow-900/90 to-green-900/90 border-yellow-500/50 text-white backdrop-blur-sm shadow-glow-cyan",
        'blues': "bg-gradient-to-br from-blue-900/90 to-blue-800/90 border-blue-400/50 text-white backdrop-blur-sm shadow-glow-cyan",
        'cosmic': "bg-gradient-to-br from-purple-900/90 via-pink-900/90 to-violet-900/90 border-purple-500/50 text-white backdrop-blur-sm shadow-glow-cyan",
      },
    },
    defaultVariants: {
      colorScheme: "chic",
    },
  }
)

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  colorScheme?: GradientColorScheme
}

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ colorScheme = "chic", className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(tooltipContentVariants({ colorScheme }), className)}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
