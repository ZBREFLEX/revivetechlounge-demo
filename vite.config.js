import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: [
      'sb-1evm0ufu3jqt.vercel.run',
      'localhost',
      '127.0.0.1',
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
