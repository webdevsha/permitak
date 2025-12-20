"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, DollarSign, Truck, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function DashboardOverview() {
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    setUserRole(sessionStorage.getItem("userRole") || "")
  }, [])

  const tenantStats = [
    { label: "Active Permits", value: "12", icon: FileText, href: "/permits" },
    { label: "Total Expenses", value: "$24,560", icon: DollarSign, href: "/accounting" },
    { label: "Active Vendors", value: "8", icon: Truck, href: "/vendors" },
    { label: "Completed", value: "45", icon: CheckCircle, href: "/permits" },
  ]

  const adminStats = [
    { label: "All Permits", value: "156", icon: FileText, href: "/permits" },
    { label: "Total Revenue", value: "$482,340", icon: DollarSign, href: "/accounting" },
    { label: "Total Vendors", value: "34", icon: Truck, href: "/vendors" },
    { label: "Active Users", value: "89", icon: CheckCircle, href: "/users" },
  ]

  const stats = userRole === "admin" ? adminStats : tenantStats

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your account.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <Link href={stat.href}>
                  <Button variant="link" className="px-0 text-xs">
                    View details →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/permits">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <FileText className="mr-2 h-4 w-4" />
                View Permits
              </Button>
            </Link>
            <Link href="/accounting">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <DollarSign className="mr-2 h-4 w-4" />
                Manage Accounting
              </Button>
            </Link>
            <Link href="/vendors">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Truck className="mr-2 h-4 w-4" />
                Manage Vendors
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>New permit approved - #PM-2024-089</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Invoice paid - $2,450</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span>Vendor added - ABC Construction</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
