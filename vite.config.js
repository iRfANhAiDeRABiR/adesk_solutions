import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import submitHandler from './api/order/submit.js';
import verifyHandler from './api/order/verify.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      {
        name: 'dev-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:5001'}`);

            if (parsedUrl.pathname === '/api/order/submit') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  req.body = body ? JSON.parse(body) : {};
                } catch (e) {
                  req.body = {};
                }
                const mockRes = {
                  statusCode: 200,
                  headers: {},
                  status(code) { this.statusCode = code; res.statusCode = code; return this; },
                  setHeader(k, v) { this.headers[k] = v; res.setHeader(k, v); return this; },
                  json(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = this.statusCode || 200;
                    res.end(JSON.stringify(data));
                  }
                };
                try {
                  await submitHandler(req, mockRes);
                } catch (err) {
                  console.error('[Vite Dev API Error /api/order/submit]:', err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              });
              return;
            }

            if (parsedUrl.pathname === '/api/order/verify') {
              req.query = Object.fromEntries(parsedUrl.searchParams.entries());
              const mockRes = {
                statusCode: 200,
                headers: {},
                status(code) { this.statusCode = code; res.statusCode = code; return this; },
                setHeader(k, v) { this.headers[k] = v; res.setHeader(k, v); return this; },
                json(data) {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = this.statusCode || 200;
                  res.end(JSON.stringify(data));
                }
              };
              try {
                await verifyHandler(req, mockRes);
              } catch (err) {
                console.error('[Vite Dev API Error /api/order/verify]:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
              return;
            }

            next();
          });
        }
      }
    ],
    server: {
      port: 5001,
      open: false
    }
  };
});
