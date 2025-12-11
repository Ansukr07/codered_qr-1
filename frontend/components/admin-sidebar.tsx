'use client'

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, UserPlus, Megaphone, HelpCircle, Github, LogOut, Code2, ClipboardList, BedDouble } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Participants",
    href: "/admin/participants",
    icon: Users
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: UserPlus
  },
  {
    title: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone
  },
  {
    title: "Help Requests",
    href: "/admin/help",
    icon: HelpCircle
  },
  {
    title: "Task Logs",
    href: "/admin/tasks",
    icon: ClipboardList
  },
  {
    title: "Sleeping Bags",
    href: "/admin/sleeping-bags",
    icon: BedDouble
  },
  {
    title: "GitHub Status",
    href: "/admin/github",
    icon: Github
  }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl fixed left-0 top-0 z-30">
      <div className="flex h-16 items-center border-b border-border/40 px-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Codered Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg text-primary">Code Red 3.0</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:text-primary",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border/40 p-4">
        <Link href="/login">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </Link>
      </div>
    </div>
  )
}
