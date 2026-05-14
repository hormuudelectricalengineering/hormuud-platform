"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  LayoutDashboard, 
  ClipboardList,
  Briefcase, 
  Users, 
  UserCog,
  Wrench,
  MessageSquare,
  FileEdit,
  Settings,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/job-queue", label: "Job Queue", icon: ClipboardList },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/custom-services", label: "Custom Services", icon: FileEdit },
  { href: "/admin/engineers", label: "Engineers", icon: UserCog },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
]

function PendingCount({ endpoint, param }: { endpoint: string; param?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(endpoint)
        const data = await res.json()
        if (res.ok) {
          setCount(param ? data[param] : data.count ?? 0)
        }
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [endpoint, param])

  if (count === 0) return null
  return <Badge variant="destructive" className="h-5 px-1.5 text-xs ml-auto">{count}</Badge>
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="h-full overflow-y-auto bg-sidebar flex flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-foreground">Hormuud</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/admin" && pathname.startsWith(item.href + "/"))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "drop-shadow-sm")} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/job-queue" && <PendingCount endpoint="/api/admin/job-queue/count" />}
              {item.href === "/admin/custom-services" && <PendingCount endpoint="/api/admin/custom-services/count" param="pending_count" />}
              {item.href === "/admin/messages" && <PendingCount endpoint="/api/admin/messages/unread-count" param="count" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
            pathname === "/admin/settings"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
