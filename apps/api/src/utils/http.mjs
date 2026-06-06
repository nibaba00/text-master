export function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function sendJson(response, statusCode, data, message) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(
    JSON.stringify(
      {
        success: true,
        data,
        ...(message ? { message } : {}),
      },
      null,
      2,
    ),
  );
}

export function sendError(response, statusCode, code, message, details) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(
    JSON.stringify(
      {
        success: false,
        error: {
          code,
          message,
          ...(details === undefined ? {} : { details }),
        },
      },
      null,
      2,
    ),
  );
}

export async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  const text = Buffer.concat(chunks).toString('utf8').trim();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON body: ${error instanceof Error ? error.message : String(error)}`);
  }
}
