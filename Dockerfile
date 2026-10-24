FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_STORE_URL
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
RUN mkdir -p /app/public/uploads/products && chown -R node:node /app/public/uploads /app/.next
USER node
EXPOSE 3000
CMD ["npm","start"]
