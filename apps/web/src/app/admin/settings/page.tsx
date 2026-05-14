"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell, Globe, Save } from "lucide-react"
import { toast } from "sonner"

interface Settings {
  newJobAlerts: boolean
  engineerStatusAlerts: boolean
  serviceNotifications: boolean
  defaultLat: string
  defaultLng: string
}

const DEFAULT_SETTINGS: Settings = {
  newJobAlerts: true,
  engineerStatusAlerts: true,
  serviceNotifications: true,
  defaultLat: "2.0469",
  defaultLng: "45.3624",
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("admin-settings")
    if (saved) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }) } catch {}
    }
    setLoaded(true)
  }, [])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    localStorage.setItem("admin-settings", JSON.stringify(updated))
  }

  const handleSave = async () => {
    setSaving(true)
    localStorage.setItem("admin-settings", JSON.stringify(settings))
    await new Promise(r => setTimeout(r, 300))
    setSaving(false)
    toast.success("Settings saved successfully")
  }

  if (!loaded) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure system preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
              <div>
                <span className="text-sm font-medium">New Job Alerts</span>
                <p className="text-xs text-muted-foreground">Notify when new jobs are created</p>
              </div>
              <Switch
                checked={settings.newJobAlerts}
                onCheckedChange={v => updateSetting("newJobAlerts", v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Engineer Status Changes</span>
                <p className="text-xs text-muted-foreground">Notify when engineers go online/offline</p>
              </div>
              <Switch
                checked={settings.engineerStatusAlerts}
                onCheckedChange={v => updateSetting("engineerStatusAlerts", v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Service Notifications</span>
                <p className="text-xs text-muted-foreground">Notify about custom service requests</p>
              </div>
              <Switch
                checked={settings.serviceNotifications}
                onCheckedChange={v => updateSetting("serviceNotifications", v)}
              />
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
                <Input
                  value={settings.defaultLat}
                  onChange={e => updateSetting("defaultLat", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Default Longitude</label>
                <Input
                  value={settings.defaultLng}
                  onChange={e => updateSetting("defaultLng", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Centered on Mogadishu, Somalia</p>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}