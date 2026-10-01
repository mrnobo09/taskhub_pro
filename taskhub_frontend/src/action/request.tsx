import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

const ACCESS_TOKEN_KEY = 'taskhub.accessToken'
const REFRESH_TOKEN_KEY = 'taskhub.refreshToken'
const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({ baseURL: apiBaseUrl })

const refreshClient = axios.create({ baseURL: apiBaseUrl })
let refreshInFlight: Promise<string> | null = null

export function persistTokens(tokens: TokenPair) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function hasStoredTokens() {
  return Boolean(
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
      localStorage.getItem(REFRESH_TOKEN_KEY),
  )
}

function sessionExpired() {
  clearTokens()
  window.dispatchEvent(new Event('taskhub:session-expired'))
}

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    const url = originalRequest?.url ?? ''
    const isAuthRequest = ['/auth/login', '/auth/register', '/auth/refresh'].some(
      (path) => url.endsWith(path),
    )

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest
    ) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      sessionExpired()
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      if (!refreshInFlight) {
        refreshInFlight = refreshClient
          .post<TokenPair>('/auth/refresh', { refresh_token: refreshToken })
          .then(({ data }) => {
            persistTokens(data)
            return data.access_token
          })
          .finally(() => {
            refreshInFlight = null
          })
      }

      const accessToken = await refreshInFlight
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      sessionExpired()
      return Promise.reject(refreshError)
    }
  },
)

export function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  return fallback
}