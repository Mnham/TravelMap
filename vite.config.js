import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/TravelMap/',
  build: {
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/maplibre-gl')) {
            return 'maplibre'
          }
        },
      },
    },
  },
})
