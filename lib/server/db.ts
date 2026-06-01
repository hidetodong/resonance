import { neon } from '@neondatabase/serverless';
import { requireEnv } from './auth';
import type { AppData } from '../../src/domain/types';

/**
 * 数据访问层（Neon Postgres，HTTP 驱动）。
 * 表结构懒建（create table if not exists），用户「开通 DB + 配 env + 部署」即可，
 * 无需手跑 SQL。数据沿用整包 jsonb（app_data.data）。
 */

let _sql: ReturnType<typeof neon> | null = null;
function sql(): ReturnType<typeof neon> {
  if (!_sql) _sql = neon(requireEnv('DATABASE_URL'));
  return _sql;
}

let schemaReady = false;
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const q = sql();
  await q`create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    password_hash text not null,
    created_at timestamptz not null default now()
  )`;
  await q`create table if not exists app_data (
    user_id uuid primary key references users(id) on delete cascade,
    data jsonb not null default '{"version":1,"cards":[]}'::jsonb,
    updated_at timestamptz not null default now()
  )`;
  schemaReady = true;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = (await sql()`
    select id, email, password_hash from users where email = ${email}
  `) as UserRow[];
  return rows[0] ?? null;
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<UserRow> {
  const rows = (await sql()`
    insert into users (email, password_hash) values (${email}, ${passwordHash})
    returning id, email, password_hash
  `) as UserRow[];
  return rows[0];
}

const EMPTY: AppData = { version: 1, cards: [] };

export async function loadData(uid: string): Promise<AppData> {
  const rows = (await sql()`
    select data from app_data where user_id = ${uid}
  `) as { data: AppData }[];
  const data = rows[0]?.data;
  if (!data || !Array.isArray(data.cards)) return EMPTY;
  return { version: 1, cards: data.cards };
}

export async function saveData(uid: string, data: AppData): Promise<void> {
  await sql()`
    insert into app_data (user_id, data, updated_at)
    values (${uid}, ${JSON.stringify(data)}::jsonb, now())
    on conflict (user_id) do update set data = excluded.data, updated_at = now()
  `;
}
