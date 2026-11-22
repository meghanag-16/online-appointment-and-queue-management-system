import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * VITE_API_BASE_URL (build time) points the app at the API. Default "/api/v1" works when the API is
 * served from the same address (Vite proxy in development, nginx in Docker). On Render the site and
 * API have different addresses, so the build gets the API's host, e.g. "mediqueue-api.onrender.com".
 */
export default defineConfig({
  plugins: [react()],
  define: {
    __API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || '/api/v1'),
  },
  server: {
    proxy: {
      // Override with API_PROXY_TARGET if the backend runs elsewhere (e.g. http://localhost:8091)
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:8080',
        // The browser only talks to this dev server, so proxied calls are not cross-site. Drop the
        // Origin header so the API's CORS check doesn't reject the page when Vite picks another port
        // (5174 when 5173 is busy) or it is opened as 127.0.0.1 / a network address.
        configure: proxy => proxy.on('proxyReq', proxyReq => proxyReq.removeHeader('origin')),
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:8080',
        configure: proxy => proxy.on('proxyReq', proxyReq => proxyReq.removeHeader('origin')),
      },
    },
  },
})
