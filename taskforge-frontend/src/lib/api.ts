import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Only redirect if not already on login page (allows login form to show errors)
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('tf_token')
        localStorage.removeItem('tf_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)

export default api
