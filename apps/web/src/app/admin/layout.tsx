import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar: Fixed width on desktop, hidden on mobile */}
      <div className="hidden md:block w-64 flex-shrink-0 border-r bg-sidebar">
        <Sidebar />
      </div>
      
      {/* Main content area: Takes remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar: Fixed height at top */}
        <div className="h-16 flex-shrink-0 border-b bg-background">
          <Topbar />
        </div>
        
        {/* Content: Scrollable */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}