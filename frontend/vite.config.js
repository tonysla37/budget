import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Chemins vers les certificats SSL
const certsPath = path.resolve(__dirname, '../certs')
const keyPath = path.join(certsPath, 'key.pem')
const certPath = path.join(certsPath, 'cert.pem')

// Vérifier si les certificats existent
const httpsEnabled = fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 19006,
    host: true,
    strictPort: true,  // Ne pas changer de port automatiquement si 19006 est occupé
    https: httpsEnabled ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    } : false,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
})
