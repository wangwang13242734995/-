# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 OpenSSL 3.x 确保 Prisma 生成正确的引擎
RUN apk add --no-cache openssl

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production && npm ci

# 复制源码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 Next.js（standalone 模式）
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 运行阶段 ----
FROM node:20-alpine AS runner

WORKDIR /app

# 运行时也需要 OpenSSL 3.x 库
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

 # 复制 standalone 输出
 COPY --from=builder /app/public ./public

 # 自动处理的 standalone 文件
 COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
 COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

 # 复制 Prisma 相关文件（运行时需要）
 COPY --from=builder /app/prisma ./prisma
 COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
 COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

 # 复制数据库初始化脚本
 COPY --chown=nextjs:nodejs ./scripts ./scripts

 # SQLite 数据目录
 RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

 # Run as root so a Railway-mounted volume at /app/data is always writable
 # (a non-root uid can hit permission errors and silently fall back to ephemeral /tmp).
 USER root

 EXPOSE 3000
 ENV PORT=3000
 ENV HOSTNAME="0.0.0.0"
 # 默认 DATABASE_URL（Railway 环境变量会覆盖这个值）
 ENV DATABASE_URL="file:/app/data/growth.db"

 # 启动：自动检测可写目录，强制设置 DATABASE_URL
 CMD ["sh", "-c", "DB_DIR=/app/data; mkdir -p $DB_DIR 2>/dev/null || DB_DIR=/tmp; export DATABASE_URL=\"file:$DB_DIR/growth.db\"; echo \"Using $DATABASE_URL\"; node scripts/init-db.js || echo 'DB init warning'; node server.js"]
 
