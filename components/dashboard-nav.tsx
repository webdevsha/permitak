"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, Users, Calculator, Truck, LogOut, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    const role = sessionStorage.getItem("userRole") || ""
    const email = sessionStorage.getItem("userEmail") || ""
    setUserRole(role)
    setUserEmail(email)
  }, [])

  const handleLogout = () => {
    sessionStorage.clear()
    router.push("/")
  }

  const tenantNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/permits", label: "My Permits", icon: FileText },
    { href: "/accounting", label: "Accounting", icon: Calculator },
    { href: "/vendors", label: "Vendors", icon: Truck },
  ]

  const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/permits", label: "All Permits", icon: FileText },
    { href: "/users", label: "User Management", icon: Users },
    { href: "/accounting", label: "Accounting", icon: Calculator },
    { href: "/vendors", label: "Vendor Management", icon: Truck },
  ]

  const navItems = userRole === "admin" ? adminNavItems : tenantNavItems

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">Permit Account System</h1>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavLinks />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm">
              <p className="font-medium">{userEmail}</p>
              <p className="text-muted-foreground text-xs">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
            </div>

            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
