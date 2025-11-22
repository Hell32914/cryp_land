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

export function RefLinks() {
  const { t } = useTranslation()

  // Note: This feature requires additional API endpoint for referral link tracking
  // Current bot tracks referrals per user, not per marketing source
  // This would need custom implementation for marketing campaign tracking

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('refLinks.title')}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="text-6xl">🔗</div>
            <h3 className="text-2xl font-semibold">Coming Soon</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Referral link tracking by marketing source is currently not implemented.
              This feature requires additional API endpoints for campaign tracking.
            </p>
            <p className="text-sm text-muted-foreground">
              For now, you can view individual user referrals in the <strong>Referrals</strong> section.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
