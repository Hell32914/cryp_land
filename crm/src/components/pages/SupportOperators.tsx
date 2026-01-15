import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'

export function SupportOperators() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('supportOperators.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{t('supportOperators.description')}</div>
        </CardContent>
      </Card>
    </div>
  )
}
