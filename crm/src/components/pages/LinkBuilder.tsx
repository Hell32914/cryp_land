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

interface SubIdParam {
  id: number
  key: string
  value: string
}

export function LinkBuilder() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [source, setSource] = useState('')
  const [baseUrl] = useState('https://t.me/AiSyntrixTrade_bot?start=')
  const [subIdParams, setSubIdParams] = useState<SubIdParam[]>([
    { id: 1, key: '', value: '' }
  ])
  const [generatedLink, setGeneratedLink] = useState('')
  const [generatedLinkId, setGeneratedLinkId] = useState('')
  const [copied, setCopied] = useState(false)
  const [links, setLinks] = useState<MarketingLink[]>([])
  const [loading, setLoading] = useState(false)

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

  const loadLinks = async () => {
    if (!token) return
    
    try {
      const data = await fetchMarketingLinks(token)
      setLinks(data.links)
    } catch (error) {
      console.error('Failed to load links:', error)
    }
  }

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
        utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined
      })

      const link = `${baseUrl}${linkData.linkId}`
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
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success(t('linkBuilder.copied'))
      setTimeout(() => setCopied(false), 2000)
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Link ID</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.linkId}>
                    <TableCell className="font-medium capitalize">{link.source}</TableCell>
                    <TableCell className="font-mono text-sm">{link.linkId}</TableCell>
                    <TableCell className="text-right">{link.clicks}</TableCell>
                    <TableCell className="text-right">{link.conversions}</TableCell>
                    <TableCell className="text-right">{link.conversionRate}%</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${link.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
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
                              await navigator.clipboard.writeText(`${baseUrl}${link.linkId}`)
                              toast.success('Link copied!')
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
