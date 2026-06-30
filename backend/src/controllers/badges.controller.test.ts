import { beforeEach, describe, expect, mock, test } from "bun:test"
import { Hono } from "hono"

const authState = {
	getUser: mock(),
}
const syncProfile = mock()

const db = {
	insert: mock(),
	select: mock(),
}

const awardBadge = mock()

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

mock.module("../services/badges.service", () => ({
	BADGE_NAMES: {
		FIRST_PARTICIPATION: "Premier defi",
		TOP_LEADERBOARD: "Top du classement",
	},
	awardBadge,
	checkAndAwardFirstParticipation: mock(),
	checkAndAwardTopLeaderboard: mock(),
}))

function createSelectBuilder(result: unknown[]) {
	const builder = {
		from: mock(() => builder),
		limit: mock(() => Promise.resolve(result)),
		where: mock(() => builder),
	}

	return builder
}

function createInsertBuilder(result: unknown[]) {
	const returning = mock(() => Promise.resolve(result))
	const values = mock(() => ({ returning }))

	return { returning, values }
}

const { default: badgesRoutes } = await import("../routes/badges")
const { default: usersRoutes } = await import("../routes/users")

function createApp() {
	const app = new Hono()
	app.route("/badges", badgesRoutes)
	app.route("/users", usersRoutes)
	return app
}

describe("badges routes", () => {
	beforeEach(() => {
		authState.getUser.mockReset()
		syncProfile.mockReset()
		db.insert.mockReset()
		db.select.mockReset()
		awardBadge.mockReset()

		syncProfile.mockResolvedValue(undefined)
		awardBadge.mockResolvedValue(undefined)
	})

	// ── GET /badges ─────────────────────────────────────────────────────────

	describe("GET /badges", () => {
		test("returns all badges without authentication", async () => {
			const allBadges = [
				{
					description: "A soumis sa premiere participation.",
					id: 1,
					iconUrl: null,
					name: "Premier defi",
				},
				{
					description: "A atteint la premiere place du classement general.",
					id: 2,
					iconUrl: null,
					name: "Top du classement",
				},
			]
			const builder = {
				from: mock(() => Promise.resolve(allBadges)),
			}
			db.select.mockReturnValue(builder)

			const res = await createApp().request("/badges")

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual(allBadges)
			expect(authState.getUser).not.toHaveBeenCalled()
		})
	})

	// ── POST /badges ─────────────────────────────────────────────────────────

	describe("POST /badges", () => {
		test("returns 401 when not authenticated", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: null },
				error: null,
			})

			const res = await createApp().request("/badges", {
				body: JSON.stringify({ name: "Test", description: "Test badge" }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(401)
			expect(db.insert).not.toHaveBeenCalled()
		})

		test("returns 403 when user is not admin", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "user-1", user_metadata: {} } },
				error: null,
			})
			db.select.mockReturnValue(createSelectBuilder([{ role: "user" }]))

			const res = await createApp().request("/badges", {
				body: JSON.stringify({ name: "Test", description: "Test badge" }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(403)
			expect(db.insert).not.toHaveBeenCalled()
		})

		test("returns 400 when name or description is missing", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select.mockReturnValue(createSelectBuilder([{ role: "admin" }]))

			const res = await createApp().request("/badges", {
				body: JSON.stringify({ name: "Test" }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({
				error: "name and description are required",
			})
			expect(db.insert).not.toHaveBeenCalled()
		})

		test("creates a badge and returns 201", async () => {
			const badge = {
				description: "Nouveau badge",
				id: 5,
				iconUrl: null,
				name: "Nouveau",
			}
			const insertBuilder = createInsertBuilder([badge])

			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select.mockReturnValue(createSelectBuilder([{ role: "admin" }]))
			db.insert.mockReturnValue(insertBuilder)

			const res = await createApp().request("/badges", {
				body: JSON.stringify({
					description: "Nouveau badge",
					name: "Nouveau",
				}),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(201)
			expect(await res.json()).toEqual(badge)
			expect(insertBuilder.values).toHaveBeenCalledWith(
				expect.objectContaining({
					description: "Nouveau badge",
					name: "Nouveau",
				}),
			)
		})
	})

	// ── POST /users/:id/badges ───────────────────────────────────────────────

	describe("POST /users/:id/badges", () => {
		test("returns 401 when not authenticated", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: null },
				error: null,
			})

			const res = await createApp().request("/users/user-2/badges", {
				body: JSON.stringify({ badgeName: "Premier defi" }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(401)
			expect(awardBadge).not.toHaveBeenCalled()
		})

		test("returns 403 when user is not admin", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "user-1", user_metadata: {} } },
				error: null,
			})
			db.select.mockReturnValue(createSelectBuilder([{ role: "user" }]))

			const res = await createApp().request("/users/user-2/badges", {
				body: JSON.stringify({ badgeName: "Premier defi" }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(403)
			expect(awardBadge).not.toHaveBeenCalled()
		})

		test("returns 400 when badgeName is missing", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select
				.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
				.mockReturnValueOnce(createSelectBuilder([{ id: "user-2" }]))

			const res = await createApp().request("/users/user-2/badges", {
				body: JSON.stringify({}),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({ error: "badgeName is required" })
			expect(awardBadge).not.toHaveBeenCalled()
		})

		test("returns 404 when the target profile does not exist", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select
				.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
				.mockReturnValueOnce(createSelectBuilder([]))

			const res = await createApp().request("/users/unknown-user/badges", {
				body: JSON.stringify({ badgeName: "Premier defi" }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(404)
			expect(await res.json()).toEqual({ error: "Profile not found" })
			expect(awardBadge).not.toHaveBeenCalled()
		})

		test("awards a badge to a user and returns 200", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select
				.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
				.mockReturnValueOnce(createSelectBuilder([{ id: "user-2" }]))

			const res = await createApp().request("/users/user-2/badges", {
				body: JSON.stringify({ badgeName: "Premier defi" }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ message: "Badge awarded" })
			expect(awardBadge).toHaveBeenCalledWith(
				"user-2",
				"Premier defi",
				undefined,
			)
		})

		test("awards a challenge-specific badge when challengeId is provided", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select
				.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
				.mockReturnValueOnce(createSelectBuilder([{ id: "user-2" }]))

			const res = await createApp().request("/users/user-2/badges", {
				body: JSON.stringify({ badgeName: "Clutch Master", challengeId: 3 }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(200)
			expect(awardBadge).toHaveBeenCalledWith("user-2", "Clutch Master", 3)
		})
	})
})
