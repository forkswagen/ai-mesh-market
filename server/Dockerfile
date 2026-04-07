# Один контейнер = Node-оркестратор (папка server/). Railway / Render / Fly: корень контекста = server/
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787
CMD ["node", "src/index.js"]
