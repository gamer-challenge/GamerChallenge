FROM oven/bun:latest

WORKDIR /usr/src/app

# Copy dependency manifests first for better cache
COPY package.json bun.lock* package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies with bun (install devDependencies for dev image)
RUN bun install

# Copy the rest of the source
COPY . .

EXPOSE 5173

# Start Vite dev server (bind to 0.0.0.0 for container access)
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]
