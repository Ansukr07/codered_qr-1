import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Red Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4a1f1f_1px,transparent_1px),linear-gradient(to_bottom,#4a1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 pointer-events-none" />

      <div className="relative z-10">
        <AdminSidebar />
        <main className="pl-64">
          <div className="container mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
