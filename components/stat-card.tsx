import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

export function StatCard({
  title,
  value,
  change,
  icon,
}: { title: string; value: string; change: string; icon: React.ReactNode }) {
  const isPositive = change.startsWith("+")

  return (
    <Card className="border-none shadow-sm bg-white/60 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
          <span
            className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
            )}
          >
            {change}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
      </CardContent>
    </Card>
  )
}

import { cn } from "@/lib/utils"
