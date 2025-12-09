FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json ./
# Use npm install to avoid pnpm hoisting issues in simple container builds without lockfile
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app
COPY package.json ./
# Install production dependencies only
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

CMD ["npm", "start"]
