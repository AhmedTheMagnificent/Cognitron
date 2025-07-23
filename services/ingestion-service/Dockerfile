FROM node:20-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build 

FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
VOLUME /root/.cache/huggingface

EXPOSE 3004
CMD ["node", "dist/server.js"]