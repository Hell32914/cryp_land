import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { fetchDeposits } from '@/lib/api'

export function Deposits() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { token } = useAuth()
  const { data } = useQuery({
    queryKey: ['deposits', token],
    queryFn: () => fetchDeposits(token!),
    enabled: !!token,
  })

  const deposits = data?.deposits || []

  const filteredDeposits = deposits.filter(deposit =>
    deposit.user.username?.toLowerCase().includes(search.toLowerCase()) ||
    deposit.id.toString().includes(search)
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('deposits.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search deposits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>{t('deposits.orderId')}</TableHead>
                  <TableHead>{t('deposits.userId')}</TableHead>
                  <TableHead>{t('deposits.username')}</TableHead>
                  <TableHead>{t('deposits.fullName')}</TableHead>
                  <TableHead className="text-right">{t('deposits.amount')}</TableHead>
                  <TableHead>{t('deposits.country')}</TableHead>
                  <TableHead>{t('deposits.leadStatus')}</TableHead>
                  <TableHead>{t('deposits.subId')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono">#{deposit.id}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{deposit.user.telegramId}</TableCell>
                    <TableCell className="font-medium">{deposit.user.username || 'N/A'}</TableCell>
                    <TableCell>{deposit.user.fullName}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-green-500">
                      ${deposit.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{deposit.user.country}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(deposit.status)}>
                        {deposit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {deposit.currency}/{deposit.network}
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
