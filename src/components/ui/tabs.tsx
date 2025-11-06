"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Gradient color schemes matching Card component
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

const tabsListVariants = cva(
  "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
  {
    variants: {
      colorScheme: {
        chic: "bg-mid-navy/50 border border-light-blue/20",
        'purple-pink': "bg-purple-900/20 border border-purple-500/30",
        'violet-purple': "bg-violet-900/20 border border-violet-500/30",
        'pink-violet': "bg-pink-900/20 border border-pink-500/30",
        'blue-cyan': "bg-blue-900/20 border border-blue-500/30",
        'cyan-teal': "bg-cyan-900/20 border border-cyan-500/30",
        'teal-emerald': "bg-teal-900/20 border border-teal-500/30",
        'emerald-cyan': "bg-emerald-900/20 border border-emerald-500/30",
        'yellow-green': "bg-yellow-900/20 border border-yellow-500/30",
        'blues': "bg-blue-900/20 border border-blue-400/30",
        'cosmic': "bg-purple-900/20 border border-purple-500/30",
      },
    },
    defaultVariants: {
      colorScheme: "chic",
    },
  }
)

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      colorScheme: {
        chic: "data-[state=active]:bg-light-blue data-[state=active]:text-dark-navy data-[state=active]:shadow-sm",
        'purple-pink': "data-[state=active]:bg-gradient-purple-pink data-[state=active]:text-white data-[state=active]:shadow-sm",
        'violet-purple': "data-[state=active]:bg-gradient-violet-purple data-[state=active]:text-white data-[state=active]:shadow-sm",
        'pink-violet': "data-[state=active]:bg-gradient-pink-violet data-[state=active]:text-white data-[state=active]:shadow-sm",
        'blue-cyan': "data-[state=active]:bg-gradient-blue-cyan data-[state=active]:text-white data-[state=active]:shadow-sm",
        'cyan-teal': "data-[state=active]:bg-gradient-cyan-teal data-[state=active]:text-white data-[state=active]:shadow-sm",
        'teal-emerald': "data-[state=active]:bg-gradient-teal-emerald data-[state=active]:text-white data-[state=active]:shadow-sm",
        'emerald-cyan': "data-[state=active]:bg-gradient-emerald-cyan data-[state=active]:text-white data-[state=active]:shadow-sm",
        'yellow-green': "data-[state=active]:bg-gradient-yellow-green data-[state=active]:text-white data-[state=active]:shadow-sm",
        'blues': "data-[state=active]:bg-gradient-blues data-[state=active]:text-white data-[state=active]:shadow-sm",
        'cosmic': "data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white data-[state=active]:shadow-sm",
      },
    },
    defaultVariants: {
      colorScheme: "chic",
    },
  }
)

export interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  colorScheme?: GradientColorScheme
}

const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ colorScheme, className, ...props }, ref) => (
  <TabsPrimitive.Root ref={ref} className={className} {...props} />
))
Tabs.displayName = TabsPrimitive.Root.displayName

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ colorScheme = "chic", className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ colorScheme }), className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ colorScheme = "chic", className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ colorScheme }), className)}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

