// api.js - Axios instance with auth interceptor
import axios from 'axios'

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - attach auth token
api.interceptors.request.use(function (config) {
  const token = localStorage.getItem('payflow_token')
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

// Response interceptor - handle auth errors
api.interceptors.response.use(
  function (response) { return response },
  function (error) {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('payflow_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
