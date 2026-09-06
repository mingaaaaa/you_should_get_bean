# 前端代码验证约定

- **不要使用 `pnpm build`（next build）进行代码验证**，耗时长且没必要。验证代码请用：
  - `pnpm lint`：ESLint 检查
  - `npx tsc --noEmit`：TypeScript 类型检查
- 本地调试运行 `pnpm dev`。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
