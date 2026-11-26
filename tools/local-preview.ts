import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createInMemoryShiftStore } from '../src/server/core/store.ts';
import { createApiRouter } from '../src/server/routes/api.ts';

const DIST_CLIENT_DIR = resolve(process.cwd(), 'dist', 'client');
const DEFAULT_PORT = 4173;

const MIME_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.map': 'application/json; charset=utf-8',
};

const parseDateOverride = (
  requestUrl: string,
  refererHeader: string | undefined
): Date => {
  const candidates: string[] = [requestUrl];
  if (refererHeader) {
    candidates.push(refererHeader);
  }

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate, 'http://127.0.0.1');
      const dateParam = parsed.searchParams.get('date');
      if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam.trim())) {
        return new Date(`${dateParam.trim()}T03:15:00.000Z`);
      }
    } catch {
      // Ignore malformed Referer header and continue checking.
    }
  }

  return new Date();
};

const localStore = createInMemoryShiftStore();
let simulatedCommentSeq = 1;

const app = new Hono();

app.all('/api/*', async (c) => {
  const dateOverride = parseDateOverride(
    c.req.url,
    c.req.header('referer')
  );
  const apiRouter = createApiRouter({
    getNow: () => dateOverride,
    store: localStore,
    getSessionContext: async () => ({
      postId: 't3_local_preview',
      userId: 't2_local_analyst',
      username: 'local_analyst',
    }),
    submitUserComment: async (input) => {
      const id = `t1_local_${simulatedCommentSeq++}`;
      console.log(`[local-preview] Simulated Reddit comment (${id}) on ${input.postId}:\n${input.text}\n`);
      return {
        commentId: id,
        commentUrl: `https://www.reddit.com/r/night_shift_daily_dev/comments/local/${id}`,
      };
    },
  });

  const rewrittenUrl = new URL(c.req.url);
  rewrittenUrl.pathname = rewrittenUrl.pathname.replace(/^\/api/, '') || '/';
  const forwarded = new Request(rewrittenUrl.toString(), c.req.raw);
  return await apiRouter.fetch(forwarded);
});

app.get('*', async (c) => {
  const reqPath = new URL(c.req.url).pathname;
  const normalized = reqPath === '/' ? 'splash.html' : reqPath.replace(/^\/+/, '');
  const resolved = resolve(DIST_CLIENT_DIR, normalized);

  if (!resolved.startsWith(DIST_CLIENT_DIR)) {
    return c.text('Forbidden', 403);
  }

  try {
    const fileBuffer = await readFile(resolved);
    const contentType =
      MIME_TYPES[extname(resolved)] ?? 'application/octet-stream';
    return new Response(fileBuffer, {
      status: 200,
      headers: { 'Content-Type': contentType },
    });
  } catch {
    return c.text(`Not Found: ${normalized}`, 404);
  }
});

const port = Number(process.env['PORT'] ?? DEFAULT_PORT);

serve({
  fetch: app.fetch,
  hostname: '127.0.0.1',
  port,
});

console.log(`Night Shift Daily local preview running at http://127.0.0.1:${port}`);
console.log(`  Inline card (Case 1): http://127.0.0.1:${port}/splash.html?date=2026-11-25`);
console.log(`  Cases 1–9:            http://127.0.0.1:${port}/game.html?date=2026-11-25 .. 2026-12-03`);
