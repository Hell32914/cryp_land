import "@github/spark/spark"
import "./main.css"
import "./styles/theme.css"
import "./index.css"

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { LanguageProvider } from './lib/LanguageContext.tsx'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <LanguageProvider>
      <App />
    </LanguageProvider>
   </ErrorBoundary>
)
