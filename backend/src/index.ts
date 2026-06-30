import { Hono } from "hono"
import { cors } from "hono/cors"
import v1Routes from "./routes/v1"

const app = new Hono()

app.use(
	"*",
	cors({
		origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
		credentials: true,
	}),
)

app.route("/api/v1", v1Routes)

app.get("/", (c) => {
	return c.text("Hello Hono!")
})

export default app
