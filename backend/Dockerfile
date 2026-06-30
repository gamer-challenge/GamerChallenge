FROM oven/bun:latest

WORKDIR /usr/src/app

# Copy lockfile and package first for better cache
COPY package.json bun.lock ./

# Install production dependencies without Git hook setup
RUN bun install --production --ignore-scripts

# Copy rest of the source
COPY . .

# Expose default port (adjust if your app uses a different one)
EXPOSE 3000

# Create missing database tables, then run the app
CMD ["bun", "run", "start"]
