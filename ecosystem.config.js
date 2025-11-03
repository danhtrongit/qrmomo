module.exports = {
  apps: [
    {
      name: 'momo-websocket-server',
      script: './server/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4105
      },
      error_file: './logs/websocket-error.log',
      out_file: './logs/websocket-out.log',
      log_file: './logs/websocket-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'momo-react-app',
      script: 'node_modules/.bin/react-scripts',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 4104,
        BROWSER: 'none',
        FAST_REFRESH: 'false'
      },
      error_file: './logs/react-error.log',
      out_file: './logs/react-out.log',
      log_file: './logs/react-combined.log',
      time: true,
      merge_logs: true
    }
  ]
};

