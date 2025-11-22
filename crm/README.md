# CRM - Telegram Bot Management Platform

Admin panel for managing telegram bot users, deposits, withdrawals, and analytics.

## 🚀 Deployment

### Railway Deployment

This CRM is configured for easy deployment on Railway:

1. Connect your GitHub repository to Railway
2. Set **Root Directory** to `crm`
3. Deploy! No additional configuration needed.

### Environment Variables

The app works in two modes:

**Standalone Mode (Default)**
- Uses mock data for demonstration
- No backend required
- Default credentials: `admin` / `admin`

**Connected Mode**
- Set `VITE_API_URL` to your backend API URL
- Connects to real backend for data

Example `.env`:
```bash
# Leave empty for mock mode
VITE_API_URL=

# Or set your backend URL
# VITE_API_URL=https://your-api.com
```

## 🛠️ Local Development

```bash
npm install
npm run dev
```

Default login: `admin` / `admin`

## 📦 Build

```bash
npm run build
```

Built files will be in the `dist/` directory.

## 🔧 Tech Stack

- React 19 + TypeScript
- Vite
- TailwindCSS
- Radix UI Components
- React Query
- i18next
