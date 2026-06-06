import { createExportRecord, getExportContent, listExportRecords } from '../modules/exports/service.mjs';
import { createGenerationTask, getGenerationTask } from '../modules/generations/service.mjs';
import { listProviders, testProvider } from '../modules/providers/registry.mjs';
import { updateProviderConfig } from '../config/providerConfig.mjs';
import {
  createProject,
  getProject,
  getProjectWorkflow,
  listProjects,
  replaceProject,
  updateProject,
} from '../modules/projects/service.mjs';
import { listTextTypes } from '../modules/text-types/catalog.mjs';
import { readJsonBody, sendError, sendJson, setCorsHeaders } from '../utils/http.mjs';

export async function handleRequest(request, response) {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1:4100'}`);
  const pathname = normalizePath(url.pathname);

  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204).end();
    return;
  }

  logRequest(request.method, pathname);

  if (request.method === 'GET' && pathname === '/api/health') {
    sendJson(response, 200, {
      service: 'text-master-api',
      mode: 'mvp',
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (request.method === 'GET' && pathname === '/api/text-types') {
    sendJson(response, 200, listTextTypes());
    return;
  }

  if (request.method === 'GET' && pathname === '/api/providers') {
    sendJson(response, 200, listProviders());
    return;
  }

  if (request.method === 'PATCH' && pathname === '/api/providers/config') {
    const body = await readJsonBody(request);
    updateProviderConfig(body);
    sendJson(response, 200, listProviders());
    return;
  }

  const providerTestRoute = pathname.match(/^\/api\/providers\/([^/]+)\/test$/);
  if (request.method === 'POST' && providerTestRoute) {
    sendJson(response, 200, await testProvider(decodeURIComponent(providerTestRoute[1])));
    return;
  }

  if (request.method === 'GET' && pathname === '/api/projects') {
    sendJson(response, 200, listProjects());
    return;
  }

  if (request.method === 'POST' && pathname === '/api/projects') {
    const body = await readJsonBody(request);
    const project = createProject(body);
    sendJson(response, 201, project);
    return;
  }

  const projectRoute = matchProjectRoute(pathname);
  if (projectRoute) {
    await handleProjectRoute(request, response, projectRoute);
    return;
  }

  const generationRoute = pathname.match(/^\/api\/generations\/([^/]+)$/);
  if (request.method === 'GET' && generationRoute) {
    const taskId = decodeURIComponent(generationRoute[1]);
    const task = getGenerationTask(taskId);

    if (!task) {
      sendError(response, 404, 'GENERATION_NOT_FOUND', 'Generation task not found', { taskId });
      return;
    }

    sendJson(response, 200, task);
    return;
  }

  sendError(response, 404, 'NOT_FOUND', 'Not Found', { path: pathname });
}

async function handleProjectRoute(request, response, route) {
  const project = getProject(route.projectId);

  if (!project) {
    sendError(response, 404, 'PROJECT_NOT_FOUND', 'Project not found', { projectId: route.projectId });
    return;
  }

  if (request.method === 'GET' && route.action === '') {
    sendJson(response, 200, project);
    return;
  }

  if (request.method === 'PATCH' && route.action === '') {
    const body = await readJsonBody(request);
    sendJson(response, 200, updateProject(project, body));
    return;
  }

  if (request.method === 'PATCH' && route.action === 'stats') {
    const body = await readJsonBody(request);
    sendJson(
      response,
      200,
      updateProject(project, {
        wordCount: body?.wordCount,
        progress: body?.progress,
      }),
    );
    return;
  }

  if (request.method === 'GET' && route.action === 'workflow') {
    sendJson(response, 200, getProjectWorkflow(project));
    return;
  }

  if (request.method === 'POST' && route.action === 'generate') {
    const body = await readJsonBody(request);
    const task = createGenerationTask(project, body);
    const nextProject = updateProject(project, {
      status: project.status === 'draft' ? 'in_progress' : project.status,
      progress: Math.max(project.progress, 8),
    });
    replaceProject(nextProject);
    sendJson(response, 202, task);
    return;
  }

  if (request.method === 'POST' && route.action === 'review') {
    const body = await readJsonBody(request);
    const task = createGenerationTask(project, {
      documentId: typeof body?.documentId === 'string' ? body.documentId : undefined,
      prompt:
        typeof body?.text === 'string' && body.text.trim()
          ? `请审核以下文本并输出结论、问题与建议：\n\n${body.text.trim()}`
          : '请对当前项目进行审核并输出结论、问题与建议。',
      context: `项目类型：${project.type}\n项目标题：${project.title}`,
    });
    const nextProject = updateProject(project, {
      status: 'reviewing',
      progress: Math.max(project.progress, 48),
    });
    replaceProject(nextProject);
    sendJson(response, 202, task);
    return;
  }

  if (request.method === 'POST' && route.action === 'rewrite') {
    const body = await readJsonBody(request);
    const task = createGenerationTask(project, {
      documentId: typeof body?.documentId === 'string' ? body.documentId : undefined,
      prompt:
        typeof body?.text === 'string' && body.text.trim()
          ? `请根据要求改写以下文本，并尽量保留原意：\n\n${body.text.trim()}`
          : '请改写当前文本。',
      context:
        typeof body?.instruction === 'string' && body.instruction.trim()
          ? `改写要求：${body.instruction.trim()}`
          : `项目类型：${project.type}\n项目标题：${project.title}`,
    });
    const nextProject = updateProject(project, {
      status: project.status === 'draft' ? 'in_progress' : project.status,
      progress: Math.max(project.progress, 32),
    });
    replaceProject(nextProject);
    sendJson(response, 202, task);
    return;
  }

  if (request.method === 'POST' && route.action === 'export') {
    const body = await readJsonBody(request);
    sendJson(response, 201, createExportRecord(project, body));
    return;
  }

  if (request.method === 'GET' && route.action === 'exports' && !route.extra) {
    sendJson(response, 200, listExportRecords(project.id));
    return;
  }

  if (request.method === 'GET' && route.action === 'exports' && route.extra) {
    const result = getExportContent(project, route.extra);
    response.statusCode = 200;
    response.setHeader('Content-Type', result.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
    response.end(result.content);
    return;
  }

  sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed', {
    method: request.method,
    action: route.action,
  });
}

function matchProjectRoute(pathname) {
  const match = pathname.match(/^\/api\/projects\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);

  if (!match) {
    return null;
  }

  return {
    projectId: decodeURIComponent(match[1]),
    action: match[2] ? decodeURIComponent(match[2]) : '',
    extra: match[3] ? decodeURIComponent(match[3]) : '',
  };
}

function normalizePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

function logRequest(method, pathname) {
  console.log(`[api] ${method} ${pathname}`);
}
