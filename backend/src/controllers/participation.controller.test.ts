import { beforeEach, describe, expect, mock, test } from "bun:test"
import { Hono } from "hono"

const authState = {
	getUser: mock(),
}
const syncProfile = mock()

const db = {
	insert: mock(),
	select: mock(),
	transaction: mock(),
	update: mock(),
}

const checkAndAwardFirstParticipation = mock()
const checkAndAwardTopLeaderboard = mock()

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
	awardBadge: mock(),
	checkAndAwardFirstParticipation,
	checkAndAwardTopLeaderboard,
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

function createUpdateBuilder(result: unknown[]) {
	const returning = mock(() => Promise.resolve(result))
	const where = mock(() => ({ returning }))
	const set = mock(() => ({ where }))

	return { returning, set, where }
}

function createUpdateNoReturnBuilder() {
	const where = mock(() => Promise.resolve())
	const set = mock(() => ({ where }))

	return { set, where }
}

const { default: participationRoutes } = await import("../routes/participation")

function createApp() {
	const app = new Hono()
	app.route("/participations", participationRoutes)
	return app
}

describe("participation routes", () => {
	beforeEach(() => {
		authState.getUser.mockReset()
		syncProfile.mockReset()
		db.insert.mockReset()
		db.select.mockReset()
		db.transaction.mockReset()
		db.update.mockReset()
		checkAndAwardFirstParticipation.mockReset()
		checkAndAwardTopLeaderboard.mockReset()

		checkAndAwardFirstParticipation.mockResolvedValue(undefined)
		checkAndAwardTopLeaderboard.mockResolvedValue(undefined)
		syncProfile.mockResolvedValue(undefined)
	})

	// ── POST / ─────────────────────────────────────────────────────────────

	describe("POST /participations", () => {
		test("returns 401 when not authenticated", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: null },
				error: null,
			})

			const res = await createApp().request("/participations", {
				body: JSON.stringify({
					challengeId: 1,
					videoUrl: "https://yt.com/v=1",
				}),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(401)
			expect(await res.json()).toEqual({ error: "Unauthorized" })
			expect(db.insert).not.toHaveBeenCalled()
		})

		test("returns 400 when challengeId is missing", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "user-1", user_metadata: {} } },
				error: null,
			})

			const res = await createApp().request("/participations", {
				body: JSON.stringify({ videoUrl: "https://yt.com/v=1" }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({ error: "Invalid challengeId" })
			expect(db.insert).not.toHaveBeenCalled()
		})

		test("returns 400 when videoUrl is missing", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "user-1", user_metadata: {} } },
				error: null,
			})

			const res = await createApp().request("/participations", {
				body: JSON.stringify({ challengeId: 1 }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({ error: "videoUrl is required" })
			expect(db.insert).not.toHaveBeenCalled()
		})

		test("returns 404 when challenge does not exist or is not active", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "user-1", user_metadata: {} } },
				error: null,
			})
			db.select.mockReturnValue(createSelectBuilder([]))

			const res = await createApp().request("/participations", {
				body: JSON.stringify({
					challengeId: 999,
					videoUrl: "https://yt.com/v=1",
				}),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(404)
			expect(await res.json()).toEqual({
				error: "Challenge not found or not active",
			})
			expect(db.insert).not.toHaveBeenCalled()
		})

		test("creates a participation and returns 201", async () => {
			const user = { id: "user-1", user_metadata: {} }
			const participation = {
				challengeId: 1,
				description: "My run",
				id: 10,
				profileId: "user-1",
				screenshotUrl: null,
				status: "pending",
				videoUrl: "https://yt.com/v=1",
			}
			const insertBuilder = createInsertBuilder([participation])

			authState.getUser.mockResolvedValue({ data: { user }, error: null })
			db.select.mockReturnValue(createSelectBuilder([{ id: 1 }]))
			db.insert.mockReturnValue(insertBuilder)

			const res = await createApp().request("/participations", {
				body: JSON.stringify({
					challengeId: 1,
					description: "My run",
					videoUrl: "https://yt.com/v=1",
				}),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			})

			expect(res.status).toBe(201)
			expect(await res.json()).toEqual(participation)
			expect(insertBuilder.values).toHaveBeenCalledWith(
				expect.objectContaining({
					challengeId: 1,
					description: "My run",
					profileId: "user-1",
					videoUrl: "https://yt.com/v=1",
				}),
			)
			expect(checkAndAwardFirstParticipation).toHaveBeenCalledWith("user-1")
		})
	})

	// ── GET /:id ────────────────────────────────────────────────────────────

	describe("GET /participations/:id", () => {
		test("returns 400 for a non-numeric id", async () => {
			const res = await createApp().request("/participations/abc")

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({ error: "Invalid participation id" })
			expect(db.select).not.toHaveBeenCalled()
		})

		test("returns 404 when participation does not exist", async () => {
			db.select.mockReturnValue(createSelectBuilder([]))

			const res = await createApp().request("/participations/999")

			expect(res.status).toBe(404)
			expect(await res.json()).toEqual({ error: "Participation not found" })
		})

		test("returns 200 with the participation", async () => {
			const participation = {
				challengeId: 1,
				id: 5,
				profileId: "user-1",
				status: "pending",
				videoUrl: "https://yt.com/v=1",
			}
			db.select.mockReturnValue(createSelectBuilder([participation]))

			const res = await createApp().request("/participations/5")

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual(participation)
		})
	})

	// ── PATCH /:id ──────────────────────────────────────────────────────────

	describe("PATCH /participations/:id", () => {
		test("returns 401 when not authenticated", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: null },
				error: null,
			})

			const res = await createApp().request("/participations/1", {
				body: JSON.stringify({ status: "validated" }),
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			})

			expect(res.status).toBe(401)
			expect(db.update).not.toHaveBeenCalled()
		})

		test("returns 403 when user is not admin", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "user-1", user_metadata: {} } },
				error: null,
			})
			db.select.mockReturnValue(createSelectBuilder([{ role: "user" }]))

			const res = await createApp().request("/participations/1", {
				body: JSON.stringify({ status: "validated" }),
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			})

			expect(res.status).toBe(403)
			expect(db.update).not.toHaveBeenCalled()
		})

		test("returns 400 for an invalid status value", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select.mockReturnValue(createSelectBuilder([{ role: "admin" }]))

			const res = await createApp().request("/participations/1", {
				body: JSON.stringify({ status: "approved" }),
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			})

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({ error: "Invalid status" })
			expect(db.update).not.toHaveBeenCalled()
		})

		test("returns 404 when participation does not exist", async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select
				.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
				.mockReturnValueOnce(createSelectBuilder([]))

			const res = await createApp().request("/participations/999", {
				body: JSON.stringify({ status: "validated" }),
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			})

			expect(res.status).toBe(404)
			expect(await res.json()).toEqual({ error: "Participation not found" })
		})

		test("validates a participation, credits reward points and checks top leaderboard", async () => {
			const existing = {
				challengeId: 1,
				id: 5,
				profileId: "user-2",
				status: "pending",
			}
			const updated = { ...existing, status: "validated" }
			const updateParticipationBuilder = createUpdateBuilder([updated])
			const updateProfileBuilder = createUpdateNoReturnBuilder()

			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select
				.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
				.mockReturnValueOnce(createSelectBuilder([existing]))
				.mockReturnValueOnce(createSelectBuilder([{ rewardPoints: 100 }]))
			db.update
				.mockReturnValueOnce(updateParticipationBuilder)
				.mockReturnValueOnce(updateProfileBuilder)

			const res = await createApp().request("/participations/5", {
				body: JSON.stringify({ status: "validated" }),
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			})

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual(updated)
			expect(db.update).toHaveBeenCalledTimes(2)
			expect(checkAndAwardTopLeaderboard).toHaveBeenCalledWith("user-2")
		})

		test("deducts reward points when un-validating a participation", async () => {
			const existing = {
				challengeId: 1,
				id: 5,
				profileId: "user-2",
				status: "validated",
			}
			const updated = { ...existing, status: "rejected" }
			const updateParticipationBuilder = createUpdateBuilder([updated])
			const updateProfileBuilder = createUpdateNoReturnBuilder()

			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select
				.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
				.mockReturnValueOnce(createSelectBuilder([existing]))
				.mockReturnValueOnce(createSelectBuilder([{ rewardPoints: 100 }]))
			db.update
				.mockReturnValueOnce(updateParticipationBuilder)
				.mockReturnValueOnce(updateProfileBuilder)

			const res = await createApp().request("/participations/5", {
				body: JSON.stringify({ status: "rejected" }),
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			})

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual(updated)
			expect(db.update).toHaveBeenCalledTimes(2)
			expect(checkAndAwardTopLeaderboard).not.toHaveBeenCalled()
		})

		test("does not credit points when already validated", async () => {
			const existing = {
				challengeId: 1,
				id: 5,
				profileId: "user-2",
				status: "validated",
			}
			const updated = { ...existing, status: "validated" }
			const updateParticipationBuilder = createUpdateBuilder([updated])

			authState.getUser.mockResolvedValue({
				data: { user: { id: "admin-1", user_metadata: {} } },
				error: null,
			})
			db.select
				.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
				.mockReturnValueOnce(createSelectBuilder([existing]))
				.mockReturnValueOnce(createSelectBuilder([{ rewardPoints: 100 }]))
			db.update.mockReturnValueOnce(updateParticipationBuilder)

			const res = await createApp().request("/participations/5", {
				body: JSON.stringify({ status: "validated" }),
				headers: { "Content-Type": "application/json" },
				method: "PATCH",
			})

			expect(res.status).toBe(200)
			expect(db.update).toHaveBeenCalledTimes(1)
			expect(checkAndAwardTopLeaderboard).not.toHaveBeenCalled()
		})
	})
})
