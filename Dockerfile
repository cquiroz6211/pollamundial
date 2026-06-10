FROM node:20-alpine AS base

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}

# 1. Instalar dependencias solo cuando sea necesario
FROM base AS deps
# Se recomienda libc6-compat para imágenes alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# 2. Recompilar el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivar la telemetría de Next.js durante la compilación
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 3. Imagen de producción, copiar todos los archivos y ejecutar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Configurar permisos correctos para la caché de pre-renderizado
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar el build standalone y estáticos con sus respectivos dueños
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# El puerto también se puede configurar de forma dinámica
ENV HOSTNAME="0.0.0.0"

# server.js es creado por next build al compilar en modo standalone
CMD ["node", "server.js"]
