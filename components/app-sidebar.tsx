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
import Image from "next/image"

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
            { id: "accounting", label: "Akaun", icon: Receipt },
            { id: "settings", label: "Tetapan", icon: Settings },
          ]

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-white h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 shadow-sm",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      <div className={cn("flex items-center border-b border-border/50", isCollapsed ? "justify-center h-20" : "justify-between px-6 h-24")}>
        {!isCollapsed && (
          <div className="relative w-40 h-16 animate-in fade-in duration-300">
             <Image 
               src="/logo.png" 
               alt="Permit Akaun" 
               fill 
               className="object-contain object-left"
               priority
             />
          </div>
        )}
        {isCollapsed && (
           <div className="relative w-10 h-10">
              <Image 
               src="/logo.png" 
               alt="PA" 
               fill 
               className="object-cover object-left" 
               style={{ objectPosition: '0 50%' }} // Crops to just the icon
              />
           </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("hidden md:flex text-muted-foreground hover:text-primary", isCollapsed && "mx-auto mt-4 hidden")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
           {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
      </div>
      
      {isCollapsed && (
         <div className="flex justify-center py-2 border-b border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-muted-foreground"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
         </div>
      )}

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
                <p className="text-sm font-bold truncate text-foreground">{user?.email?.split('@')[0]}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider truncate">{userRole}</p>
              </div>
            )}
        </div>
        
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className={cn(
            "w-full mt-2 text-muted-foreground hover:text-destructive hover:text-destructive/90 hover:bg-destructive/10",
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
            { id: "accounting", label: "Akaun", icon: Receipt },
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
                  <div className="relative w-40 h-12 mb-2">
                    <Image 
                      src="/logo.png" 
                      alt="Permit Akaun" 
                      fill 
                      className="object-contain object-left"
                    />
                  </div>
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
         <div className="relative w-28 h-8">
            <Image 
              src="/logo.png" 
              alt="Permit Akaun" 
              fill 
              className="object-contain object-left"
            />
         </div>
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