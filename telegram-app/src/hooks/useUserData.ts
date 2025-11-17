import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Referral {
  id: number
  referredUsername: string
  level: number
  earnings: number
  createdAt: string
}

interface UserData {
  id: string
  nickname: string
  status: string
  balance: number
  profit: number
  totalDeposit: number
  totalWithdraw: number
  plan: string
  kycRequired: boolean
  isBlocked: boolean
  lastProfitUpdate: string | null
  referralEarnings: number
  planProgress: {
    currentPlan: string
    dailyPercent: number
    nextPlan: string | null
    leftUntilNext: number
    progress: number
  }
  deposits: Array<{
    amount: number
    status: string
    currency: string
    createdAt: string
  }>
  withdrawals: Array<{
    amount: number
    status: string
    currency: string
    address: string
    createdAt: string
  }>
}

export function useUserData(telegramId: string | undefined) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!telegramId) {
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/${telegramId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found')
          } else {
            setError('Failed to load user data')
          }
          return
        }

        const data = await response.json()
        setUserData(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    // Refresh data every 10 seconds
    const interval = setInterval(fetchUserData, 10000)

    return () => clearInterval(interval)
  }, [telegramId])

  const refreshData = async () => {
    if (!telegramId) return

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/user/${telegramId}`)
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        setError(null)
      }
    } catch (err) {
      console.error('Error refreshing user data:', err)
    } finally {
      setLoading(false)
    }
  }

  return { userData, loading, error, refreshData }
}
