import "@github/spark/spark"
import "./main.css"
import "./styles/theme.css"
import "./index.css"

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { LanguageProvider } from './lib/LanguageContext.tsx'

const injectTrackingPixel = (html: string) => {
  if (!html.trim()) return
  if ((window as any).__syntrixTrackingPixelInjected) return
  ;(window as any).__syntrixTrackingPixelInjected = true

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const appendScript = (original: HTMLScriptElement) => {
    const script = document.createElement('script')
    for (const { name, value } of Array.from(original.attributes)) {
      script.setAttribute(name, value)
    }
    script.text = original.text
    script.setAttribute('data-syntrix-tracking-pixel', '1')
    document.head.appendChild(script)
  }

  const appendNode = (node: Element) => {
    const clone = node.cloneNode(true) as Element
    clone.setAttribute('data-syntrix-tracking-pixel', '1')
    document.body.appendChild(clone)
  }

  const scripts = Array.from(doc.querySelectorAll('script')) as HTMLScriptElement[]
  scripts.forEach(appendScript)

  const otherNodes = Array.from(doc.body.children).filter((el) => el.tagName.toLowerCase() !== 'script')
  otherNodes.forEach(appendNode)
}

const maybeLoadTrackingPixel = async () => {
  const ref = new URLSearchParams(window.location.search).get('ref')
  if (!ref) return

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://api.syntrix.uno'
    const response = await fetch(`${API_URL}/api/marketing-links/${encodeURIComponent(ref)}/pixel`)
    if (!response.ok) return

    const data = await response.json()
    if (typeof data?.trackingPixel === 'string' && data.trackingPixel.trim()) {
      injectTrackingPixel(data.trackingPixel)
    }
  } catch {
    // Don't block landing render if pixel fails
  }
}

void maybeLoadTrackingPixel()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <LanguageProvider>
      <App />
    </LanguageProvider>
   </ErrorBoundary>
)
