import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass, Funnel } from '@phosphor-icons/react'
import { useApiQuery } from '@/hooks/use-api-query'
import { fetchUsers, fetchUsersStats, updateUserRole, deleteUser, type UserRecord } from '@/lib/api'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

export function Users() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterLeadStatus, setFilterLeadStatus] = useState('all')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterTrafficker, setFilterTrafficker] = useState('')
  const [filterStatuses, setFilterStatuses] = useState<string[]>([])
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const tableScrollRef = useRef<HTMLDivElement | null>(null)
  const tableWrapperRef = useRef<HTMLDivElement | null>(null)
  const topScrollRef = useRef<HTMLDivElement | null>(null)
  const [scrollWidth, setScrollWidth] = useState(0)

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const resetFilters = () => {
    setFilterLeadStatus('all')
    setFilterCountry('')
    setFilterTrafficker('')
    setFilterStatuses([])
    setFilterDateFrom('')
    setFilterDateTo('')
    setPage(1)
  }

  const filterStatusParam = filterStatuses.length > 0 ? filterStatuses.join(',') : 'all'

  const applyFilters = () => {
    setPage(1)
    setFiltersOpen(false)
  }

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
    try {
      const stored = sessionStorage.getItem('crm.users.filterCountry')
      if (stored) {
        setFilterCountry(stored)
        setPage(1)
        sessionStorage.removeItem('crm.users.filterCountry')
      }
    } catch {
      // ignore
    }
  }, [])

  const { data, isLoading, isError } = useApiQuery(
    ['users', debouncedSearch, sortBy, sortOrder, page, filterLeadStatus, filterCountry, filterTrafficker, filterStatusParam, filterDateFrom, filterDateTo], 
    (authToken) => fetchUsers(authToken, {
      search: debouncedSearch,
      sortBy,
      sortOrder,
      page,
      country: filterCountry.trim() || undefined,
      leadStatus: filterLeadStatus,
      status: filterStatusParam,
      trafficker: filterTrafficker.trim() || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    }), 
    {
      enabled: Boolean(token),
    }
  )

  const { data: statsData } = useApiQuery(
    ['users-stats', filterLeadStatus, filterCountry, filterTrafficker, filterStatusParam, filterDateFrom, filterDateTo],
    (authToken) => fetchUsersStats(authToken, {
      country: filterCountry.trim() || undefined,
      leadStatus: filterLeadStatus,
      status: filterStatusParam,
      trafficker: filterTrafficker.trim() || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    }),
    {
      enabled: Boolean(token),
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  const users = data?.users ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1
  const hasNextPage = data?.hasNextPage ?? false
  const hasPrevPage = data?.hasPrevPage ?? false

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
  }, [handleTableScroll, refreshScrollWidth, users.length])

  useEffect(() => {
    const updateWidth = () => {
      refreshScrollWidth()
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [refreshScrollWidth, users.length, sortBy, sortOrder])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const updateRoleMutation = useMutation({
    mutationFn: ({ telegramId, role }: { telegramId: string; role: string }) =>
      updateUserRole(token!, telegramId, role),
    onSuccess: () => {
      toast.success('Role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUser(null)
    },
    onError: () => {
      toast.error('Failed to update role')
    },
  })

  const handleRoleChange = (role: string) => {
    if (selectedUser) {
      updateRoleMutation.mutate({ telegramId: selectedUser.telegramId, role })
    }
  }

  const deleteUserMutation = useMutation({
    mutationFn: (telegramId: string) => deleteUser(token!, telegramId),
    onSuccess: () => {
      toast.success('User deleted')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUser(null)
    },
    onError: () => {
      toast.error('Failed to delete user')
    },
  })

  const handleDeleteUser = () => {
    if (!selectedUser) return
    if (!confirm(`Delete user ${selectedUser.telegramId}? This will remove all related records (deposits, withdrawals, notifications, referrals, etc.).`)) return
    deleteUserMutation.mutate(selectedUser.telegramId)
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'INACTIVE':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'KYC_REQUIRED':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'BLOCKED':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('users.title')}</h1>
        {/* Status Summary */}
        <div className="flex gap-2">
          <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-xs text-green-400 font-medium">{t('users.statsActive')}</div>
            <div className="text-xl font-bold text-green-400">
              {statsData?.active ?? 0}
            </div>
          </div>
          <div className="px-4 py-2 rounded-lg bg-gray-500/10 border border-gray-500/20">
            <div className="text-xs text-gray-400 font-medium">{t('users.statsInactive')}</div>
            <div className="text-xl font-bold text-gray-400">
              {statsData?.inactive ?? 0}
            </div>
          </div>
          <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-xs text-red-400 font-medium">{t('users.statsBlocked')}</div>
            <div className="text-xl font-bold text-red-400">
              {statsData?.blocked ?? 0}
            </div>
          </div>
          <div className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs text-blue-400 font-medium">{t('users.statsTotal')}</div>
            <div className="text-xl font-bold text-blue-400">
              {statsData?.total ?? 0}
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder={t('users.search')}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setFiltersOpen(true)}>
              <Funnel size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                    <div
                      ref={topScrollRef}
                      onScroll={handleTopScroll}
                      className="overflow-x-auto overflow-y-hidden bg-muted/20 border-b border-border/60 h-4"
                    >
                      <div style={{ width: scrollWidth, height: 16 }} />
                    </div>
                {isLoading ? (
                  <div className="space-y-2 p-6">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="h-10 w-full animate-pulse rounded bg-muted/50" />
                    ))}
                  </div>
                ) : isError ? (
                  <div className="p-6 text-sm text-destructive">{t('common.error')}</div>
                ) : (
                  <div ref={tableWrapperRef} className="overflow-hidden">
                    <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead 
                          className="cursor-pointer select-none hover:bg-muted/70 sticky left-0 z-20 bg-muted/50 w-[72px] min-w-[72px] border-r border-border shadow-[2px_0_0_0_rgba(0,0,0,0.06)] overflow-hidden text-ellipsis"
                      onClick={() => handleSort('id')}
                    >
                      ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                        <TableHead className="sticky left-[72px] z-20 bg-muted/50 min-w-[140px] border-r border-border shadow-[2px_0_0_0_rgba(0,0,0,0.06)] overflow-hidden text-ellipsis">User ID</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70 sticky left-[212px] z-20 bg-muted/50 min-w-[180px] border-r border-border shadow-[2px_0_0_0_rgba(0,0,0,0.06)]"
                      onClick={() => handleSort('username')}
                    >
                      Username {sortBy === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Lead Status</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70"
                      onClick={() => handleSort('country')}
                    >
                      Country {sortBy === 'country' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70 text-right"
                      onClick={() => handleSort('balance')}
                    >
                      Balance {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70 text-right"
                      onClick={() => handleSort('totalDeposit')}
                    >
                      Total Deps {sortBy === 'totalDeposit' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70 text-right"
                      onClick={() => handleSort('totalWithdraw')}
                    >
                      Total Withdraw {sortBy === 'totalWithdraw' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Net (D-W)</TableHead>
                    <TableHead>Trafficker</TableHead>
                    <TableHead>Link Name</TableHead>
                    <TableHead>Blocked</TableHead>
                    <TableHead className="text-center">Referrals</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70"
                      onClick={() => handleSort('status')}
                    >
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/70"
                      onClick={() => handleSort('createdAt')}
                    >
                      Registered {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isChannel = (user.marketingSource || '').toLowerCase() === 'channel'
                    const hasStartedBot = Boolean(user.botStartedAt)
                    const isInactive = String(user.status || '').toUpperCase() === 'INACTIVE'
                    const isChannelOnly = isChannel && !hasStartedBot && isInactive
                    const isKnownUser = Boolean(user.country && user.country !== 'Unknown')

                    const label = isChannelOnly ? 'channel' : (isKnownUser ? 'user' : 'lead')
                    const badgeClass = isChannelOnly
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : (isKnownUser
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20')

                    const isLeadLike = label !== 'user'
                    const normalizedStatus = String(user.status || '').toUpperCase()
                    const displayStatus = isLeadLike && normalizedStatus === 'ACTIVE' ? 'INACTIVE' : user.status
                    const statusClass = getStatusColor(isLeadLike && normalizedStatus === 'ACTIVE' ? 'INACTIVE' : user.status)

                    return (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground sticky left-0 z-20 bg-card w-[72px] min-w-[72px] border-r border-border shadow-[2px_0_0_0_rgba(0,0,0,0.06)]">
                        {user.id}
                      </TableCell>
                      <TableCell className="font-mono text-xs sticky left-[72px] z-20 bg-card min-w-[140px] border-r border-border shadow-[2px_0_0_0_rgba(0,0,0,0.06)]">
                        {user.telegramId}
                      </TableCell>
                      <TableCell className="font-medium text-sm sticky left-[212px] z-10 bg-card min-w-[180px] border-r border-border shadow-[2px_0_0_0_rgba(0,0,0,0.06)]">
                        <button
                          type="button"
                          onClick={() => {
                            const chatId = String(user.telegramId).trim()
                            if (!chatId) return
                            window.dispatchEvent(new CustomEvent('crm:navigate', { detail: { page: 'support', supportChatId: chatId } }))
                          }}
                          className={user.username ? 'text-primary hover:underline' : 'text-foreground hover:underline'}
                        >
                          {user.username ? `@${String(user.username).replace(/^@/, '')}` : user.fullName}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badgeClass}>
                          {label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{user.country}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${user.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-green-400">
                        ${user.totalDeposit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-orange-400">
                        ${user.totalWithdraw.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={(user.totalDeposit - user.totalWithdraw) >= 0 ? 'text-cyan-400' : 'text-red-400'}>
                          ${(user.totalDeposit - user.totalWithdraw).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-blue-400">
                        {user.trafficerName || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-purple-400 max-w-[120px] truncate" title={user.linkName || ''}>
                        {user.linkName || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.isBlocked ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>
                          {user.isBlocked ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                          {user.referralCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusClass}>
                          {displayStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
                </Table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {!isLoading && !isError && (
            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {users.length} of {totalCount} users (Page {page} of {totalPages})
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!hasPrevPage}
                >
                  <CaretLeft size={16} />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={!hasNextPage}
                >
                  Next
                  <CaretRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('users.filter')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">{t('users.leadStatus')}</label>
              <select
                value={filterLeadStatus}
                onChange={(e) => {
                  setFilterLeadStatus(e.target.value)
                  setPage(1)
                }}
                className="mt-1 w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="all">{t('users.leadStatusAll')}</option>
                <option value="lead">{t('users.leadStatusLead')}</option>
                <option value="user">{t('users.leadStatusUser')}</option>
                <option value="channel">{t('users.leadStatusChannel')}</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">{t('users.status')}</label>
              <div className="mt-1 rounded-md border border-border bg-muted/30 p-3 space-y-2">
                {['ACTIVE', 'INACTIVE', 'PENDING', 'KYC_REQUIRED', 'BLOCKED'].map((statusValue) => {
                  const checked = filterStatuses.includes(statusValue)
                  return (
                    <label key={statusValue} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) => {
                          setFilterStatuses((prev) => {
                            const shouldAdd = Boolean(nextChecked)
                            if (shouldAdd) {
                              if (prev.includes(statusValue)) return prev
                              return [...prev, statusValue]
                            }
                            return prev.filter((value) => value !== statusValue)
                          })
                          setPage(1)
                        }}
                      />
                      <span>{statusValue}</span>
                    </label>
                  )
                })}
                {filterStatuses.length === 0 ? (
                  <div className="text-xs text-muted-foreground">{t('users.statusAll')}</div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">{t('users.country')}</label>
              <Input
                value={filterCountry}
                onChange={(e) => {
                  setFilterCountry(e.target.value)
                  setPage(1)
                }}
                placeholder={t('users.country')}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">{t('users.trafficker')}</label>
              <Input
                value={filterTrafficker}
                onChange={(e) => {
                  setFilterTrafficker(e.target.value)
                  setPage(1)
                }}
                placeholder={t('users.trafficker')}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">{t('users.dateFrom')}</label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value)
                  setPage(1)
                }}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">{t('users.dateTo')}</label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value)
                  setPage(1)
                }}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={resetFilters}>
              {t('users.reset')}
            </Button>
            <Button onClick={applyFilters}>{t('users.apply')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('users.userDetails')}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Comment Section */}
              {selectedUser.comment && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs text-blue-400 font-medium mb-1">Comment</div>
                  <div className="text-sm text-blue-300">{selectedUser.comment}</div>
                </div>
              )}

              {/* Main Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ID</div>
                  <div className="font-mono font-medium">{selectedUser.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Telegram ID</div>
                  <div className="font-mono font-medium">{selectedUser.telegramId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Username</div>
                  <div className="font-medium">{selectedUser.username || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Full Name</div>
                  <div className="font-medium">{selectedUser.fullName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Country</div>
                  <div>{selectedUser.country}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Language</div>
                  <div>{selectedUser.languageCode?.toUpperCase() || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant="outline" className={getStatusColor(selectedUser.status)}>
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Registration Date</div>
                  <div className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="pt-4 border-t border-border">
                <div className="text-sm font-medium mb-3">Financial Data</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className="font-mono font-medium text-lg">${selectedUser.balance.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Profit</div>
                    <div className="font-mono font-medium text-lg text-cyan-400">${selectedUser.currentProfit.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Profit (Lifetime)</div>
                    <div className="font-mono font-medium text-green-400">${selectedUser.totalProfit.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Remaining Balance</div>
                    <div className="font-mono font-medium">${selectedUser.remainingBalance.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Deposits</div>
                    <div className="font-mono font-medium">${selectedUser.totalDeposit.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">First Deposit (FTD)</div>
                    <div className="font-mono font-medium text-yellow-400">
                      ${selectedUser.firstDepositAmount > 0 ? selectedUser.firstDepositAmount.toFixed(2) : '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Withdrawals</div>
                    <div className="font-mono font-medium">${selectedUser.totalWithdraw.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Withdrawal Status</div>
                    <Badge variant="outline" className={
                      selectedUser.withdrawalStatus === 'allowed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      selectedUser.withdrawalStatus === 'blocked' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }>
                      {selectedUser.withdrawalStatus === 'allowed' ? '✓ Allowed' :
                       selectedUser.withdrawalStatus === 'blocked' ? '✗ Blocked' :
                       '⏳ Verification'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Referral Info */}
              <div className="pt-4 border-t border-border">
                <div className="text-sm font-medium mb-3">Referral Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Referrals Count</div>
                    <div className="font-medium text-purple-400">{selectedUser.referralCount} users</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Referred By</div>
                    <div className="font-medium">{selectedUser.referredBy || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Marketing Info */}
              {(selectedUser.marketingSource || selectedUser.utmParams) && (
                <div className="pt-4 border-t border-border">
                  <div className="text-sm font-medium mb-3">Marketing Data</div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.marketingSource && (
                      <div>
                        <div className="text-sm text-muted-foreground">Traffic Source</div>
                        <div className="font-medium">{selectedUser.marketingSource}</div>
                      </div>
                    )}
                    {selectedUser.utmParams && (
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">UTM Parameters</div>
                        <div className="text-xs font-mono bg-muted/30 p-2 rounded mt-1">{selectedUser.utmParams}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security Info */}
              <div className="pt-4 border-t border-border">
                <div className="text-sm font-medium mb-3">Security & Access</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Blocked in Bot</div>
                    <Badge variant="outline" className={selectedUser.isBlocked ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>
                      {selectedUser.isBlocked ? '✗ Yes' : '✓ No'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">KYC Required</div>
                    <Badge variant="outline" className={selectedUser.kycRequired ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>
                      {selectedUser.kycRequired ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="space-y-3">
                  <div className="text-sm font-medium">User Role</div>
                  <Select value={selectedUser.role || 'user'} onValueChange={handleRoleChange} disabled={updateRoleMutation.isPending}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Support: Can view users, manage cards, approve/reject withdrawals ≥ $100
                    <br />
                    Admin: Full access to all features
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <Button
                  variant="outline"
                  className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
                  onClick={handleDeleteUser}
                  disabled={deleteUserMutation.isPending}
                >
                  {deleteUserMutation.isPending ? 'Deleting…' : '🗑 Delete User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
