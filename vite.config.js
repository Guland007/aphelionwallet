// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // все ассеты из папки public будут запрашиваться от корня вашего домена
  // например: https://aphelionwallet.info/icons/eth.png
  base: '/',

  plugins: [
    react()
  ]
})
