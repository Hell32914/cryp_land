import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Copy, Check, Trash } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { createMarketingLink, fetchMarketingLinks, toggleMarketingLink, deleteMarketingLink, type MarketingLink } from '@/lib/api'

const TELEGRAM_LANDING_DOMAIN = 'syntrix.website'

interface SubIdParam {
  id: number
  key: string
  value: string
}

export function LinkBuilder() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [source, setSource] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('syntrix.website')
  const [trackingPixel, setTrackingPixel] = useState('')
  const [pixelLoadedFromDomain, setPixelLoadedFromDomain] = useState(false)
  const [pixelConfirmed, setPixelConfirmed] = useState(false)
  const [subIdParams, setSubIdParams] = useState<SubIdParam[]>([
    { id: 1, key: '', value: '' }
  ])
  const [trafficerName, setTrafficerName] = useState('')
  const [stream, setStream] = useState('')
  const [geo, setGeo] = useState('')
  const [creative, setCreative] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [generatedLinkId, setGeneratedLinkId] = useState('')
  const [copied, setCopied] = useState(false)
  const [links, setLinks] = useState<MarketingLink[]>([])
  const [loading, setLoading] = useState(false)

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch (err) {
      // will try fallback below
    }
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.top = '0'
      textarea.style.left = '0'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch (err) {
      return false
    }
  }

  const domains = [
    { value: 'syntrix.website', label: 'syntrix.website', color: 'bg-blue-500' },
    { value: 'www.syntrix.website', label: 'www.syntrix.website', color: 'bg-blue-400' },
    { value: 'app.syntrix.website', label: 'app.syntrix.website', color: 'bg-purple-500' },
    { value: 'crypto-invest.pro', label: 'crypto-invest.pro', color: 'bg-green-500' },
    { value: 'trade-signal.net', label: 'trade-signal.net', color: 'bg-orange-500' },
  ]

  const sources = [
    { value: 'telegram', label: 'Telegram' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'email', label: 'Email Campaign' },
    { value: 'other', label: 'Other' },
  ]

  useEffect(() => {
    loadLinks()
  }, [])

  // Load manual pixel confirmation from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pixelConfirmationByDomain')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Record<string, boolean>
      const normalizedDomain = selectedDomain.trim().toLowerCase() || 'syntrix.website'
      setPixelConfirmed(!!parsed[normalizedDomain])
    } catch {}
  }, [selectedDomain])

  // Auto-generate SubID from metadata fields
  useEffect(() => {
    const parts = [trafficerName, stream, geo, creative].filter(Boolean)
    if (parts.length > 0) {
      const autoSubId = parts.join('_')
      setSubIdParams(params => {
        // Update first parameter with auto-generated SubID
        if (params.length === 0) {
          return [{ id: 1, key: 'subid', value: autoSubId }]
        }
        return params.map((param, index) => 
          index === 0 ? { ...param, key: 'subid', value: autoSubId } : param
        )
      })
    }
  }, [trafficerName, stream, geo, creative])

  const loadLinks = async () => {
    if (!token) return
    
    try {
      const data = await fetchMarketingLinks(token)
      setLinks(data.links)
    } catch (error) {
      console.error('Failed to load links:', error)
    }
  }

  // When user selects a domain that already has a pixel saved, prefill the textarea
  useEffect(() => {
    if (!links.length) return
    const normalize = (d?: string) => (d || 'syntrix.website').trim().toLowerCase()
    const targetDomain = normalize(selectedDomain)

    const found = links.find((l) => {
      const domainMatch = normalize(l.domain) === targetDomain
      const pixel = (l.trackingPixel || '').trim()
      return domainMatch && pixel.length > 0
    })

    const pixel = (found?.trackingPixel || '').trim()
    setTrackingPixel(pixel)
    setPixelLoadedFromDomain(pixel.length > 0)
    if (pixel.length > 0) {
      setPixelConfirmed(true)
      const saved = localStorage.getItem('pixelConfirmationByDomain')
      const normalizedDomain = targetDomain
      let map: Record<string, boolean> = {}
      try { if (saved) map = JSON.parse(saved) as Record<string, boolean> } catch {}
      map[normalizedDomain] = true
      localStorage.setItem('pixelConfirmationByDomain', JSON.stringify(map))
    }
  }, [selectedDomain, links])

  const addSubIdParam = () => {
    if (subIdParams.length < 5) {
      setSubIdParams([...subIdParams, { id: Date.now(), key: '', value: '' }])
    }
  }

  const updateSubIdParam = (id: number, field: 'key' | 'value', value: string) => {
    setSubIdParams(params =>
      params.map(param =>
        param.id === id ? { ...param, [field]: value } : param
      )
    )
  }

  const removeSubIdParam = (id: number) => {
    if (subIdParams.length > 1) {
      setSubIdParams(params => params.filter(param => param.id !== id))
    }
  }

  const generateLink = async () => {
    if (!source) {
      toast.error('Please select a source')
      return
    }

    if (!token) {
      toast.error('Not authenticated')
      return
    }

    setLoading(true)
    
    try {
      // Prepare UTM params
      const utmParams: Record<string, string> = {}
      subIdParams.forEach(param => {
        if (param.key && param.value) {
          utmParams[param.key] = param.value
        }
      })

      // Create marketing link in database
      const linkData = await createMarketingLink(token, {
        source,
        utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined,
        trafficerName: trafficerName || undefined,
        stream: stream || undefined,
        geo: geo || undefined,
        creative: creative || undefined,
        domain: selectedDomain,
        trackingPixel: trackingPixel || undefined
      })

      const link = `https://${selectedDomain || 'syntrix.website'}/?ref=${linkData.linkId}`
      setGeneratedLink(link)
      setGeneratedLinkId(linkData.linkId)
      
      // Reload links list
      await loadLinks()
      
      toast.success('Link created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create link')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      const ok = await copyText(generatedLink)
      if (ok) {
        setCopied(true)
        toast.success(t('linkBuilder.copied'))
        setTimeout(() => setCopied(false), 2000)
      } else {
        toast.error('Failed to copy')
      }
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const handleToggleActive = async (linkId: string, isActive: boolean) => {
    if (!token) return
    
    try {
      await toggleMarketingLink(token, linkId, !isActive)
      await loadLinks()
      toast.success(`Link ${!isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      toast.error('Failed to update link')
    }
  }

  const handleDelete = async (linkId: string) => {
    if (!token) return
    if (!confirm('Are you sure you want to delete this link?')) return
    
    try {
      await deleteMarketingLink(token, linkId)
      await loadLinks()
      toast.success('Link deleted')
    } catch (error) {
      toast.error('Failed to delete link')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t('linkBuilder.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configure Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t('linkBuilder.selectSource')}</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source..." />
                </SelectTrigger>
                <SelectContent>
                  {sources.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Выбор домена</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domains.map(d => (
                    <SelectItem key={d.value} value={d.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${d.color}`} />
                        {d.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tracking Pixel (опционально)</Label>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md text-sm font-mono"
                placeholder="Вставьте код пикселя отслеживания (например, Facebook Pixel, Google Tag)..."
                value={trackingPixel}
                onChange={(e) => setTrackingPixel(e.target.value)}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Этот пиксель будет автоматически встроен на лендинг для данной ссылки.</span>
                {pixelLoadedFromDomain && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Пиксель найден для домена</span>
                )}
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixelConfirmed}
                    onChange={(e) => {
                      const next = e.target.checked
                      setPixelConfirmed(next)
                      const normalizedDomain = selectedDomain.trim().toLowerCase() || 'syntrix.website'
                      const saved = localStorage.getItem('pixelConfirmationByDomain')
                      let map: Record<string, boolean> = {}
                      try { if (saved) map = JSON.parse(saved) as Record<string, boolean> } catch {}
                      map[normalizedDomain] = next
                      localStorage.setItem('pixelConfirmationByDomain', JSON.stringify(map))
                    }}
                  />
                  <span>Пиксель подтверждён</span>
                </label>
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base">Link Metadata</Label>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Ник Трафера</Label>
                <Input
                  placeholder="Enter trafficker name..."
                  value={trafficerName}
                  onChange={(e) => setTrafficerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Поток</Label>
                <Input
                  placeholder="Enter stream name..."
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Гео</Label>
                <Input
                  placeholder="Enter geo (e.g., RU, UA, KZ)..."
                  value={geo}
                  onChange={(e) => setGeo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Креатив</Label>
                <Input
                  placeholder="Enter creative name..."
                  value={creative}
                  onChange={(e) => setCreative(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>SubID Parameters</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSubIdParam}
                  disabled={subIdParams.length >= 5}
                >
                  <Plus size={16} className="mr-2" />
                  Add Parameter
                </Button>
              </div>

              {subIdParams.map((param, index) => (
                <div key={param.id} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={t('linkBuilder.parameter')}
                      value={param.key}
                      onChange={(e) => updateSubIdParam(param.id, 'key', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={t('linkBuilder.value')}
                      value={param.value}
                      onChange={(e) => updateSubIdParam(param.id, 'value', e.target.value)}
                    />
                  </div>
                  {subIdParams.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubIdParam(param.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={generateLink} className="w-full" disabled={loading}>
              {loading ? 'Creating...' : t('linkBuilder.generate')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('linkBuilder.generatedLink')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedLink ? (
              <>
                <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
                  {generatedLink}
                </div>
                <Button onClick={copyToClipboard} className="w-full" variant="outline">
                  {copied ? (
                    <>
                      <Check size={18} className="mr-2" />
                      {t('linkBuilder.copied')}
                    </>
                  ) : (
                    <>
                      <Copy size={18} className="mr-2" />
                      {t('linkBuilder.copy')}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>Configure and generate a link to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Links</CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No marketing links created yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Link ID</TableHead>
                    <TableHead>Trafficker</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead>Geo</TableHead>
                    <TableHead>Creative</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.linkId}>
                      <TableCell className="font-medium capitalize">{link.source}</TableCell>
                      <TableCell className="font-mono text-xs">{link.linkId}</TableCell>
                      <TableCell>
                        <span className="text-sm text-blue-400">
                          {link.trafficerName || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-purple-400">
                          {link.stream || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-green-400">
                          {link.geo || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-orange-400">
                          {link.creative || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{link.clicks}</TableCell>
                      <TableCell className="text-right">{link.conversions}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${link.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const linkUrl = `https://${link.domain || TELEGRAM_LANDING_DOMAIN}/?ref=${link.linkId}`
                                const ok = await copyText(linkUrl)
                                if (ok) {
                                  toast.success('Link copied!')
                                } else {
                                  toast.error('Failed to copy')
                                }
                              } catch {
                                toast.error('Failed to copy')
                              }
                            }}
                          >
                            <Copy size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(link.linkId, link.isActive)}
                          >
                            {link.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(link.linkId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
