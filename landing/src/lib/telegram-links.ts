import { useEffect, useState } from "react"

const API_BASE_URL = "https://api.syntrix.uno"
const TELEGRAM_BOT_URL = "https://t.me/AiSyntrixTrade_bot"
const DEFAULT_CHANNEL_URL = "https://t.me/SyntrixAI"

const CHANNEL_INVITE_BY_HOST: Record<string, string> = {
  "info.siintrix.site": "https://t.me/+ETuBMJ9s2Js1NmIy",
  "info.syntr1x.uno": "https://t.me/+ETuBMJ9s2Js1NmIy",
  "info.syntrixxx.site": "https://t.me/+ETuBMJ9s2Js1NmIy",
  "ss.siintrix.site": "https://t.me/+YmFilnI8DbFjNWEy",
  "ss.syntrixxx.site": "https://t.me/+YmFilnI8DbFjNWEy",
  "ss.syntrixxx.website": "https://t.me/+YmFilnI8DbFjNWEy",
  "road.siintrix.site": "https://t.me/+TLo5_JI7r0wxODky",
  "road.syntrixxx.site": "https://t.me/+TLo5_JI7r0wxODky",
  "road.syntrixxx.website": "https://t.me/+TLo5_JI7r0wxODky",
  "invest.siintrix.site": "https://t.me/+6w-QvvLfkt9iNzg6",
  "invest.syntrixxx.site": "https://t.me/+6w-QvvLfkt9iNzg6",
  "official.siintrix.site": "https://t.me/+tvQ2u0yoEJRhOTBi",
}

function getRefParam(): string {
  if (typeof window === "undefined") return ""
  return new URLSearchParams(window.location.search).get("ref")?.trim() || ""
}

function buildTrackedBotUrl(ref: string): string {
  return ref ? `${TELEGRAM_BOT_URL}?start=${encodeURIComponent(ref)}` : TELEGRAM_BOT_URL
}

function getDefaultChannelUrl(): string {
  if (typeof window === "undefined") return DEFAULT_CHANNEL_URL
  const host = window.location.hostname.toLowerCase()
  return CHANNEL_INVITE_BY_HOST[host] || DEFAULT_CHANNEL_URL
}

export function useTelegramTrackingUrls() {
  const [botUrl, setBotUrl] = useState(() => buildTrackedBotUrl(getRefParam()))
  const [channelUrl, setChannelUrl] = useState(() => {
    const ref = getRefParam()
    return ref && !/^mk_/i.test(ref) ? buildTrackedBotUrl(ref) : getDefaultChannelUrl()
  })

  useEffect(() => {
    const ref = getRefParam()
    const nextBotUrl = buildTrackedBotUrl(ref)
    const fallbackChannelUrl = ref && !/^mk_/i.test(ref) ? nextBotUrl : getDefaultChannelUrl()

    setBotUrl(nextBotUrl)
    setChannelUrl(fallbackChannelUrl)

    if (!ref || !/^mk_/i.test(ref)) return

    let cancelled = false

    fetch(`${API_BASE_URL}/api/marketing-links/${encodeURIComponent(ref)}/channel-invite`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return
        if (typeof data?.inviteLink === "string" && data.inviteLink.trim()) {
          setChannelUrl(data.inviteLink)
        }
      })
      .catch(() => {
        // Keep fallback URL if invite resolution fails.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { botUrl, channelUrl }
}