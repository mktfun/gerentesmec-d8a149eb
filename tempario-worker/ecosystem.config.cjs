module.exports = {
  apps: [
    {
      name: "tempario-worker",
      script: "./server.mjs",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3033
      }
    }
  ]
}
