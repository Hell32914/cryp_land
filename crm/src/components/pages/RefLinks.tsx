import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PencilSimple, CheckCircle, XCircle } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { fetchMarketingLinks, updateLinkTrafficCost, type MarketingLink } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function RefLinks() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editCost, setEditCost] = useState('')
  const [traffickerFilter, setTraffickerFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['marketing-links', token],
    queryFn: () => fetchMarketingLinks(token!),
    enabled: !!token,
  })

  const updateCostMutation = useMutation({
    mutationFn: ({ linkId, cost }: { linkId: string; cost: number }) =>
      updateLinkTrafficCost(token!, linkId, cost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-links'] })
      setEditingLinkId(null)
      setEditCost('')
    },
  })

  const handleEditCost = (link: MarketingLink) => {
    setEditingLinkId(link.linkId)
    setEditCost(link.trafficCost.toString())
  }

  const handleSaveCost = (linkId: string) => {
    const cost = parseFloat(editCost)
    if (!isNaN(cost) && cost >= 0) {
      updateCostMutation.mutate({ linkId, cost })
    }
  }

  const handleCancelEdit = () => {
    setEditingLinkId(null)
    setEditCost('')
  }

  const links = data?.links || []

  const filteredLinks = links.filter((link) => {
    const traffickerMatch = traffickerFilter.trim()
      ? (link.trafficerName || '').toLowerCase().includes(traffickerFilter.trim().toLowerCase())
      : true
    const sourceMatch = sourceFilter.trim()
      ? (link.source || '').toLowerCase().includes(sourceFilter.trim().toLowerCase())
      : true
    return traffickerMatch && sourceMatch
  })

  const formatPercent = (val: number) => `${val.toFixed(2)}%`
  const formatMoney = (val: number) => `$${val.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-GB')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('refLinks.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Links Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder="Filter by Trafficker"
              value={traffickerFilter}
              onChange={(e) => setTraffickerFilter(e.target.value)}
              className="w-52"
            />
            <Input
              placeholder="Filter by Source"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-52"
            />
          </div>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No referral links yet. Create links in <strong>Link Builder</strong>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trafficker</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Link ID</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead>Geo</TableHead>
                    <TableHead>Creative</TableHead>
                    <TableHead className="text-right text-purple-400">Total</TableHead>
                    <TableHead className="text-right text-green-400">TOTAL USER</TableHead>
                    <TableHead className="text-right text-blue-400">TODAY USERS</TableHead>
                    <TableHead className="text-right text-cyan-400">WEEK USER</TableHead>
                    <TableHead className="text-right text-yellow-400">LEADS</TableHead>
                    <TableHead className="text-right text-sky-400">CHANNEL</TableHead>
                    <TableHead className="text-right text-orange-400">CR% Lead→User</TableHead>
                    <TableHead className="text-right">FTD</TableHead>
                    <TableHead className="text-right">CR %</TableHead>
                    <TableHead className="text-right">Deps</TableHead>
                    <TableHead className="text-right">Dep Amount</TableHead>
                    <TableHead className="text-right">Traffic Cost</TableHead>
                    <TableHead className="text-right">CFPD</TableHead>
                    <TableHead className="text-right">ROI %</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => {
                    const leadCount = (link.totalLeads || 0) + (link.channelLeads || 0)
                    const totalUsers = link.totalUsers || 0
                    const totalCount = leadCount + totalUsers
                    return (
                    <TableRow key={link.linkId}>
                      <TableCell className="font-medium text-blue-400">
                        {link.trafficerName || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{link.source || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {link.linkId}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-purple-400">
                        {link.stream || '-'}
                      </TableCell>
                      <TableCell className="text-green-400">
                        {link.geo || '-'}
                      </TableCell>
                      <TableCell className="text-orange-400">
                        {link.creativeUrl ? (
                          <a
                            href={link.creativeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {link.creative || link.creativeUrl}
                          </a>
                        ) : (
                          link.creative || '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right text-purple-400 font-semibold">{totalCount}</TableCell>
                      <TableCell className="text-right text-green-400 font-semibold">{totalUsers}</TableCell>
                      <TableCell className="text-right text-blue-400">{link.usersToday || 0}</TableCell>
                      <TableCell className="text-right text-cyan-400">{link.usersWeek || 0}</TableCell>
                      <TableCell className="text-right text-yellow-400">{leadCount}</TableCell>
                      <TableCell className="text-right text-sky-400">{link.channelLeads || 0}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                          {totalCount > 0 
                            ? formatPercent((totalUsers / totalCount) * 100)
                            : '0.00%'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                          {link.ftdCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          {formatPercent(link.depositConversionRate)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{link.totalDeposits}</TableCell>
                      <TableCell className="text-right text-cyan-400 font-semibold">
                        {formatMoney(link.totalDepositAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingLinkId === link.linkId ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={editCost}
                              onChange={(e) => setEditCost(e.target.value)}
                              className="w-20 h-7 text-xs"
                              step="0.01"
                              min="0"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleSaveCost(link.linkId)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={handleCancelEdit}
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-red-400">{formatMoney(link.trafficCost)}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditCost(link)}
                            >
                              <PencilSimple className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-yellow-400">
                        {link.cfpd > 0 ? formatMoney(link.cfpd) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            link.roi > 0
                              ? 'bg-green-500/20 text-green-400'
                              : link.roi < 0
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }
                        >
                          {link.roi > 0 ? '+' : ''}
                          {formatPercent(link.roi)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(link.createdAt)}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
