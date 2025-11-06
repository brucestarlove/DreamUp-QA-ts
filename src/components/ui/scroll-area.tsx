"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
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

const scrollAreaThumbVariants = cva(
  "relative flex-1 rounded-full",
  {
    variants: {
      colorScheme: {
        chic: "bg-light-blue/50 hover:bg-light-blue/70",
        'purple-pink': "bg-gradient-purple-pink hover:opacity-90",
        'violet-purple': "bg-gradient-violet-purple hover:opacity-90",
        'pink-violet': "bg-gradient-pink-violet hover:opacity-90",
        'blue-cyan': "bg-gradient-blue-cyan hover:opacity-90",
        'cyan-teal': "bg-gradient-cyan-teal hover:opacity-90",
        'teal-emerald': "bg-gradient-teal-emerald hover:opacity-90",
        'emerald-cyan': "bg-gradient-emerald-cyan hover:opacity-90",
        'yellow-green': "bg-gradient-yellow-green hover:opacity-90",
        'blues': "bg-gradient-blues hover:opacity-90",
        'cosmic': "bg-gradient-cosmic hover:opacity-90",
      },
    },
    defaultVariants: {
      colorScheme: "chic",
    },
  }
)

export interface ScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  colorScheme?: GradientColorScheme
}

const ScrollArea = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ colorScheme = "chic", className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar colorScheme={colorScheme} />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const scrollbarVariants = cva(
  "flex touch-none select-none transition-colors",
  {
    variants: {
      colorScheme: {
        chic: "",
        'purple-pink': "",
        'violet-purple': "",
        'pink-violet': "",
        'blue-cyan': "",
        'cyan-teal': "",
        'teal-emerald': "",
        'emerald-cyan': "",
        'yellow-green': "",
        'blues': "",
        'cosmic': "",
      },
    },
    defaultVariants: {
      colorScheme: "chic",
    },
  }
)

export interface ScrollBarProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  colorScheme?: GradientColorScheme
  orientation?: "vertical" | "horizontal"
}

const ScrollBar = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ colorScheme = "chic", className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      scrollbarVariants({ colorScheme }),
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaThumb colorScheme={colorScheme} />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export interface ScrollAreaThumbProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaThumb> {
  colorScheme?: GradientColorScheme
}

const ScrollAreaThumb = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaThumb>,
  ScrollAreaThumbProps
>(({ colorScheme = "chic", className, ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaThumb
    ref={ref}
    className={cn(scrollAreaThumbVariants({ colorScheme }), className)}
    {...props}
  />
))
ScrollAreaThumb.displayName = ScrollAreaPrimitive.ScrollAreaThumb.displayName

export { ScrollArea, ScrollBar, ScrollAreaThumb }
