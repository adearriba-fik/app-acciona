# Base stage for dependencies
FROM node:21-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json yarn.lock* ./

RUN yarn install --frozen-lockfile

# Builder stage
FROM node:21-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY . .

ENV NODE_ENV=production
RUN yarn build

# Production stage
FROM node:21-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app .

EXPOSE 3000

CMD ["yarn", "docker-start"]