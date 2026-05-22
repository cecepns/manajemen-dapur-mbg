import axios from 'axios'

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  baseURL: import.meta.env.VITE_API_URL || 'https://api.kingcreativestudio.my.id.com/dapur-mbg',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const hasToken = Boolean(localStorage.getItem('token'))

    if (status === 401 && hasToken) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)

export default api
