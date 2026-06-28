import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true, // send the HttpOnly auth cookie on every request
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('tf_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)

export default api
