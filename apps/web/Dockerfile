FROM node:22-slim

RUN corepack enable

WORKDIR /app

COPY package.json ./
RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
