import { ColumnDef } from "@tanstack/react-table"
import { format } from 'date-fns'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

export const columns: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "employeeName",
    header: "Employee",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("employeeName")}</div>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "position",
    header: "Position",
  },
  {
    accessorKey: "period",
    header: "Pay Period",
    cell: ({ row }) => {
      const period = row.original.period
      if (!period) return '-';
      
      return (
        <div className="text-sm">
          <div>{format(new Date(period.startDate), 'MMM d, yyyy')} - {format(new Date(period.endDate), 'MMM d, yyyy')}</div>
          <div className="text-xs text-muted-foreground">
            {period.payFrequency || 'N/A'}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "hoursWorked",
    header: "Hours",
    cell: ({ row }) => {
      const hours = row.original.baseHours || 0
      const overtime = row.original.overtimeHours || 0
      
      return (
        <div className="text-right">
          <div>{hours.toFixed(1)}</div>
          {overtime > 0 && (
            <div className="text-xs text-muted-foreground">
              +{overtime.toFixed(1)} OT
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "grossPay",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("grossPay"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      
      const statusMap = {
        draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
        processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800' },
        paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
        cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
      }
      
      const statusConfig = statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gray-100 text-gray-800' }
      
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
          {statusConfig.label}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuItem>View employee</DropdownMenuItem>
            <DropdownMenuItem>View pay slip</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Print</DropdownMenuItem>
            <DropdownMenuItem>Export</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
