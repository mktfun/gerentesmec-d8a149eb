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
    },
    {
      name: "tempario-renew",
      script: "./auto-renew.mjs",
      cron_restart: "0 7 * * *",  // Todo dia às 7h da manhã (horário do servidor)
      watch: false,
      autorestart: false,          // Não reinicia automaticamente (só pelo cron)
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
