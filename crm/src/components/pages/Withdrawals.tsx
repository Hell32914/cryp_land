import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockWithdrawals } from '@/lib/mockData'

export function Withdrawals() {
  const { t } = useTranslation()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Successful':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'Pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'Declined':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('withdrawals.title')}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>{t('withdrawals.requestId')}</TableHead>
                  <TableHead>{t('withdrawals.user')}</TableHead>
                  <TableHead className="text-right">{t('withdrawals.amount')}</TableHead>
                  <TableHead>{t('withdrawals.status')}</TableHead>
                  <TableHead>{t('withdrawals.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.requestId} className="hover:bg-muted/30">
                    <TableCell className="font-mono">{withdrawal.requestId}</TableCell>
                    <TableCell className="font-medium">{withdrawal.user}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-orange-500">
                      ${withdrawal.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(withdrawal.status)}>
                        {t(`withdrawals.${withdrawal.status.toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(withdrawal.date)}
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
