import type { VercelRequest, VercelResponse } from '@vercel/node';

/** 读取并解析 JSON 请求体（@vercel/node 在 application/json 下已自动解析）。 */
export function readBody<T>(req: VercelRequest): T {
  const b = req.body;
  if (b && typeof b === 'object') return b as T;
  if (typeof b === 'string' && b.length > 0) {
    try {
      return JSON.parse(b) as T;
    } catch {
      /* 落到下方空对象 */
    }
  }
  return {} as T;
}

/** 是否走 https：Vercel 恒 https；本地 vercel dev 走 http（便于 Cookie 不带 Secure）。 */
export function isSecure(req: VercelRequest): boolean {
  if (process.env.VERCEL) return true;
  const proto = req.headers['x-forwarded-proto'];
  return typeof proto === 'string' && proto.includes('https');
}

export function send(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}
