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
import { useAuth } from '@/lib/auth'
import { useQuery } from '@tanstack/react-query'
import { fetchWithdrawals } from '@/lib/api'

export function Withdrawals() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const { data } = useQuery({
    queryKey: ['withdrawals', token],
    queryFn: () => fetchWithdrawals(token!),
    enabled: !!token,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  })

  const withdrawals = data?.withdrawals || []

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'declined':
      case 'failed':
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
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono">#{withdrawal.id}</TableCell>
                    <TableCell className="font-medium">{withdrawal.user.username || withdrawal.user.fullName}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-orange-500">
                      ${withdrawal.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(withdrawal.status)}>
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(withdrawal.createdAt)}
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
