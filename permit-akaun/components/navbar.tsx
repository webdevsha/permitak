"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Receipt, Home, Settings, LogOut, Menu, MapPin, Bell, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "./ui/sheet"
import { useAuth } from "@/components/providers/auth-provider"

export function Navbar({ activeModule, setActiveModule }: any) {
  const { role, signOut, user, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  
  // While loading, don't show any specific menu to avoid flashing the wrong one
  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <span className="font-serif font-bold text-2xl text-primary italic tracking-tight">Permit Akaun</span>
           <Loader2 className="animate-spin text-primary h-5 w-5" />
        </div>
      </header>
    )
  }

  // Determine nav items based on role
  const userRole = role || "tenant"

  const navItems =
    userRole === "admin"
      ? [
          { id: "overview", label: "Utama", icon: LayoutDashboard },
          { id: "tenants", label: "Peniaga & Sewa", icon: Users },
          { id: "accounting", label: "Akaun", icon: Receipt },
          { id: "locations", label: "Lokasi", icon: MapPin },
          { id: "settings", label: "Tetapan", icon: Settings },
        ]
      : userRole === "staff"
        ? [
            { id: "overview", label: "Utama", icon: LayoutDashboard },
            { id: "tenants", label: "Pendaftaran", icon: Users },
            { id: "accounting", label: "Kewangan", icon: Receipt },
            { id: "settings", label: "Tetapan", icon: Settings },
          ]
        : [
            { id: "rentals", label: "Sewa Saya", icon: Home },
            { id: "settings", label: "Tetapan", icon: Settings },
          ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <span className="font-serif font-bold text-2xl text-primary italic tracking-tight">Permit Akaun</span>

          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  activeModule === item.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-primary",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:bg-secondary">
            <Bell size={18} />
          </Button>
          <div className="h-6 w-px bg-border/50 mx-1 hidden sm:block" />
          
          <div className="hidden sm:flex flex-col items-end mr-2">
             <span className="text-xs font-bold text-foreground">{user?.email?.split('@')[0]}</span>
             <span className="text-[10px] uppercase text-muted-foreground tracking-wider">{userRole}</span>
          </div>

          <Button
            variant="ghost"
            className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 hidden sm:flex font-semibold"
            onClick={() => signOut()}
          >
            <LogOut size={16} className="mr-2" />
            Log Keluar
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-xl bg-secondary">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full bg-white border-b-border rounded-b-3xl p-8">
              <SheetHeader className="mb-8">
                <SheetTitle className="font-serif italic text-primary text-2xl">Permit Akaun</SheetTitle>
              </SheetHeader>
              <nav className="grid grid-cols-1 gap-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl transition-all",
                      activeModule === item.id 
                         ? "bg-primary text-primary-foreground font-bold shadow-md" 
                         : "text-muted-foreground bg-secondary/30",
                    )}
                  >
                    <item.icon size={20} />
                    <span className="text-lg">{item.label}</span>
                  </button>
                ))}
                <button 
                  onClick={() => signOut()}
                  className="flex items-center gap-4 p-5 text-destructive font-bold mt-4 border-t border-border/50"
                >
                  <LogOut size={20} />
                  <span>Log Keluar</span>
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}