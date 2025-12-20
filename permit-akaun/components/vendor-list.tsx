import { dummyVendors } from "@/lib/dummy-data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Star } from "lucide-react"

export function VendorList() {
  return (
    <Card className="border-none shadow-sm bg-white/60">
      <CardHeader>
        <CardTitle className="font-serif">Pengurusan Vendor</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Syarikat</TableHead>
              <TableHead>Wakil</TableHead>
              <TableHead>Perkhidmatan</TableHead>
              <TableHead className="text-right">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyVendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell>{vendor.contact}</TableCell>
                <TableCell>{vendor.service}</TableCell>
                <TableCell className="text-right flex items-center justify-end">
                  <span className="mr-1">{vendor.rating}</span>
                  <Star className="fill-amber-400 text-amber-400" size={14} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
