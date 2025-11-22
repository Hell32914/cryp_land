import { useTranslation } from 'react-i18next'
import { Plus } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockExpenses } from '@/lib/mockData'

export function Expenses() {
  const { t } = useTranslation()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const totalExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('expenses.title')}</h1>
          <p className="text-muted-foreground mt-1">
            Total: <span className="font-mono font-semibold">${totalExpenses.toLocaleString()}</span>
          </p>
        </div>
        <Button>
          <Plus size={18} className="mr-2" />
          {t('expenses.addExpense')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>{t('users.id')}</TableHead>
                  <TableHead>{t('expenses.category')}</TableHead>
                  <TableHead>{t('expenses.comment')}</TableHead>
                  <TableHead className="text-right">{t('expenses.amount')}</TableHead>
                  <TableHead>{t('expenses.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-muted-foreground">{expense.id}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell>{expense.comment}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-red-500">
                      ${expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(expense.date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
