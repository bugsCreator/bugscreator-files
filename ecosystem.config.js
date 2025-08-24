module.exports = {
  apps: [
    {
      name: 'bugscreator-files',
      script: './dist/server.js',
      cwd: __dirname,
      instances: 1, // set to 'max' for all CPU cores
      exec_mode: 'fork', // use 'cluster' for multi-core
      watch: false,
      env_file: '.env',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      // Logs
      time: true,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: false
    }
  ]
};
