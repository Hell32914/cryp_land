import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Copy, Check } from '@phosphor-icons/react'
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
import { toast } from 'sonner'

interface SubIdParam {
  id: number
  key: string
  value: string
}

export function LinkBuilder() {
  const { t } = useTranslation()
  const [source, setSource] = useState('')
  const [baseUrl] = useState('https://t.me/syntrix_bot?start=')
  const [subIdParams, setSubIdParams] = useState<SubIdParam[]>([
    { id: 1, key: '', value: '' }
  ])
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  const sources = [
    { value: 'telegram', label: 'Telegram Bot' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitter', label: 'Twitter/X' },
  ]

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

  const generateLink = () => {
    if (!source) {
      toast.error('Please select a source')
      return
    }

    const params = new URLSearchParams()
    params.append('source', source)
    
    subIdParams.forEach((param, index) => {
      if (param.key && param.value) {
        params.append(param.key, param.value)
      }
    })

    const link = `${baseUrl}${params.toString()}`
    setGeneratedLink(link)
    toast.success(t('common.success'))
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

            <Button onClick={generateLink} className="w-full">
              {t('linkBuilder.generate')}
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
    </div>
  )
}
