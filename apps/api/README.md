# Text Master API

Text Master API is the local MVP backend for the separated `apps/web` frontend. It uses Node.js HTTP, in-memory mock data, and response shapes compatible with `packages/shared`.

## Start

```bash
pnpm dev:api
```

Default URL:

```txt
http://127.0.0.1:4100
```

## Endpoints

- `GET /api/health`
- `GET /api/text-types`
- `GET /api/providers`
- `PATCH /api/providers/config`
- `POST /api/providers/:id/test`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `PATCH /api/projects/:id/stats`
- `GET /api/projects/:id/workflow`
- `POST /api/projects/:id/generate`
- `GET /api/generations/:taskId`
- `POST /api/projects/:id/export`
- `GET /api/projects/:id/exports/:format`

All JSON endpoints return:

```json
{
  "success": true,
  "data": {}
}
```

Errors return:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Readable error"
  }
}
```

## Current Scope

- Projects are persisted to `apps/api/data/projects.json` by default.
- Generation tasks are persisted to `apps/api/data/generations.json` by default.
- Export records are persisted to `apps/api/data/exports.json` by default.
- Generation is asynchronous: `POST /api/projects/:id/generate` returns a queued task, then `GET /api/generations/:taskId` can be polled until `succeeded` or `failed`.
- Any `queued` or `running` task found during API startup is marked `failed` because local JSON storage cannot resume an in-flight model call.
- The current provider is `mock-provider`; real model providers should be added behind `src/modules/providers`.
- Provider selection uses environment variables:
  - `TEXT_MASTER_PROVIDER=mock-provider|deepseek`
  - `DEEPSEEK_API_KEY=...`
  - `DEEPSEEK_BASE_URL=https://api.deepseek.com`
  - `DEEPSEEK_MODEL=deepseek-chat`
- Runtime provider settings are persisted to `apps/api/data/provider-config.json` by default. This directory is gitignored because it may contain API keys.
- Override local data file paths with:
  - `TEXT_MASTER_PROJECTS_PATH=/absolute/path/projects.json`
  - `TEXT_MASTER_GENERATIONS_PATH=/absolute/path/generations.json`
  - `TEXT_MASTER_EXPORTS_PATH=/absolute/path/exports.json`
  - `TEXT_MASTER_PROVIDER_CONFIG_PATH=/absolute/path/provider-config.json`
- Export returns Markdown, TXT, or JSON content.
- CORS is enabled for local frontend development.
