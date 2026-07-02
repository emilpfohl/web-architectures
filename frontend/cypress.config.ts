import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.spec.{js,ts}',
    supportFile: 'cypress/support/commands.js',
    setupNodeEvents(on, config) {
      return config
    }
  },
  video: false,
  viewportWidth: 1280,
  viewportHeight: 800
})
