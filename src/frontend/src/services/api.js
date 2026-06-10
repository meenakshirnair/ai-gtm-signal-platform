import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Competitor endpoints
export const getCompetitors = async () => {
  try {
    const response = await api.get('/competitors')
    return response.data
  } catch (error) {
    console.error('Error fetching competitors:', error)
    throw error
  }
}

export const addCompetitor = async (competitorData) => {
  try {
    const response = await api.post('/competitors', competitorData)
    return response.data
  } catch (error) {
    console.error('Error adding competitor:', error)
    throw error
  }
}

export const getCompetitorUpdates = async (competitorId) => {
  try {
    const response = await api.get(`/competitors/${competitorId}/updates`)
    return response.data
  } catch (error) {
    console.error('Error fetching competitor updates:', error)
    throw error
  }
}

// Scraping endpoints
export const scrapeCompetitor = async (competitorId) => {
  try {
    const response = await api.post(`/scrape/competitors/${competitorId}`)
    return response.data
  } catch (error) {
    console.error('Error scraping competitor:', error)
    throw error
  }
}

export const scrapeMarketTrends = async (config) => {
  try {
    const response = await api.post('/scrape/market-trends', config)
    return response.data
  } catch (error) {
    console.error('Error scraping market trends:', error)
    throw error
  }
}

// Processing endpoints
export const processCompetitorUpdates = async () => {
  try {
    const response = await api.post('/process/competitor-updates')
    return response.data
  } catch (error) {
    console.error('Error processing competitor updates:', error)
    throw error
  }
}

// Alert endpoints
export const getAlerts = async (limit = 20) => {
  try {
    const response = await api.get('/alerts', { params: { limit } })
    return response.data
  } catch (error) {
    console.error('Error fetching alerts:', error)
    throw error
  }
}

// Statistics endpoints
export const getStatistics = async () => {
  try {
    const response = await api.get('/statistics')
    return response.data
  } catch (error) {
    console.error('Error fetching statistics:', error)
    throw error
  }
}

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    console.error('Error checking health:', error)
    throw error
  }
}

export default api
