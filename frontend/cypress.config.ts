import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.spec.{js,ts}',
    supportFile: 'cypress/support/commands.js',
    setupNodeEvents(on, config) {
      // add node event listeners here if needed
      return config
    }
  },
  video: false,
  viewportWidth: 1280,
  viewportHeight: 800
})
import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
