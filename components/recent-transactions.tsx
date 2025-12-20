import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Transaction } from "@/types/supabase-types"

interface RecentTransactionsProps {
  data?: Transaction[]
}

export function RecentTransactions({ data = [] }: RecentTransactionsProps) {
  // Show only last 5 transactions
  const recentData = data.slice(0, 5)

  return (
    <div className="bg-white/60 rounded-xl overflow-hidden border border-border/50">
      <Table>
        <TableHeader className="bg-primary/5">
          <TableRow>
            <TableHead>Tarikh</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Amaun</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentData.map((tx) => (
            <TableRow key={tx.id} className="hover:bg-primary/5 transition-colors">
              <TableCell className="font-medium font-mono text-xs text-muted-foreground">{tx.date}</TableCell>
              <TableCell className="font-medium">{tx.description}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] font-normal">
                   {tx.category}
                </Badge>
              </TableCell>
              <TableCell
                className={cn("text-right font-bold", tx.type === "expense" ? "text-red-500" : "text-emerald-600")}
              >
                {tx.type === "expense" ? "-" : "+"} RM {Number(tx.amount).toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={tx.status === "approved" ? "default" : "outline"}
                  className={cn(tx.status === "approved" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none" : "text-amber-600 border-amber-600")}
                >
                  {tx.status === "approved" ? "Disahkan" : "Menunggu"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {recentData.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Tiada transaksi terkini.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}