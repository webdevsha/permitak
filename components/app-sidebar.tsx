"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Home, 
  Settings, 
  LogOut, 
  Menu, 
  MapPin, 
  Bell,
  PanelLeftClose,
  PanelLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from "@/components/ui/sheet"
import { useAuth } from "@/components/providers/auth-provider"

interface SidebarProps {
  activeModule: string
  setActiveModule: (module: string) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export function AppSidebar({ activeModule, setActiveModule, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { role, signOut, user } = useAuth()
  
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
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-white h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 shadow-sm",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      <div className="h-20 flex items-center justify-between px-6 border-b border-border/50">
        {!isCollapsed && (
          <span className="font-serif font-bold text-2xl text-primary italic tracking-tight animate-in fade-in duration-300">
            Permit Akaun
          </span>
        )}
        {isCollapsed && (
           <span className="font-serif font-bold text-xl text-primary italic tracking-tight mx-auto">
            PA
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("hidden md:flex", isCollapsed && "mx-auto")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
           {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => setActiveModule(item.id)}
            className={cn(
              "w-full justify-start h-12 rounded-xl transition-all",
              activeModule === item.id
                ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:bg-primary/90"
                : "text-muted-foreground hover:bg-secondary hover:text-primary",
              isCollapsed ? "justify-center px-0" : "px-4"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="text-sm">{item.label}</span>}
            {!isCollapsed && activeModule === item.id && (
               <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
            )}
          </Button>
        ))}
      </div>

      <div className="p-4 border-t border-border/50">
        <div className={cn(
            "bg-secondary/30 rounded-2xl p-4 flex items-center gap-3 transition-all",
            isCollapsed ? "justify-center p-2 bg-transparent" : ""
          )}>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
               {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{user?.email?.split('@')[0]}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider truncate">{userRole}</p>
              </div>
            )}
        </div>
        
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className={cn(
            "w-full mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            isCollapsed ? "h-10 w-10 p-0 justify-center mx-auto" : "justify-start px-4"
          )}
          title="Log Keluar"
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Log Keluar"}
        </Button>
      </div>
    </aside>
  )
}

interface MobileNavProps {
  activeModule: string
  setActiveModule: (module: string) => void
}

export function MobileNav({ activeModule, setActiveModule }: MobileNavProps) {
  const { role, signOut, user } = useAuth()
  const [open, setOpen] = React.useState(false)
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

  const handleNavClick = (id: string) => {
    setActiveModule(id)
    setOpen(false)
  }

  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-border/50 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-2">
         <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
               <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="h-6 w-6 text-foreground" />
               </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
               <SheetHeader className="p-6 border-b border-border/50 bg-secondary/10">
                  <SheetTitle className="font-serif font-bold text-2xl text-primary italic tracking-tight text-left">
                     Permit Akaun
                  </SheetTitle>
                  <SheetDescription className="text-left text-xs">
                     Sistem Pengurusan Bersepadu
                  </SheetDescription>
               </SheetHeader>
               <div className="flex flex-col h-full pb-20">
                  <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                     {navItems.map((item) => (
                        <Button
                           key={item.id}
                           variant="ghost"
                           onClick={() => handleNavClick(item.id)}
                           className={cn(
                              "w-full justify-start h-14 rounded-xl text-base",
                              activeModule === item.id
                                 ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
                                 : "text-muted-foreground hover:bg-secondary hover:text-primary"
                           )}
                        >
                           <item.icon className="h-5 w-5 mr-4" />
                           {item.label}
                        </Button>
                     ))}
                  </div>
                  <div className="p-4 border-t border-border/50">
                     <div className="flex items-center gap-3 px-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                           {user?.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                           <p className="text-sm font-bold">{user?.email?.split('@')[0]}</p>
                           <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                        </div>
                     </div>
                     <Button 
                        variant="destructive" 
                        className="w-full rounded-xl"
                        onClick={() => signOut()}
                     >
                        <LogOut className="h-4 w-4 mr-2" /> Log Keluar
                     </Button>
                  </div>
               </div>
            </SheetContent>
         </Sheet>
         <span className="font-serif font-bold text-lg text-primary italic">Permit Akaun</span>
      </div>
      <div className="flex items-center gap-2">
         <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5 text-muted-foreground" />
         </Button>
         <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center text-xs font-bold text-primary">
            {user?.email?.charAt(0).toUpperCase()}
         </div>
      </div>
    </div>
  )
}
