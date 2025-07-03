
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Прокси удален. Вместо него мы используем переменную окружения
    // VITE_API_BASE_URL, чтобы указать полный путь к API.
    // Это работает как для разработки, так и для продакшена.
  },
})
