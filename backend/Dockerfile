FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# SERVICE_ENTRY selects which microservice entry point to run.
# Accepted values: index | auth-service | user-service | store-service | ai-service
ARG SERVICE_ENTRY=index
ENV SERVICE_ENTRY=${SERVICE_ENTRY}

EXPOSE 8080

CMD bun run src/${SERVICE_ENTRY}.ts
