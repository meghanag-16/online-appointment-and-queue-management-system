import { defineConfig } from 'cypress'

/**
 * End-to-end tests run against a real, seeded stack (frontend + backend + MySQL).
 * CYPRESS_BASE_URL: where the site is (default http://localhost:5173, the Vite dev server;
 * CI uses http://localhost, the Docker Compose stack). Demo passwords come from env too.
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 20000,
    env: {
      adminPassword: process.env.CYPRESS_ADMIN_PASSWORD || 'Admin@123',
      staffPassword: process.env.CYPRESS_STAFF_PASSWORD || 'Welcome@123',
    },
  },
})
