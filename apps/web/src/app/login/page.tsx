"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }

      router.push("/admin")
      router.refresh()
    } catch {
      setError("Connection error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-[#0066CC] p-4 animate-in fade-in duration-700">
      <Card className="w-full max-w-md shadow-2xl border-0 animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="flex justify-center mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Hormuud Electrical</CardTitle>
          <CardDescription>Sign in to the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="admin@hormuud.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20 animate-shake">{error}</div>
            )}
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 transition-all hover:shadow-lg hover:translate-y-[-1px]" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
