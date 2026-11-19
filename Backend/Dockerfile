# CineSeat API — optional local/Docker image (Render free tier should use Node runtime, not Docker)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 8000

CMD ["npm", "start"]
