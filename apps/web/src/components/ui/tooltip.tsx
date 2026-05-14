"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
}

const Tooltip = ({ content, children, side = "top" }: TooltipProps) => {
  const [visible, setVisible] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setVisible(true), 300)
  }

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    setVisible(false)
  }

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && (
        <div
          className={cn(
            "absolute z-50 px-2.5 py-1.5 text-xs rounded-md bg-popover text-popover-foreground shadow-md border animate-in fade-in-0 zoom-in-95 pointer-events-none whitespace-nowrap",
            positionClasses[side]
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

export { Tooltip }
