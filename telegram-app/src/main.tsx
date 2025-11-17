import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import '@github/spark/spark'
import './index.css'
import App from './App.tsx'

// Initialize Telegram WebApp
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready()
  window.Telegram.WebApp.expand()
  window.Telegram.WebApp.enableClosingConfirmation()
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-destructive">Something went wrong</h2>
        <pre className="text-sm text-muted-foreground overflow-auto">{error.message}</pre>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-3 rounded-lg"
        >
          Reload App
        </button>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
