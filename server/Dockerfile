# Fallback, если Railpack не подходит: в Railway выбери builder DOCKERFILE или удали railway.toml.
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production

EXPOSE 8787
CMD ["npm", "start"]
