"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const SheetContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void }>({
  open: false,
  onOpenChange: () => {},
})

function Sheet({ open = false, onOpenChange, children }: SheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(open)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = (val: boolean) => {
    if (!isControlled) setInternalOpen(val)
    onOpenChange?.(val)
  }

  return (
    <SheetContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { onOpenChange } = React.useContext(SheetContext)
  return (
    <button ref={ref} onClick={() => onOpenChange(true)} className={className} {...props}>
      {children}
    </button>
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" | "top" | "bottom" }
>(({ className, children, side = "right", ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(SheetContext)

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  const sideClasses = {
    right: "inset-y-0 right-0 h-full w-full max-w-lg border-l",
    left: "inset-y-0 left-0 h-full w-full max-w-lg border-r",
    top: "inset-x-0 top-0 w-full max-h-[50vh] border-b",
    bottom: "inset-x-0 bottom-0 w-full max-h-[50vh] border-t",
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => onOpenChange(false)} />
      <div
        ref={ref}
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform duration-200",
          sideClasses[side],
          className
        )}
        {...props}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </>
  )
})
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left mb-6", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
SheetDescription.displayName = "SheetDescription"

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription }
