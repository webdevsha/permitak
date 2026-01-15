"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Download,
  TrendingUp,
  Edit2,
  Trash2,
  Wallet,
  Building,
  PiggyBank,
  ShieldAlert,
  Heart,
  Landmark,
  Loader2,
  FileText,
  Upload,
  User,
  Calendar
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { SubscriptionPlans } from "@/components/subscription-plans"
import { useAuth } from "@/components/providers/auth-provider"

// Fetcher: Get ALL transactions
const fetcher = async () => {
  const supabase = createClient()
  
  // We use a simpler select first to ensure data loads
  // We join tenants to get names
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *, 
      tenants (
        full_name, 
        business_name
      )
    `)
    .order('date', { ascending: false })
  
  if (error) {
    console.error("Supabase fetch error:", error)
    throw error
  }
  return data
}

export function AccountingModule() {
  const { role } = useAuth()
  const [userRole, setUserRole] = useState<string>("")
  const { data: transactions, mutate, isLoading } = useSWR('transactions_master_ledger_v3', fetcher)
  const supabase = createClient()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    category: "",
    amount: "",
    type: "income" as "income" | "expense",
    tenant: "",
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    // Prefer the auth hook role, fallback to session storage if needed (though auth hook is better)
    if (role) {
       setUserRole(role)
    } else {
       const storedRole = sessionStorage.getItem("userRole") || "tenant"
       setUserRole(storedRole)
    }
  }, [role])

  // --- RESTRICTED VIEW FOR TENANTS ---
  // If role is tenant, show Subscription Plans instead of Accounting Dashboard
  if (userRole === 'tenant') {
    return <SubscriptionPlans />
  }

  // ------------------------------------------------------------------
  // 7-TABUNG CALCULATION ENGINE
  // ------------------------------------------------------------------
  const calculateTotalIncome = () => {
    return transactions
      ?.filter((t: any) => t.type === 'income' && t.status === 'approved')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0
  }

  const totalIncome = calculateTotalIncome()
  
  const accounts = [
    { 
      name: "Operating Account", 
      percent: "60%", 
      amount: totalIncome * 0.60, 
      color: "bg-brand-blue/10 text-brand-blue border-brand-blue/20", 
      icon: Wallet,
      tag: "Actionable"
    },
    { 
      name: "Tax", 
      percent: "10%", 
      amount: totalIncome * 0.10, 
      color: "bg-orange-50 text-orange-600 border-orange-100", 
      icon: Building,
      tag: "Liability"
    },
    { 
      name: "Zakat", 
      percent: "2.5%", 
      amount: totalIncome * 0.025, 
      color: "bg-brand-green/10 text-brand-green border-brand-green/20", 
      icon: Heart,
      tag: "Do Not Touch"
    },
    { 
      name: "Investment", 
      percent: "10%", 
      amount: totalIncome * 0.10, 
      color: "bg-blue-50 text-blue-600 border-blue-100", 
      icon: TrendingUp,
      tag: "Growth"
    },
    { 
      name: "Dividend", 
      percent: "10%", 
      amount: totalIncome * 0.10, 
      color: "bg-indigo-50 text-indigo-600 border-indigo-100", 
      icon: Landmark,
      tag: "Growth"
    },
    { 
      name: "Savings", 
      percent: "4%", 
      amount: totalIncome * 0.04, 
      color: "bg-purple-50 text-purple-600 border-purple-100", 
      icon: PiggyBank,
      tag: "Growth"
    },
    { 
      name: "Emergency", 
      percent: "3.5%", 
      amount: totalIncome * 0.035, 
      color: "bg-yellow-50 text-yellow-600 border-yellow-100", 
      icon: ShieldAlert,
      tag: "Safety Net"
    },
  ]

  const handleSaveTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) {
      toast.error("Sila isi semua maklumat")
      return
    }

    setIsSaving(true)
    const amount = parseFloat(newTransaction.amount)

    try {
      let receiptUrl = null
      
      // Upload Receipt
      if (receiptFile) {
         const fileExt = receiptFile.name.split('.').pop()
         const fileName = `tx-${Date.now()}.${fileExt}`
         
         const { error: uploadError } = await supabase.storage
           .from('receipts')
           .upload(fileName, receiptFile)
           
         if (!uploadError) {
           const { data: { publicUrl } } = supabase.storage
             .from('receipts')
             .getPublicUrl(fileName)
           receiptUrl = publicUrl
         }
      }

      const txData = {
        description: newTransaction.description,
        category: newTransaction.category || "Lain-lain",
        amount: amount,
        type: newTransaction.type,
        status: userRole === 'admin' ? 'approved' : 'pending',
        date: newTransaction.date,
        receipt_url: receiptUrl
      }

      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update(txData)
          .eq('id', editingTransaction.id)
        if (error) throw error
        toast.success("Transaksi berjaya dikemaskini")
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert(txData)
        if (error) throw error
        toast.success("Transaksi berjaya ditambah")
      }

      mutate()
      setIsDialogOpen(false)
      resetForm()

    } catch (error: any) {
      toast.error("Ralat: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (userRole !== "admin") {
      toast.error("Hanya Admin boleh memadam transaksi")
      return
    }
    
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
      
      toast.success("Transaksi telah dipadam")
      mutate()
    } catch (error: any) {
      toast.error("Gagal memadam: " + error.message)
    }
  }

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction)
    setNewTransaction({
      description: transaction.description || "",
      category: transaction.category || "",
      amount: transaction.amount.toString(),
      type: transaction.type,
      tenant: "",
      date: transaction.date
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingTransaction(null)
    setReceiptFile(null)
    setNewTransaction({ 
      description: "", 
      category: "", 
      amount: "", 
      type: "income", 
      tenant: "",
      date: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground leading-tight">Perakaunan</h2>
          <p className="text-muted-foreground text-lg">Urus 7 Tabung Simpanan & Rekod Kewangan</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-6 h-12 shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-5 w-5" />
                Tambah Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-border rounded-3xl sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-foreground font-serif">
                  {editingTransaction ? "Kemaskini Transaksi" : "Tambah Transaksi Baru"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Masukkan butiran transaksi kewangan
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Tarikh</Label>
                  <Input
                    id="date"
                    type="date"
                    className="border-input rounded-xl h-11"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Jenis</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(v: "income" | "expense") => setNewTransaction({ ...newTransaction, type: v, category: "" })}
                    >
                      <SelectTrigger className="border-input rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Cash In</SelectItem>
                        <SelectItem value="expense">Cash Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Jumlah (RM)</Label>
                    <Input
                      id="amount"
                      type="number"
                      className="border-input rounded-xl h-11"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={newTransaction.category}
                    onValueChange={(v) => setNewTransaction({ ...newTransaction, category: v })}
                  >
                    <SelectTrigger className="border-input rounded-xl h-11">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {newTransaction.type === 'income' ? (
                        <>
                          <SelectItem value="Jualan">Jualan</SelectItem>
                          <SelectItem value="Servis">Servis</SelectItem>
                          <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Operasi">Operasi</SelectItem>
                          <SelectItem value="Sewa">Sewa</SelectItem>
                          <SelectItem value="Bil">Bil</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Gaji">Gaji</SelectItem>
                          <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Keterangan</Label>
                  <Input
                    id="description"
                    className="border-input rounded-xl h-11"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    placeholder="Contoh: Jualan nasi lemak / Bayar bil elektrik"
                  />
                </div>
                
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="flex items-center gap-2">
                     <Upload className="w-4 h-4" /> Muat Naik Resit
                  </Label>
                  <Input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="h-10 pt-1.5 rounded-xl bg-secondary/20 cursor-pointer text-xs" 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={isSaving}
                  onClick={handleSaveTransaction}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-2xl h-12 font-bold"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : (editingTransaction ? "Simpan Perubahan" : "Tambah Transaksi")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="rounded-2xl px-6 h-12 border-border bg-white hover:bg-muted text-foreground"
            onClick={() => toast.success("Feature coming soon")}
          >
            <Download className="mr-2 h-5 w-5" />
            Eksport
          </Button>
        </div>
      </div>

      {/* 7-TABUNG DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-12 bg-white border border-border/50 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
          <div className="p-10 border-b border-border/30 bg-secondary/30 flex justify-between items-end">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">
                Jumlah Kutipan (Approved Income)
              </p>
              <h3 className="text-6xl font-sans font-black tracking-tighter text-primary">
                RM {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs font-bold mb-1">Status Agihan</p>
              <Badge className="bg-brand-green/10 text-brand-green border-none px-4 py-1 rounded-full font-bold">
                100% DIAGIH
              </Badge>
            </div>
          </div>
          <CardContent className="p-10 bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
              {accounts.map((acc) => (
                <div key={acc.name} className="space-y-3 group">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm border",
                      acc.color,
                    )}
                  >
                    <acc.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase", acc.color.replace('bg-', 'bg-white/50 '))}>
                        {acc.percent}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      {acc.name}
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      RM {acc.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                     <p className="text-[9px] text-muted-foreground/60 italic">
                      {acc.tag}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="p-10 border-b border-border/30">
          <div>
            <CardTitle className="text-3xl font-serif">Senarai Transaksi</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-1 font-medium">
              Rekod keluar masuk kewangan berpusat
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="p-12 flex justify-center text-muted-foreground">
               <Loader2 className="animate-spin mr-2" /> Memuatkan data...
             </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow className="border-border/20 h-16 hover:bg-transparent">
                  <TableHead className="px-8 font-bold text-xs uppercase tracking-widest">Tarikh</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Keterangan</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-right">Jumlah</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-center">Resit</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="px-8 font-bold text-xs uppercase tracking-widest text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction: any) => {
                  const receipt = transaction.receipt_url
                  return (
                    <TableRow
                      key={transaction.id}
                      className="border-border/10 h-20 hover:bg-secondary/10 transition-colors"
                    >
                      <TableCell className="px-8 font-mono text-xs text-muted-foreground">
                         <div className="flex items-center gap-2">
                           <Calendar className="w-3 h-3 text-muted-foreground/70" />
                           {new Date(transaction.date).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-foreground">{transaction.description}</div>
                        <div className="flex flex-col gap-1 mt-1">
                          {transaction.tenants && (
                            <div className="flex items-center gap-1 text-xs text-primary font-medium">
                              <User size={12} />
                              {transaction.tenants.full_name}
                            </div>
                          )}
                          <Badge variant="outline" className="w-fit text-[10px] py-0 h-5 bg-slate-50 text-slate-500 border-slate-200">
                             {transaction.category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold text-lg ${transaction.type === "income" ? "text-brand-green" : "text-red-500"}`}
                      >
                        {transaction.type === "income" ? "+" : "-"} RM {Number(transaction.amount).toFixed(2)}
                      </TableCell>
                       <TableCell className="text-center">
                         {receipt ? (
                           <a href={receipt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 bg-secondary rounded-lg hover:bg-secondary/80">
                             <FileText className="w-4 h-4 text-primary" />
                           </a>
                         ) : (
                           <span className="text-muted-foreground text-xs">-</span>
                         )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider",
                            transaction.status === "approved"
                              ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                              : "bg-orange-50 text-orange-600 border-orange-100",
                          )}
                        >
                          {transaction.status === "approved" ? "Diluluskan" : "Menunggu"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        {userRole === "admin" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {(!transactions || transactions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                       <p>Tiada transaksi direkodkan.</p>
                       <p className="text-xs opacity-50 mt-2">Sila tambah transaksi baru atau semak database.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}