import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base precisa bater com o nome do repositório no GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/ficha-no-pano/',
})
