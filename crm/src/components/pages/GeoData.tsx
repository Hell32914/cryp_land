import { useTranslation } from 'react-i18next'
import { Download } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { mockGeoData } from '@/lib/mockData'
import { toast } from 'sonner'

export function GeoData() {
  const { t } = useTranslation()

  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

  const exportCSV = () => {
    const headers = ['Country', 'User Count', 'Percentage']
    const rows = mockGeoData.map(d => [d.country, d.userCount, d.percentage])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'geo-data.csv'
    a.click()
    
    toast.success('CSV exported successfully')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('geo.title')}</h1>
        <Button onClick={exportCSV}>
          <Download size={18} className="mr-2" />
          {t('geo.export')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('geo.distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={mockGeoData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ country, percentage }) => `${country} ${percentage}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="userCount"
                >
                  {mockGeoData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#22252f', 
                    border: '1px solid #3f4456',
                    borderRadius: '8px',
                    color: '#f8f9fa'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toLocaleString()} users (${props.payload.percentage}%)`,
                    props.payload.country
                  ]}
                />
                <Legend 
                  wrapperStyle={{ color: '#9ca3af' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('geo.country')} Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>{t('geo.country')}</TableHead>
                    <TableHead className="text-right">{t('geo.userCount')}</TableHead>
                    <TableHead className="text-right">{t('geo.percentage')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockGeoData.map((geo, index) => (
                    <TableRow key={geo.country} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{geo.country}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {geo.userCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {geo.percentage}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
