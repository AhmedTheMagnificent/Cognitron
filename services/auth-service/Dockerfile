FROM node:18-alpine AS base
WORKDIR /use/src/app

FROM base AS dependencies
COPY package*.json ./
RUN npm install

FROM base AS production
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["node", "src/server.js"]