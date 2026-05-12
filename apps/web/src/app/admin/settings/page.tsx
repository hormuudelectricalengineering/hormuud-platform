"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap, Bell, Shield, Globe } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure system preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Mode
            </CardTitle>
            <CardDescription>Toggle development features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">DEV_MODE</p>
                <p className="text-sm text-muted-foreground">Enable development features and logging</p>
              </div>
              <Badge variant="destructive">OFF</Badge>
            </div>
            <Button className="w-full mt-4" variant="outline">Toggle Mode</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">New Job Alerts</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Engineer Status Changes</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Service Notifications</span>
              <Badge variant="success">Enabled</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Location Settings
            </CardTitle>
            <CardDescription>Map and tracking configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Default Latitude</label>
                <Input value="2.0469" readOnly className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Default Longitude</label>
                <Input value="45.3624" readOnly className="mt-1" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Centered on Mogadishu, Somalia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Admin access and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <span className="text-sm">Two-Factor Authentication</span>
              <Badge variant="warning">Not configured</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <span className="text-sm">Session Timeout</span>
              <Badge variant="outline">24 hours</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}