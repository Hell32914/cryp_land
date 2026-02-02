import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function RefLinks() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editCost, setEditCost] = useState('')
  const [traffickerFilter, setTraffickerFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [expandedTrafficker, setExpandedTrafficker] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const tableWrapperRef = useRef<HTMLDivElement | null>(null)
  const tableScrollRef = useRef<HTMLDivElement | null>(null)
  const topScrollRef = useRef<HTMLDivElement | null>(null)
  const [scrollWidth, setScrollWidth] = useState(0)

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

  const groupedLinks = useMemo(() => {
    const map = new Map<string, MarketingLink[]>()
    for (const link of filteredLinks) {
      const key = (link.trafficerName || 'Unknown').trim() || 'Unknown'
      const list = map.get(key)
      if (list) list.push(link)
      else map.set(key, [link])
    }
    return Array.from(map.entries()).map(([trafficker, group]) => ({ trafficker, links: group }))
  }, [filteredLinks])

  const handleTopScroll = useCallback(() => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
  }, [])

  const handleTableScroll = useCallback(() => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft
    }
  }, [])

  const refreshScrollWidth = useCallback(() => {
    const tableWidth = tableScrollRef.current?.scrollWidth || 0
    const containerWidth = tableScrollRef.current?.clientWidth || 0
    setScrollWidth(Math.max(tableWidth, containerWidth))
  }, [])

  useEffect(() => {
    const wrapper = tableWrapperRef.current
    if (!wrapper) return
    const container = wrapper.querySelector<HTMLDivElement>('[data-slot="table-container"]')
    if (!container) return

    tableScrollRef.current = container
    const onScroll = () => handleTableScroll()
    container.addEventListener('scroll', onScroll, { passive: true })
    requestAnimationFrame(refreshScrollWidth)
    return () => container.removeEventListener('scroll', onScroll)
  }, [handleTableScroll, refreshScrollWidth, groupedLinks.length])

  useEffect(() => {
    const updateWidth = () => refreshScrollWidth()
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [refreshScrollWidth])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t('refLinks.title')}</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setHelpOpen(true)}
            aria-label="Referral links help"
            className="h-8 w-8"
          >
            ?
          </Button>
        </div>
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
            <div className="rounded-md border border-border overflow-hidden">
              <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="overflow-x-auto overflow-y-hidden bg-muted/20 border-b border-border/60 h-4"
              >
                <div style={{ width: scrollWidth, height: 16 }} />
              </div>
              <div ref={tableWrapperRef} className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-muted/50 border-r border-border shadow-[2px_0_0_0_rgba(0,0,0,0.06)]">Trafficker</TableHead>
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
                  {groupedLinks.map((group) => {
                    const leadCount = group.links.reduce((sum, link) => sum + (link.totalLeads || 0) + (link.channelLeads || 0), 0)
                    const totalUsers = group.links.reduce((sum, link) => sum + (link.totalUsers || 0), 0)
                    const totalCount = leadCount + totalUsers
                    const usersToday = group.links.reduce((sum, link) => sum + (link.usersToday || 0), 0)
                    const usersWeek = group.links.reduce((sum, link) => sum + (link.usersWeek || 0), 0)
                    const channelLeads = group.links.reduce((sum, link) => sum + (link.channelLeads || 0), 0)
                    const ftdCount = group.links.reduce((sum, link) => sum + (link.ftdCount || 0), 0)
                    const totalDeposits = group.links.reduce((sum, link) => sum + (link.totalDeposits || 0), 0)
                    const totalDepositAmount = group.links.reduce((sum, link) => sum + (link.totalDepositAmount || 0), 0)
                    const trafficCost = group.links.reduce((sum, link) => sum + (link.trafficCost || 0), 0)
                    const totalProfit = group.links.reduce((sum, link) => sum + (link.totalProfit || 0), 0)
                    const cfpd = ftdCount > 0 ? trafficCost / ftdCount : 0
                    const depositCr = totalUsers > 0 ? (ftdCount / totalUsers) * 100 : 0
                    const roi = trafficCost > 0 ? ((totalProfit - trafficCost) / trafficCost) * 100 : 0
                    const latestCreated = group.links.reduce((latest, link) =>
                      new Date(link.createdAt).getTime() > new Date(latest).getTime() ? link.createdAt : latest
                    , group.links[0]?.createdAt || new Date().toISOString())
                    const isExpanded = expandedTrafficker === group.trafficker

                    return (
                      <Fragment key={`group-${group.trafficker}`}>
                        <TableRow
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => setExpandedTrafficker(isExpanded ? null : group.trafficker)}
                        >
                          <TableCell className="font-medium text-blue-400 sticky left-0 z-10 bg-card border-r border-border shadow-[2px_0_0_0_rgba(0,0,0,0.06)]">
                            {group.trafficker}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{group.links.length} links</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              —
                            </Badge>
                          </TableCell>
                          <TableCell className="text-purple-400">—</TableCell>
                          <TableCell className="text-green-400">—</TableCell>
                          <TableCell className="text-orange-400">—</TableCell>
                          <TableCell className="text-right text-purple-400 font-semibold">{totalCount}</TableCell>
                          <TableCell className="text-right text-green-400 font-semibold">{totalUsers}</TableCell>
                          <TableCell className="text-right text-blue-400">{usersToday}</TableCell>
                          <TableCell className="text-right text-cyan-400">{usersWeek}</TableCell>
                          <TableCell className="text-right text-yellow-400">{leadCount}</TableCell>
                          <TableCell className="text-right text-sky-400">{channelLeads}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                              {totalCount > 0 ? formatPercent((totalUsers / totalCount) * 100) : '0.00%'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                              {ftdCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                              {formatPercent(depositCr)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{totalDeposits}</TableCell>
                          <TableCell className="text-right text-cyan-400 font-semibold">
                            {formatMoney(totalDepositAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMoney(trafficCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMoney(cfpd)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={roi >= 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}
                            >
                              {formatPercent(roi)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(latestCreated)}
                          </TableCell>
                        </TableRow>

                        {isExpanded
                          ? group.links.map((link) => {
                              const linkLeadCount = (link.totalLeads || 0) + (link.channelLeads || 0)
                              const linkTotalUsers = link.totalUsers || 0
                              const linkTotalCount = linkLeadCount + linkTotalUsers
                              return (
                                <TableRow key={link.linkId} className="bg-muted/20 hover:bg-muted/30">
                                  <TableCell className="font-medium text-blue-400 pl-6 sticky left-0 z-10 bg-muted/20 border-r border-border shadow-[2px_0_0_0_rgba(0,0,0,0.06)]">
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
                                  <TableCell className="text-right text-purple-400 font-semibold">{linkTotalCount}</TableCell>
                                  <TableCell className="text-right text-green-400 font-semibold">{linkTotalUsers}</TableCell>
                                  <TableCell className="text-right text-blue-400">{link.usersToday || 0}</TableCell>
                                  <TableCell className="text-right text-cyan-400">{link.usersWeek || 0}</TableCell>
                                  <TableCell className="text-right text-yellow-400">{linkLeadCount}</TableCell>
                                  <TableCell className="text-right text-sky-400">{link.channelLeads || 0}</TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                                      {linkTotalCount > 0
                                        ? formatPercent((linkTotalUsers / linkTotalCount) * 100)
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
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleSaveCost(link.linkId)}
                                        >
                                          <CheckCircle size={16} className="text-green-500" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={handleCancelEdit}
                                        >
                                          <XCircle size={16} className="text-red-500" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditCost(link)}
                                      >
                                        <PencilSimple size={14} className="mr-1" />
                                        {formatMoney(link.trafficCost || 0)}
                                      </Button>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatMoney(link.cfpd || 0)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge
                                      variant="outline"
                                      className={(link.roi || 0) >= 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}
                                    >
                                      {formatPercent(link.roi || 0)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {formatDate(link.createdAt)}
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          : null}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Referral links: columns legend</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div><span className="text-foreground">Trafficker</span> — owner/partner of the link.</div>
            <div><span className="text-foreground">Source</span> — traffic source (e.g., Facebook).</div>
            <div><span className="text-foreground">Link ID</span> — unique tracking id.</div>
            <div><span className="text-foreground">Stream</span> — stream name.</div>
            <div><span className="text-foreground">Geo</span> — target country/region.</div>
            <div><span className="text-foreground">Creative</span> — creative name (clickable if link provided).</div>
            <div><span className="text-foreground">Total</span> — total leads + users.</div>
            <div><span className="text-foreground">TOTAL USER</span> — total registered users.</div>
            <div><span className="text-foreground">TODAY USERS</span> — users registered today.</div>
            <div><span className="text-foreground">WEEK USER</span> — users registered this week.</div>
            <div><span className="text-foreground">LEADS</span> — total leads.</div>
            <div><span className="text-foreground">CHANNEL</span> — channel leads.</div>
            <div><span className="text-foreground">CR% Lead→User</span> — lead to user conversion rate.</div>
            <div><span className="text-foreground">FTD</span> — first-time deposits count.</div>
            <div><span className="text-foreground">CR %</span> — deposit conversion rate.</div>
            <div><span className="text-foreground">Deps</span> — total deposits count.</div>
            <div><span className="text-foreground">Dep Amount</span> — total deposit amount.</div>
            <div><span className="text-foreground">Traffic Cost</span> — total traffic spend.</div>
            <div><span className="text-foreground">CFPD</span> — cost per first deposit.</div>
            <div><span className="text-foreground">ROI %</span> — return on investment.</div>
            <div><span className="text-foreground">Created</span> — link creation date.</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
