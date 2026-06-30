import { Hono } from "hono"
import { cors } from "hono/cors"
import { isAllowedFrontendOrigin } from "./config/frontend-origins"
import v1Routes from "./routes/v1"

const app = new Hono()

app.use(
	"*",
	cors({
		origin: (origin) => (isAllowedFrontendOrigin(origin) ? origin : null),
		credentials: true,
	}),
)

app.route("/api/v1", v1Routes)

app.get("/", (c) => {
	return c.text("Hello Hono!")
})

export default app
