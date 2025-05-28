module.exports = {
  apps: [
    {
      name: "nextjs",
      script: "node_modules/.bin/next",
      args: "start",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
      watch: false,
      instances: 1,
      autorestart: true,
    },
    {
      name: "python-api",
      script: "python3",
      args: "python-api/ui_integration.py",
      env: {
        PYTHONUNBUFFERED: 1,
        PORT: 5000,
      },
      watch: false,
      instances: 1,
      autorestart: true,
    },
  ],
}
