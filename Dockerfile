FROM node:20-slim AS web-build
WORKDIR /app
COPY package.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json
RUN npm install
COPY web ./web
RUN npm run build --workspace=web

FROM node:20-slim AS server-build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json
RUN npm install
COPY server ./server
RUN npm run build --workspace=server

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package.json ./server/package.json
COPY --from=web-build /app/web/dist ./web/dist
EXPOSE 3000
CMD ["node", "server/dist/index.js"]
