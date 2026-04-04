import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import '@/assets/styles/main.css'
import { initDB } from '@/utils/indexedDB'

// 初始化数据库
initDB().then(() => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.mount('#app')
}).catch(error => {
  console.error('Failed to initialize database:', error)
})
