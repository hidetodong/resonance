import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { VercelRequest } from '@vercel/node';
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
  parseCookie,
  getSession,
  safeEqual,
  sessionCookie,
  clearCookie,
  sessionExp,
  nowSec,
  DUMMY_HASH,
} from './auth.ts';

const SECRET = 'test-secret-please-ignore-0123456789';

test('hashPassword/verifyPassword: 正确密码过、错误不过', () => {
  const stored = hashPassword('correct horse battery staple');
  assert.ok(stored.startsWith('scrypt$'));
  assert.equal(verifyPassword('correct horse battery staple', stored), true);
  assert.equal(verifyPassword('wrong password', stored), false);
});

test('hashPassword: 同一密码两次盐不同 → 哈希不同', () => {
  const a = hashPassword('same');
  const b = hashPassword('same');
  assert.notEqual(a, b);
  assert.equal(verifyPassword('same', a), true);
  assert.equal(verifyPassword('same', b), true);
});

test('verifyPassword: 损坏/异常格式一律 false', () => {
  assert.equal(verifyPassword('x', 'not-a-hash'), false);
  assert.equal(verifyPassword('x', 'scrypt$zz$zz'), false);
  assert.equal(verifyPassword('x', ''), false);
  assert.equal(verifyPassword('x', DUMMY_HASH), false);
});

test('signSession/verifySession: 合法令牌验过并还原 payload', () => {
  const payload = { uid: 'u1', email: 'me@example.com', exp: sessionExp() };
  const token = signSession(payload, SECRET);
  const got = verifySession(token, SECRET);
  assert.deepEqual(got, payload);
});

test('verifySession: 篡改 body 或签名 → null', () => {
  const token = signSession(
    { uid: 'u1', email: 'me@example.com', exp: sessionExp() },
    SECRET,
  );
  const [body, sig] = token.split('.');
  assert.equal(verifySession(`${body}x.${sig}`, SECRET), null); // 改 body
  assert.equal(verifySession(`${body}.${sig}x`, SECRET), null); // 改签名
  assert.equal(verifySession(token, 'other-secret'), null); // 换密钥
  assert.equal(verifySession('garbage', SECRET), null);
  assert.equal(verifySession('', SECRET), null);
});

test('verifySession: 过期令牌 → null', () => {
  const token = signSession(
    { uid: 'u1', email: 'me@example.com', exp: nowSec() - 10 },
    SECRET,
  );
  assert.equal(verifySession(token, SECRET), null);
});

test('parseCookie: 解析键值、容错空/无等号段', () => {
  assert.deepEqual(parseCookie('a=1; b=2'), { a: '1', b: '2' });
  assert.deepEqual(parseCookie(undefined), {});
  assert.deepEqual(parseCookie(''), {});
  assert.deepEqual(parseCookie('flag; k=v'), { k: 'v' });
});

test('getSession: 从 Cookie 头取出有效会话', () => {
  const token = signSession(
    { uid: 'u9', email: 'a@b.co', exp: sessionExp() },
    SECRET,
  );
  const req = { headers: { cookie: `rsn_session=${token}` } } as VercelRequest;
  const got = getSession(req, SECRET);
  assert.equal(got?.uid, 'u9');
  const noCookie = { headers: {} } as VercelRequest;
  assert.equal(getSession(noCookie, SECRET), null);
});

test('safeEqual: 等值 true、异值/异长 false', () => {
  assert.equal(safeEqual('invite-code', 'invite-code'), true);
  assert.equal(safeEqual('invite-code', 'invite-cody'), false);
  assert.equal(safeEqual('short', 'longer-value'), false);
});

test('sessionCookie: httpOnly + SameSite=Lax + Path + 有效期；secure 受控', () => {
  const c = sessionCookie('tok', true);
  assert.match(c, /^rsn_session=tok;/);
  assert.match(c, /HttpOnly/);
  assert.match(c, /SameSite=Lax/);
  assert.match(c, /Path=\//);
  assert.match(c, /Max-Age=2592000/); // 30 天
  assert.match(c, /Secure/);
  // 非 https：不带 Secure（便于本地 http 联调）
  assert.doesNotMatch(sessionCookie('tok', false), /Secure/);
});

test('clearCookie: Max-Age=0 即失效', () => {
  assert.match(clearCookie(true), /rsn_session=;/);
  assert.match(clearCookie(true), /Max-Age=0/);
});
