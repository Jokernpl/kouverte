module.exports = {
  apps: [
    {
      name: 'vox-server',
      script: 'vox-server.js',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'vox-tunnel',
      script: 'tunnel-vox.js',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'vox-bot',
      script: 'tg-bot.js',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
