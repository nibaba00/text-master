import { createServer } from 'node:http';
import { handleRequest } from './routes/index.mjs';
import { sendError, setCorsHeaders } from './utils/http.mjs';

const port = Number(process.env.PORT ?? 4100);
const host = process.env.HOST ?? '127.0.0.1';

const server = createServer((request, response) => {
  void handleRequest(request, response).catch((error) => {
    console.error('[api] request failed', error);
    setCorsHeaders(response);
    sendError(response, 500, 'INTERNAL_ERROR', 'Internal Server Error', {
      message: error instanceof Error ? error.message : String(error),
    });
  });
});

server.listen(port, host, () => {
  console.log(`[api] Text Master API listening on http://${host}:${port}`);
});
