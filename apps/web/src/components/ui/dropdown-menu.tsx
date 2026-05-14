"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  onOpenChange: () => {},
})

function DropdownMenu({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = (val: boolean) => {
    if (!isControlled) setInternalOpen(val)
    onOpenChange?.(val)
  }

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DropdownMenuContext)
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpenChange(!open)}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, forwardedRef) => {
  const { open, onOpenChange } = React.useContext(DropdownMenuContext)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const combinedRef = (node: HTMLDivElement | null) => {
    (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    if (typeof forwardedRef === "function") forwardedRef(node)
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
  }

  React.useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      ref={combinedRef}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-card p-1 shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel }
