FROM node:12-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apk add --no-cache \
      chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json ./

RUN npm install

COPY . /usr/src/app

CMD ["node", "index.js"]
