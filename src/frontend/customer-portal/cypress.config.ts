import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4201',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        'db:seed': () => {
          // In a real application, this would reset and seed the database
          // For now, we'll just return a success to allow tests to run
          console.log('Database seeding task called (mock implementation)');
          return null;
        },
        'db:reset': () => {
          console.log('Database reset task called (mock implementation)');
          return null;
        }
      });
      return config;
    },
  },
});