<div align="center">

# Resonance · 睿所纳思

**把同一个问题在时间线上的每一次反思，汇聚成一段回响。**

一个面向个人日常自我提问与反思的轻量卡片工具 · 前后端一体 · 一键部署到 Vercel · 私有访问 + 云端跨设备同步

</div>

<p align="center">
  <img src="docs/screenshot.png" alt="Resonance 界面预览" width="900">
</p>

---

## 这是什么

我们每天都会冒出一些**尚未解决的问题**——「怎样让阅读真正留下东西」「为什么一到晚上就开始焦虑」。它们值得被持续追问，而不是想一次就忘掉。

Resonance 把每个这样的问题做成一张**卡片**，卡片里沉淀你对它**跨越多天的反思**。当你回看一张卡，会看到同一个问题在时间线上一次次被打磨的轨迹——这就是 *resonance*（回响）。

它刻意保持轻量，承载 [`Reflect.md`](./Reflect.md) 里的一个核心理念：

> **每条反思 = 一段想法 + 一个「明天就能开始」的简单行动。**
> 反思不是空想；它要落到一个明天可执行、且能持续下去的小动作上。

## 核心概念

| 概念 | 含义 |
|---|---|
| **卡片（Card）** | 一个对你尚未解决的问题 |
| **反思条目（Reflection）** | 某一天对该问题的一次回顾 = 想法（必填）+ 明天的简单行动（选填） |
| **每日回顾** | 每天对还没「阶段性解决」的卡片回顾一次；每卡每天至多一条 |
| **时间线** | 一张卡内的历次反思按时间汇聚，可整条通读 |

## 特性

- 🗂️ **问题即卡片**，按「今日待回顾 / 今日已反思 / 阶段性解决」自动分组
- 🧵 **跨时间线**：今天的反思与历史条目融合在同一条时间线里
- ✏️ **当天可改、历史只读**：当日条目可反复编辑（防手误），过了今天即锁定，且任何反思永不可删
- 🎯 **简单行动**：每条反思都鼓励落到一个明天可执行的小动作
- 📱 **手机友好**：宽屏两栏，窄屏自动切换为栈式 master-detail
- 🔒 **私有访问**：线上邮箱+密码登录（自建认证，`scrypt` 哈希 + 签名 Cookie），**邀请码锁注册**，只有你能进
- ☁️ **跨设备同步**：数据存云端 Postgres，手机/电脑登录同一账号看到同一份
- 🧩 **前后端一体**：前端 + `/api` Serverless 函数同一仓库，一次 `git push` 由 Vercel 同时部署，无需任何外部后端项目
- 💻 **本地开发零摩擦**：`pnpm dev` 走本地 JSON 文件、免登录，改代码即见效

## 快速开始

```bash
pnpm install
pnpm dev
```

打开终端给出的本地地址（默认 http://localhost:5173 ）即可使用：

- 右下角 **➕** 新建一个问题
- 点开一张卡 → 写「今天的反思」（想法必填，明天的行动选填）
- 下方按时间线回看这张卡的全部历史反思
- 卡片可标记 **阶段性解决** / 恢复，也可整张删除

## 数据与存储

存储层抽象为可插拔的 `StorageAdapter`（`src/services/storage.ts`），前端统一用 `HttpAdapter` 读写 `/api/cards`（GET/PUT）。同一线协议在不同环境由不同后端应答：

| 运行方式 | `/api/*` 由谁应答 | 数据落点 | 认证 |
|---|---|---|---|
| `pnpm dev` | Vite dev 中间件（`plugins/localJsonStore.ts`） | 本地 `data/cards.json`（人类可读、可自行版本化） | 免登录 |
| `vercel dev` / 线上 Vercel | `/api` Serverless 函数 | 云端 Postgres（Neon），单行 `app_data.data`（jsonb） | 邮箱+密码登录 |

> ⚠️ 本地文件与云端数据各自独立、不互通。前端无需任何环境变量；后端密钥都在服务端。
>
> 你的本地 `data/cards.json` 与 `.env.local` 都不会进入本仓库（已在 `.gitignore` 中排除）。

## 登录与访问控制（自建 · 无外部后端）

线上版要求登录才能访问，**别人打开只看到登录页**；注册由**邀请码**把守，没有邀请码无法注册。

- **密码**：`scrypt` + 随机盐哈希，绝不明文；校验走 `timingSafeEqual`。
- **会话**：HMAC-SHA256 签名令牌，承载于 `HttpOnly` + `SameSite=Lax`（线上 `Secure`）Cookie，前端 JS 取不到、篡改即失效。
- **越权隔离**：用户身份只从已验证会话 Cookie 派生，查询恒按 `user_id` 行隔离；无有效会话一律 401。
- **密钥不入前端**：`DATABASE_URL` / `SESSION_SECRET` / `REGISTER_SECRET` 均为服务端变量（无 `VITE_` 前缀），不打进前端产物。

认证核心为纯函数（`lib/server/auth.ts`），带单测：`pnpm test:server`。

## 部署（Vercel · 前后端一体）

整个项目（前端 + `/api` 函数）一个仓库、一次部署。表结构由函数在首次调用时 `create table if not exists` 自动建好，**无需手跑 SQL**。

**1. 开通数据库**：Vercel 项目 → **Storage** → 从 Marketplace 添加 **Neon（Postgres）**，它会自动注入 `DATABASE_URL`。

**2. 配置环境变量**（Vercel → Settings → Environment Variables）：

| 变量 | 值 |
|---|---|
| `DATABASE_URL` | 开通 Neon 后通常已自动注入；没有则填 Neon 连接串 |
| `SESSION_SECRET` | 随机长字符串，如 `openssl rand -base64 32` |
| `REGISTER_SECRET` | 你自定的注册邀请码 |

**3. 部署**：导入仓库，Vercel 自动识别 Vite（前端 → `dist`）并把 `/api/*` 编译为函数，点 Deploy。

**4. 创建你的账号**：打开线上地址 → 登录页点「首次创建账号（需邀请码）」→ 填邮箱、密码（≥8 位）、`REGISTER_SECRET` → 创建即自动登录。之后别人没有邀请码无法注册。

> 本地全栈联调：复制 `.env.example` 为 `.env.local` 填入三个变量，跑 `vercel dev`（前端 + 函数 + Neon 一起跑）。纯前端预览仍可 `pnpm dev`（文件、免登录）。

## 技术栈

Vue 3（`<script setup lang="ts">`）+ Vite + TypeScript 前端；Vercel Node Serverless 函数 + Neon Postgres 后端。零 UI 依赖，纯 scoped CSS；认证零第三方库（`node:crypto`）。

```
src/                       前端
├─ domain/                 领域模型与纯函数（无框架、无 IO）
│  ├─ types.ts                Card / ReflectionEntry / AppData 核心契约
│  └─ card.ts                 建卡、当日 upsert、分组、状态流转…
├─ lib/date.ts             本地自然日与展示格式化
├─ services/               存储抽象：storage.ts（接口 + 工厂）+ adapters/httpAdapter.ts
├─ composables/            useCards.ts（唯一响应式数据源）/ useAuth.ts（认证态单例）
└─ components/             展示组件 + LoginView（登录/邀请码注册）

api/                       Vercel Serverless 函数（后端）
├─ cards.ts                  认证后读写当前用户数据
└─ auth/{me,login,register,logout}.ts

lib/server/                服务端共享库（在 /api 外，不会被当作路由）
├─ auth.ts                   scrypt 哈希 / HMAC 签名 Cookie / 会话校验（纯函数，含单测）
├─ db.ts                     Neon 连接 + 懒建表 + 数据读写
└─ http.ts                   请求体/Cookie/响应 glue

plugins/localJsonStore.ts   dev 中间件：本地 JSON 持久化 + /api/auth/me 免认证桩
```

## 脚本

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 本地开发（文件持久化、免登录） |
| `vercel dev` | 本地全栈联调（前端 + 函数 + Neon，需 `.env.local`） |
| `pnpm type-check` | 类型检查（前端 vue-tsc + 后端 tsc） |
| `pnpm test:server` | 认证核心单测（node:test） |
| `pnpm build` | 类型检查 + 构建 |

---

<div align="center">
<sub>一个写给自己的小工具 · 同一个问题，值得在时间里反复回响。</sub>
</div>
