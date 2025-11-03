import { ColumnDef, Column, Row } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HTMLAttributes } from "react"

// Define the shape of our data
type PayrollPeriod = {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  status: 'pending' | 'in_progress' | 'processed' | 'paid';
  payFrequency?: string;
  staffCount?: number;
  totalPay: number | string;
  processedAt?: string | null;
  onProcess?: () => void;
};

export const columns: ColumnDef<PayrollPeriod>[] = [
  {
    accessorKey: "startDate",
    header: ({ column }: { column: Column<PayrollPeriod> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Period
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }: { row: Row<PayrollPeriod> }) => {
      const startDate = new Date(row.original.startDate)
      const endDate = new Date(row.original.endDate)
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(startDate, 'yyyy')} • {row.original.payFrequency || 'N/A'}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: Row<PayrollPeriod> }) => {
      const status = row.original.status
      type StatusMap = {
        [key in PayrollPeriod['status']]: {
          label: string;
          variant: 'default' | 'outline' | 'secondary' | 'destructive';
        };
      };
      
      const statusMap: StatusMap = {
        pending: { label: 'Pending', variant: 'outline' },
        in_progress: { label: 'In Progress', variant: 'secondary' },
        processed: { label: 'Processed', variant: 'default' },
        paid: { label: 'Paid', variant: 'default' },
      } as const
      
      const statusConfig = statusMap[status] || { label: status, variant: 'outline' }
      
      return (
        <Badge variant={statusConfig.variant}>
          {statusConfig.label}
        </Badge>
      )
    },
    filterFn: (row: Row<PayrollPeriod>, id: string, value: string[]) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "staffCount",
    header: () => <div className="text-right">Staff</div>,
    cell: ({ row }: { row: Row<PayrollPeriod> }) => {
      const count = row.original.staffCount || 0
      return <div className="text-right font-medium">{count}</div>
    },
  },
  {
    accessorKey: "totalPay",
    header: () => <div className="text-right">Total Pay</div>,
    cell: ({ row }: { row: Row<PayrollPeriod> }) => {
      const amount = parseFloat(row.getValue("totalPay"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
 
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "processedAt",
    header: "Processed",
    cell: ({ row }: { row: Row<PayrollPeriod> }) => {
      const processedAt = row.original.processedAt
      return processedAt ? (
        <div className="text-sm text-muted-foreground">
          {format(new Date(processedAt), 'MMM d, yyyy')}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<PayrollPeriod> }) => {
      const period = row.original
      
      return (
        <div className="flex justify-end space-x-2">
          {period.status === 'pending' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => period.onProcess?.()}
            >
              Process
            </Button>
          )}
          {period.status === 'processed' && (
            <Button variant="outline" size="sm">
              Mark as Paid
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
