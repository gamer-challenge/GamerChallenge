import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { Hono } from "hono"

const authState = {
	exchangeCodeForSession: mock(),
	getUser: mock(),
	signInWithOAuth: mock(),
	signOut: mock(),
}

const syncProfile = mock()
const where = mock()

const db = {
	select: mock(),
}

mock.module("../auth/supabase", () => ({
	createSupabaseServerClient: () => ({
		auth: authState,
	}),
}))

mock.module("../auth/profile", () => ({
	syncProfile,
}))

mock.module("../db/client", () => ({
	db,
}))

function createQueryBuilder(result: unknown[]) {
	return {
		from: () => ({
			where: () => ({
				limit: () => Promise.resolve(result),
			}),
		}),
	}
}

const { default: authRoutes } = await import("../routes/auth")

function createApp() {
	const app = new Hono()
	app.route("/", authRoutes)
	return app
}

describe("auth routes", () => {
	beforeEach(() => {
		Bun.env.AUTH_REDIRECT_ORIGIN = "http://api.test"
		Bun.env.FRONTEND_URL = "http://frontend.test"

		authState.exchangeCodeForSession.mockReset()
		authState.getUser.mockReset()
		authState.signInWithOAuth.mockReset()
		authState.signOut.mockReset()
		syncProfile.mockReset()
		where.mockReset()
		db.select.mockReset()
	})

	afterEach(() => {
		delete Bun.env.AUTH_REDIRECT_ORIGIN
		delete Bun.env.FRONTEND_URL
	})

	test("rejects unsupported OAuth providers", async () => {
		const response = await createApp().request("/sign-in?provider=github")

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({
			error: "Unsupported OAuth provider",
		})
		expect(authState.signInWithOAuth).not.toHaveBeenCalled()
	})

	test("redirects to the OAuth provider sign-in URL", async () => {
		authState.signInWithOAuth.mockResolvedValue({
			data: { url: "https://accounts.google.test/oauth" },
			error: null,
		})

		const response = await createApp().request(
			"/sign-in?provider=google&next=/dashboard",
		)

		expect(response.status).toBe(302)
		expect(response.headers.get("location")).toBe(
			"https://accounts.google.test/oauth",
		)
		expect(authState.signInWithOAuth).toHaveBeenCalledWith({
			provider: "google",
			options: {
				redirectTo: "http://api.test/api/v1/auth/callback?next=%2Fdashboard",
				queryParams: {
					access_type: "offline",
					prompt: "consent",
				},
			},
		})
	})

	test("redirects callback requests without code to the frontend", async () => {
		const response = await createApp().request("/callback?next=/profile")

		expect(response.status).toBe(303)
		expect(response.headers.get("location")).toBe(
			"http://frontend.test/profile",
		)
		expect(authState.exchangeCodeForSession).not.toHaveBeenCalled()
	})

	test("exchanges callback codes and syncs the profile", async () => {
		const user = {
			id: "user-1",
			email: "player@example.com",
			user_metadata: {},
		}
		authState.exchangeCodeForSession.mockResolvedValue({
			data: { user },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)

		const response = await createApp().request(
			"/callback?code=abc&next=/profile",
		)

		expect(response.status).toBe(303)
		expect(response.headers.get("location")).toBe(
			"http://frontend.test/profile",
		)
		expect(authState.exchangeCodeForSession).toHaveBeenCalledWith("abc")
		expect(syncProfile).toHaveBeenCalledWith(user)
	})

	test("returns 401 when /me has no authenticated user", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: null },
			error: null,
		})

		const response = await createApp().request("/me")

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ error: "Unauthorized" })
	})

	test("returns the current user profile", async () => {
		const profile = {
			avatarUrl: null,
			id: "user-1",
			karma: 0,
			points: 10,
			role: "user",
			username: "player",
		}
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		})
		db.select.mockReturnValue(createQueryBuilder([profile]))

		const response = await createApp().request("/me")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(profile)
	})

	test("rejects logout requests from disallowed origins", async () => {
		const response = await createApp().request("/logout", {
			headers: { Origin: "http://evil.test" },
			method: "POST",
		})

		expect(response.status).toBe(403)
		expect(await response.json()).toEqual({ error: "Invalid request origin" })
		expect(authState.signOut).not.toHaveBeenCalled()
	})

	test("signs out requests from allowed origins", async () => {
		authState.signOut.mockResolvedValue({ error: null })

		const response = await createApp().request("/logout", {
			headers: { Origin: "http://frontend.test" },
			method: "POST",
		})

		expect(response.status).toBe(204)
		expect(authState.signOut).toHaveBeenCalled()
	})
})
