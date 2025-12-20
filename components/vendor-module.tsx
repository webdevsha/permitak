"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Vendor = {
  id: string
  name: string
  category: string
  contact: string
  email: string
  phone: string
  address: string
  status: "active" | "inactive" | "pending"
  rating: number
}

export function VendorModule() {
  const [userRole, setUserRole] = useState<string>("")
  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: "VND-001",
      name: "ABC Construction Co.",
      category: "General Contractor",
      contact: "John Smith",
      email: "john@abcconstruction.com",
      phone: "(555) 123-4567",
      address: "123 Builder St, City, ST 12345",
      status: "active",
      rating: 4.8,
    },
    {
      id: "VND-002",
      name: "Electric Pro Services",
      category: "Electrical",
      contact: "Sarah Johnson",
      email: "sarah@electricpro.com",
      phone: "(555) 234-5678",
      address: "456 Voltage Ave, City, ST 12345",
      status: "active",
      rating: 4.5,
    },
    {
      id: "VND-003",
      name: "Plumbing Masters",
      category: "Plumbing",
      contact: "Mike Davis",
      email: "mike@plumbingmasters.com",
      phone: "(555) 345-6789",
      address: "789 Pipeline Rd, City, ST 12345",
      status: "pending",
      rating: 4.2,
    },
    {
      id: "VND-004",
      name: "HVAC Solutions Inc.",
      category: "HVAC",
      contact: "Emily Brown",
      email: "emily@hvacsolutions.com",
      phone: "(555) 456-7890",
      address: "321 Climate Dr, City, ST 12345",
      status: "active",
      rating: 4.9,
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newVendor, setNewVendor] = useState({
    name: "",
    category: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    setUserRole(sessionStorage.getItem("userRole") || "")
  }, [])

  const addVendor = () => {
    const vendor: Vendor = {
      id: `VND-${String(vendors.length + 1).padStart(3, "0")}`,
      ...newVendor,
      status: "pending",
      rating: 0,
    }
    setVendors([...vendors, vendor])
    setIsDialogOpen(false)
    setNewVendor({ name: "", category: "", contact: "", email: "", phone: "", address: "" })
  }

  const deleteVendor = (id: string) => {
    setVendors(vendors.filter((v) => v.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {userRole === "admin" ? "Vendor Management" : "Vendors"}
          </h2>
          <p className="text-muted-foreground">
            {userRole === "admin"
              ? "Manage all vendors and contractors in the system"
              : "View and manage your approved vendors"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>Enter the vendor details below</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor Name</Label>
                <Input
                  id="name"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="Enter vendor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newVendor.category}
                  onValueChange={(value) => setNewVendor({ ...newVendor, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Contractor">General Contractor</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Roofing">Roofing</SelectItem>
                    <SelectItem value="Landscaping">Landscaping</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Person</Label>
                <Input
                  id="contact"
                  value={newVendor.contact}
                  onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
            </div>
            <Button onClick={addVendor} className="w-full">
              Add Vendor
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vendors.filter((v) => v.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {vendors.filter((v) => v.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1)}⭐
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>
            {userRole === "admin" ? "All vendors in the system" : "Your approved vendors"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {vendor.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{vendor.category}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{vendor.contact}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {vendor.phone}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {vendor.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vendor.status === "active" ? "default" : vendor.status === "pending" ? "secondary" : "outline"
                      }
                    >
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{vendor.rating > 0 ? `${vendor.rating}⭐` : "No rating"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {userRole === "admin" && (
                        <Button variant="ghost" size="icon" onClick={() => deleteVendor(vendor.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
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
