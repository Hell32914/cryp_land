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
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { fetchOverview } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export function GeoData() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [geoData, setGeoData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!token) return
      try {
        setLoading(true)
        const data = await fetchOverview(token)
        setGeoData(data.geoData)
      } catch (error) {
        console.error('Failed to load geo data:', error)
        toast.error('Failed to load geographical data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [token])

  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

  const exportCSV = () => {
    const headers = ['Country', 'User Count', 'Percentage']
    const rows = geoData.map(d => [d.country, d.userCount, d.percentage])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'geo-data.csv'
    a.click()
    
    toast.success('CSV exported successfully')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t('geo.title')}</h1>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    )
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
                  data={geoData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ country, percentage }) => `${country} ${percentage}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="userCount"
                >
                  {geoData.map((_, index) => (
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
                  {geoData.map((geo, index) => (
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
