import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

/**
 * 本地 JSON 持久化插件：把应用数据读写到项目根 data/cards.json。
 * 仅在 dev 模式（vite dev server）生效，复用用户本就要跑的 dev 进程，
 * 不引入独立后端 / 账号。数据为人类可读的本地文件，可移植、可自行版本化。
 *
 * 契约：
 *   GET /api/cards → 200 AppData（文件缺失时返回空数据）
 *   PUT /api/cards （body: AppData）→ 写文件，返回 { ok: true }
 */
const DATA_FILE = 'data/cards.json';
const EMPTY = JSON.stringify({ version: 1, cards: [] }, null, 2);

export function localJsonStore(): Plugin {
  const filePath = path.resolve(process.cwd(), DATA_FILE);

  async function readData(): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return EMPTY;
    }
  }

  async function writeData(raw: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, raw, 'utf-8');
  }

  return {
    name: 'resonance:local-json-store',
    configureServer(server: ViteDevServer) {
      // dev 免认证：探测端点回 authDisabled，让前端跳过登录页（生产由 Vercel 函数应答）。
      server.middlewares.use('/api/auth/me', (_req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ authDisabled: true }));
      });

      server.middlewares.use('/api/cards', (req, res) => {
        const json = (code: number, body: string) => {
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(body);
        };

        if (req.method === 'GET') {
          readData()
            .then((data) => json(200, data))
            .catch((e) => json(500, JSON.stringify({ ok: false, error: String(e) })));
          return;
        }

        if (req.method === 'PUT') {
          const chunks: Buffer[] = [];
          req.on('data', (c: Buffer) => chunks.push(c));
          req.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            let parsed: unknown;
            try {
              parsed = JSON.parse(body);
            } catch {
              json(400, JSON.stringify({ ok: false, error: 'invalid json' }));
              return;
            }
            writeData(JSON.stringify(parsed, null, 2))
              .then(() => json(200, JSON.stringify({ ok: true })))
              .catch((e) => json(500, JSON.stringify({ ok: false, error: String(e) })));
          });
          return;
        }

        json(405, JSON.stringify({ ok: false, error: 'method not allowed' }));
      });
    },
  };
}
