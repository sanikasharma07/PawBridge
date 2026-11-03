import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import API, { TOKEN_KEY, USER_KEY } from '@/api/axios'

// Auth state (Rebuild Guide §3.3, §10). Access token lives in
// localStorage; the refresh token is an httpOnly cookie the JS never
// sees. Register forces role "user" on the backend — nobody self-assigns
// ngo/vet/admin. There is no mock login, no mock token, no role switcher:
// a failed call rejects with the backend's message.
function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, phone }, { rejectWithValue }) => {
    try {
      const res = await API.post('/users/register', { name, email, password, phone })
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.message || 'Registration failed. Please try again.')
    }
  },
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await API.post('/users/login', { email, password })
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed. Please check your credentials.')
    }
  },
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  // Logout works without a valid access token on the backend, and the
  // local state is cleared even if the call itself fails.
  try {
    await API.post('/users/logout')
  } catch {
    // Intentionally ignored: signing out locally must never be blocked.
  }
})

function applySession(state, payload) {
  state.user = payload.user
  state.token = payload.accessToken
  state.isAuthenticated = true
  localStorage.setItem(TOKEN_KEY, payload.accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
}

function clearSession(state) {
  state.user = null
  state.token = null
  state.isAuthenticated = false
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

const initialState = {
  user: loadUser(),
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY) && !!loadUser(),
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => { state.isLoading = false; applySession(state, action.payload) })
      .addCase(registerUser.rejected, (state, action) => { state.isLoading = false; state.error = action.payload })
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => { state.isLoading = false; applySession(state, action.payload) })
      .addCase(loginUser.rejected, (state, action) => { state.isLoading = false; state.error = action.payload })
      .addCase(logoutUser.fulfilled, (state) => { clearSession(state) })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer

// Role → home dashboard mapping (Guide §4). Unknown roles fall back to
// the user dashboard; a vet must never be bounced to /dashboard in a loop.
export function homePathForRole(role) {
  if (role === 'ngo') return '/ngo/dashboard'
  if (role === 'vet') return '/vet/dashboard'
  if (role === 'admin') return '/admin'
  return '/dashboard'
}
