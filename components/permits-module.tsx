"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Permit = {
  id: string
  type: string
  address: string
  status: "approved" | "pending" | "rejected"
  submittedDate: string
  owner: string
}

export function PermitsModule() {
  const [userRole, setUserRole] = useState<string>("")
  const [permits] = useState<Permit[]>([
    {
      id: "PM-2024-001",
      type: "Commercial Building",
      address: "123 Main St",
      status: "approved",
      submittedDate: "2024-01-10",
      owner: "John Doe",
    },
    {
      id: "PM-2024-002",
      type: "Residential Renovation",
      address: "456 Oak Ave",
      status: "pending",
      submittedDate: "2024-01-15",
      owner: "Jane Smith",
    },
    {
      id: "PM-2024-003",
      type: "Electrical Work",
      address: "789 Pine Rd",
      status: "approved",
      submittedDate: "2024-01-18",
      owner: "Bob Johnson",
    },
  ])

  useEffect(() => {
    setUserRole(sessionStorage.getItem("userRole") || "")
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{userRole === "admin" ? "All Permits" : "My Permits"}</h2>
        <p className="text-muted-foreground">
          {userRole === "admin"
            ? "Manage all permit applications in the system"
            : "View your permit applications and status"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permit Applications</CardTitle>
          <CardDescription>Recent permit submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permit ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                {userRole === "admin" && <TableHead>Owner</TableHead>}
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permits.map((permit) => (
                <TableRow key={permit.id}>
                  <TableCell className="font-medium">{permit.id}</TableCell>
                  <TableCell>{permit.type}</TableCell>
                  <TableCell>{permit.address}</TableCell>
                  {userRole === "admin" && <TableCell>{permit.owner}</TableCell>}
                  <TableCell>{permit.submittedDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        permit.status === "approved"
                          ? "default"
                          : permit.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {permit.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
