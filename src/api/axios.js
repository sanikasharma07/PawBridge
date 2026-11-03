import axios from 'axios'

// Single shared API client (Rebuild Guide §10).
// Base URL: VITE_API_URL, default http://localhost:5000/api/v1.
// withCredentials: true so the httpOnly jwt_refresh cookie is sent for
// refresh/logout. Every response uses the backend envelope
// { success, statusCode, message, data } — callers read response.data.data.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  timeout: 30000,
})

export const TOKEN_KEY = 'al_access_token'
export const USER_KEY = 'al_user'

API.interceptors.request.use((config) => {
  // Never set Content-Type by hand for FormData: the browser must set
  // the multipart boundary, or Multer on the backend cannot parse it.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  if (!config._isRefresh) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const url = original?.url || ''
    const isAuthCall = /\/users\/(login|register|refresh|logout)/.test(url)
    // Refresh once on 401, then retry. Never loop: _retry guards it,
    // and auth calls themselves never trigger a refresh.
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = API.post('/users/refresh', null, { _isRefresh: true }).finally(() => {
            refreshPromise = null
          })
        }
        const res = await refreshPromise
        const newToken = res.data?.data?.accessToken || res.data?.data?.token
        if (newToken) {
          localStorage.setItem(TOKEN_KEY, newToken)
          original.headers.Authorization = `Bearer ${newToken}`
        }
        return API(original)
      } catch (refreshError) {
        // Session is gone. Only announce it if a token existed: a
        // logged-out visitor hitting an auth-gated list must see that
        // page's sign-in state, not a forced redirect.
        const hadToken = !!localStorage.getItem(TOKEN_KEY)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        if (hadToken) window.dispatchEvent(new Event('al:session-expired'))
        return Promise.reject(normalise(refreshError))
      }
    }
    return Promise.reject(normalise(error))
  },
)

// Normalise every rejection to { message, statusCode } from the backend
// envelope, so components can display error.message directly.
function normalise(error) {
  const data = error.response?.data
  const err = new Error(data?.message || error.message || 'Something went wrong. Please try again.')
  err.statusCode = data?.statusCode || error.response?.status || 0
  err.original = error
  return err
}

export default API
