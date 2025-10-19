FROM node:18-alpine as builder

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json

RUN apk add --no-cache openssl openssl-dev
RUN npm install

COPY src src

RUN npm run build

CMD ["npm", "start"]
