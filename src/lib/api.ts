import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

function redirectToLogin() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('userType')
  localStorage.removeItem('orgName')

  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// 请求拦截器：自动附加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一处理业务错误
api.interceptors.response.use(
  (res) => {
    const { code, message, result } = res.data
    if (code !== '200' && code !== '0') {
      if (code === '401' || code === '403') {
        redirectToLogin()
      }
      return Promise.reject(new Error(message || '请求失败'))
    }
    return result
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      redirectToLogin()
    }
    return Promise.reject(error)
  },
)

export default api
