import { useTranslation } from 'react-i18next'
import { TrendUp } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockRefLinks } from '@/lib/mockData'

export function RefLinks() {
  const { t } = useTranslation()

  const calculateConversionRate = (registrations: number, clicks: number) => {
    return ((registrations / clicks) * 100).toFixed(1)
  }

  const calculateDepositRate = (deposits: number, registrations: number) => {
    return ((deposits / registrations) * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('refLinks.title')}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>{t('refLinks.id')}</TableHead>
                  <TableHead>{t('refLinks.source')}</TableHead>
                  <TableHead>{t('refLinks.subId')}</TableHead>
                  <TableHead className="text-right">{t('refLinks.clicks')}</TableHead>
                  <TableHead className="text-right">{t('refLinks.registrations')}</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead className="text-right">{t('refLinks.deposits')}</TableHead>
                  <TableHead className="text-right">Dep. Rate</TableHead>
                  <TableHead className="text-right">{t('refLinks.revenue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRefLinks.map((link) => (
                  <TableRow key={link.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-muted-foreground">{link.id}</TableCell>
                    <TableCell className="font-medium">{link.source}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{link.subId}</TableCell>
                    <TableCell className="text-right font-mono">{link.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{link.registrations.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-blue-500">
                      {calculateConversionRate(link.registrations, link.clicks)}%
                    </TableCell>
                    <TableCell className="text-right font-mono">{link.deposits.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-green-500">
                      {calculateDepositRate(link.deposits, link.registrations)}%
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-accent">
                      <div className="flex items-center justify-end gap-1">
                        <TrendUp size={16} weight="bold" />
                        ${link.revenue.toLocaleString()}
                      </div>
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
