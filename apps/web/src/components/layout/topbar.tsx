"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, ChevronDown, LogOut, Settings, Moon, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"

export function Topbar() {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark")
    }
    return false
  })

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    document.documentElement.classList.toggle("dark", newMode)
    localStorage.setItem("theme", newMode ? "dark" : "light")
  }

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
      setDarkMode(true)
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="h-full flex items-center justify-between px-6 bg-background">
      {/* Search bar */}
      <div className="relative w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search jobs, engineers, customers..."
          className="pl-9 bg-muted/50"
        />
      </div>

      {/* Right-side items */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-muted transition-colors">
          {darkMode ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 pl-4 border-l border-border cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">AD</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              <div className="text-sm">
                <p className="font-medium text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-card shadow-lg z-50 py-1">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <button
                onClick={() => { router.push("/admin/settings"); setDropdownOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}