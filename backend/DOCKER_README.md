# Backend Docker (bun + Hono)

Build the image from the repository root:

```bash
docker build -t gamer-backend:latest ./backend
```

Run the container (maps container port 3000 to host 3000):

```bash
docker run --env DATABASE_URL="postgresql://..." -p 3000:3000 gamer-backend:latest
```

At startup, the container runs `bun run init-db` before starting Hono. The init script creates missing PostgreSQL tables and indexes, but does not create Supabase `auth.users`.

If your app listens on a different port, change the `EXPOSE` line in the `Dockerfile` and the `-p` mapping above.
