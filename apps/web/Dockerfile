# Built with the monorepo root as context (see docker-compose.yml) so pnpm
# can resolve the "@ecobalance/contracts": "workspace:*" dependency.
FROM node:22-slim

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web

RUN pnpm install --filter @ecobalance/web...

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "dev"]
