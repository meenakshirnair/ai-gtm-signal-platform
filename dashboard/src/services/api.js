import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getSignals = async (competitor = null, impact = null, limit = 20) => {
  try {
    const params = { limit }
    if (competitor) params.competitor = competitor
    if (impact) params.impact = impact
    const response = await api.get('/signals', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching signals:', error)
    throw error
  }
}

export const getStats = async () => {
  try {
    const response = await api.get('/stats')
    return response.data
  } catch (error) {
    console.error('Error fetching stats:', error)
    throw error
  }
}

export const getLatestDigest = async () => {
  try {
    const response = await api.get('/digest/latest')
    return response.data
  } catch (error) {
    console.error('Error fetching digest:', error)
    throw error
  }
}

export default api
