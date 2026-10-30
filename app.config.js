// Extends app.json. EXPO_BASE_URL lets the web build live under a sub-path,
// e.g. EXPO_BASE_URL=/en-obra for https://coystan.github.io/en-obra/.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
