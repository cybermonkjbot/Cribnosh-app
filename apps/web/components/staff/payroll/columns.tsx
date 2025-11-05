import { ColumnDef } from "@tanstack/react-table"
import { format } from 'date-fns'
import { ArrowUpDown, Download, FileText } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type PaySlip = {
  id: string
  period: string
  payDate: number
  status: 'draft' | 'processing' | 'paid' | 'cancelled'
  grossPay: number
  netPay: number
  hoursWorked: number
  overtimeHours: number
  onDownload: () => void
}

export const columns: ColumnDef<PaySlip>[] = [
  {
    accessorKey: "period",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Pay Period
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const period = row.original.period
      const payDate = new Date(row.original.payDate)
      
      return (
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-muted mr-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{period}</div>
            <div className="text-sm text-muted-foreground">
              Paid on {format(payDate, 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const statusMap = {
        draft: { label: 'Draft', variant: 'outline' },
        processing: { label: 'Processing', variant: 'secondary' },
        paid: { label: 'Paid', variant: 'default' },
        cancelled: { label: 'Cancelled', variant: 'destructive' },
      }
      
      const statusConfig = statusMap[status] || { label: status, variant: 'outline' }
      
      return (
        <Badge variant={statusConfig.variant as any}>
          {statusConfig.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "hoursWorked",
    header: "Hours",
    cell: ({ row }) => {
      const hours = row.original.hoursWorked
      const overtime = row.original.overtimeHours
      
      return (
        <div>
          <div>{hours.toFixed(1)} hours</div>
          {overtime > 0 && (
            <div className="text-sm text-muted-foreground">
              +{overtime.toFixed(1)} OT
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "grossPay",
    header: "Amount",
    cell: ({ row }) => {
      const gross = row.original.grossPay
      const net = row.original.netPay
      
      return (
        <div className="text-right">
          <div className="font-medium">
            ${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          {gross !== net && (
            <div className="text-sm text-muted-foreground">
              ${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })} gross
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => row.original.onDownload()}
          className="text-primary hover:text-primary"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    ),
  },
]
