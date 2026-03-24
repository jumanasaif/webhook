FROM node:18-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    fontconfig \
    font-noto-emoji

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production || npm install --production

COPY . .

RUN mkdir -p output/cvs

RUN npm run db:generate || true

EXPOSE 3000

CMD ["npm", "run", "dev"]