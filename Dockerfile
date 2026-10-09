# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

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

# 复制 Prisma 相关文件（运行时 push/migrate 需要）
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# SQLite 数据目录（挂载持久卷时使用）
RUN mkdir -p /data && chown nextjs:nodejs /data
VOLUME ["/data"]

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动：先同步数据库 schema，再启动 Next.js
CMD ["sh", "-c", "npx prisma db push --skip-generate 2>/dev/null; node server.js"]
