import type { Metadata } from "next"
import "@/globals.css"

export const metadata: Metadata = {
  title: "Dashboard | DreamUp Browser Game QA Pipeline",
  description: "AI-powered browser game quality assurance testing dashboard",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

