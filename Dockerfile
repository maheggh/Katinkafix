FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install
RUN npm --prefix backend install
RUN npm --prefix frontend install

COPY . .
RUN npm --prefix frontend run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

EXPOSE 8080
CMD ["npm", "--prefix", "backend", "start"]
