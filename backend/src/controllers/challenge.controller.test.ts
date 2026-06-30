import { beforeEach, describe, expect, mock, test } from "bun:test"
import { Hono } from "hono"

const authState = {
	getUser: mock(),
}
const syncProfile = mock()

const db = {
	delete: mock(),
	insert: mock(),
	select: mock(),
	update: mock(),
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

type SelectBuilderTerminalMethod = "limit" | "offset" | "orderBy"
type SelectBuilderOptions = {
	resolveAfterJoins?: boolean
	terminalMethod?: SelectBuilderTerminalMethod
}

function createSelectBuilder(
	result: unknown[],
	options: SelectBuilderOptions = {},
) {
	let innerJoinCount = 0
	const terminalMethod = options.terminalMethod ?? "limit"
	const builder = {
		from: mock(() => builder),
		innerJoin: mock(() => {
			innerJoinCount += 1

			if (options.resolveAfterJoins && innerJoinCount === 2) {
				return Promise.resolve(result)
			}

			return builder
		}),
		limit: mock(() =>
			terminalMethod === "limit" ? Promise.resolve(result) : builder,
		),
		offset: mock(() =>
			terminalMethod === "offset" ? Promise.resolve(result) : builder,
		),
		orderBy: mock(() =>
			terminalMethod === "orderBy" ? Promise.resolve(result) : builder,
		),
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

function createDeleteBuilder() {
	const where = mock(() => Promise.resolve())

	return { where }
}

function createDeleteReturningBuilder(result: unknown[]) {
	const returning = mock(() => Promise.resolve(result))
	const where = mock(() => ({ returning }))

	return { returning, where }
}

const { default: challengesRoutes } = await import("../routes/challenge")

async function withoutConsoleError(run: () => Promise<void>) {
	const originalConsoleError = console.error
	console.error = mock()

	try {
		await run()
	} finally {
		console.error = originalConsoleError
	}
}

function createApp() {
	const app = new Hono()
	app.route("/", challengesRoutes)
	return app
}

describe("challenge routes", () => {
	beforeEach(() => {
		authState.getUser.mockReset()
		syncProfile.mockReset()
		db.delete.mockReset()
		db.insert.mockReset()
		db.select.mockReset()
		db.update.mockReset()
	})

	test("returns challenges with their game and creator", async () => {
		const rows = [
			{
				creator: {
					avatarUrl: null,
					id: "user-1",
					username: "player",
				},
				createdAt: "2026-05-21T10:00:00.000Z",
				description: "Finish a run",
				difficulty: "hard",
				game: {
					coverUrl: null,
					genre: "platformer",
					id: 1,
					name: "Celeste",
					slug: "celeste",
				},
				id: 1,
				rewardPoints: 50,
				rules: "No assist mode",
				slug: "celeste-any-percent",
				status: "active",
				title: "Any percent",
				updatedAt: null,
				youtubeUrl: null,
			},
		]
		db.select.mockReturnValue(
			createSelectBuilder(rows, { resolveAfterJoins: true }),
		)

		const response = await createApp().request("/")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(rows)
		expect(authState.getUser).not.toHaveBeenCalled()
	})

	test("returns one challenge with its game and creator", async () => {
		const challenge = {
			createdAt: "2026-05-21T10:00:00.000Z",
			creator: {
				avatarUrl: null,
				id: "user-1",
				username: "player",
			},
			description: "Finish a run",
			difficulty: "hard",
			game: {
				coverUrl: null,
				genre: "platformer",
				id: 1,
				name: "Celeste",
				slug: "celeste",
			},
			id: 1,
			rewardPoints: 50,
			rules: "No assist mode",
			slug: "celeste-any-percent",
			status: "active",
			title: "Any percent",
			updatedAt: null,
			youtubeUrl: null,
		}
		db.select.mockReturnValue(createSelectBuilder([challenge]))

		const response = await createApp().request("/1")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(challenge)
		expect(authState.getUser).not.toHaveBeenCalled()
	})

	test("returns 404 when a challenge does not exist", async () => {
		db.select.mockReturnValue(createSelectBuilder([]))

		const response = await createApp().request("/999")

		expect(response.status).toBe(404)
		expect(await response.json()).toEqual({ error: "Challenge not found" })
		expect(authState.getUser).not.toHaveBeenCalled()
	})

	test("rejects invalid challenge ids", async () => {
		const response = await createApp().request("/abc")

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ error: "Invalid challenge id" })
		expect(db.select).not.toHaveBeenCalled()
		expect(authState.getUser).not.toHaveBeenCalled()
	})

	test("rejects challenge creation without authenticated user", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: null },
			error: null,
		})

		const response = await createApp().request("/", {
			body: JSON.stringify({}),
			method: "POST",
		})

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ error: "Unauthorized" })
		expect(db.insert).not.toHaveBeenCalled()
	})

	test("creates a challenge for an authenticated user", async () => {
		const user = { id: "user-1", user_metadata: {} }
		const challenge = {
			creatorId: "user-1",
			description: "Finish a run",
			gameId: 1,
			id: 1,
			rewardPoints: 50,
			rules: "No assist mode",
			slug: "any-percent",
			status: "active",
			title: "Any percent",
		}
		const insertBuilder = createInsertBuilder([challenge])

		authState.getUser.mockResolvedValue({
			data: { user },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([{ id: 1 }]))
		db.insert.mockReturnValue(insertBuilder)

		const response = await createApp().request("/", {
			body: JSON.stringify({
				description: "Finish a run",
				gameId: 1,
				rewardPoints: 50,
				rules: "No assist mode",
				title: "Any percent",
			}),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		})

		expect(response.status).toBe(201)
		expect(await response.json()).toEqual(challenge)
		expect(syncProfile).toHaveBeenCalledWith(user)
		expect(insertBuilder.values).toHaveBeenCalledWith({
			creatorId: "user-1",
			description: "Finish a run",
			difficulty: undefined,
			gameId: 1,
			rewardPoints: 50,
			rules: "No assist mode",
			slug: "any-percent",
			status: "active",
			title: "Any percent",
			youtubeUrl: undefined,
		})
	})

	test("creates a challenge with difficulty and youtubeUrl", async () => {
		const user = { id: "user-1", user_metadata: {} }
		const challenge = {
			creatorId: "user-1",
			description: "Finish a run",
			difficulty: "hard",
			gameId: 1,
			id: 1,
			rewardPoints: 0,
			rules: "No assist mode",
			slug: "any-percent",
			status: "active",
			title: "Any percent",
			youtubeUrl: "https://youtube.com/watch?v=abc",
		}
		const insertBuilder = createInsertBuilder([challenge])

		authState.getUser.mockResolvedValue({ data: { user }, error: null })
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([{ id: 1 }]))
		db.insert.mockReturnValue(insertBuilder)

		const response = await createApp().request("/", {
			body: JSON.stringify({
				description: "Finish a run",
				difficulty: "hard",
				gameId: 1,
				rules: "No assist mode",
				title: "Any percent",
				youtubeUrl: "https://youtube.com/watch?v=abc",
			}),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		})

		expect(response.status).toBe(201)
		expect(insertBuilder.values).toHaveBeenCalledWith(
			expect.objectContaining({
				difficulty: "hard",
				youtubeUrl: "https://youtube.com/watch?v=abc",
			}),
		)
	})

	test("rejects challenge creation with invalid difficulty", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)

		const response = await createApp().request("/", {
			body: JSON.stringify({
				description: "Finish a run",
				difficulty: "impossible",
				gameId: 1,
				rules: "No assist mode",
				title: "Any percent",
			}),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		})

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({
			error: "Invalid challenge payload",
		})
		expect(db.insert).not.toHaveBeenCalled()
	})

	test("rejects creation when the game does not exist", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([]))

		const response = await createApp().request("/", {
			body: JSON.stringify({
				description: "Finish a run",
				gameId: 99,
				rules: "No assist mode",
				title: "Any percent",
			}),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		})

		expect(response.status).toBe(404)
		expect(await response.json()).toEqual({ error: "Game not found" })
		expect(db.insert).not.toHaveBeenCalled()
	})

	test("rejects challenge updates from non owners", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-2", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select
			.mockReturnValueOnce(createSelectBuilder([{ creatorId: "user-1" }]))
			.mockReturnValueOnce(createSelectBuilder([{ role: "user" }]))

		const response = await createApp().request("/1", {
			body: JSON.stringify({ title: "Updated" }),
			headers: { "Content-Type": "application/json" },
			method: "PUT",
		})

		expect(response.status).toBe(403)
		expect(await response.json()).toEqual({ error: "Forbidden" })
		expect(db.update).not.toHaveBeenCalled()
	})

	test("updates a challenge for its creator", async () => {
		const challenge = {
			creatorId: "user-1",
			id: 1,
			title: "Updated",
		}
		const updateBuilder = createUpdateBuilder([challenge])

		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([{ creatorId: "user-1" }]))
		db.update.mockReturnValue(updateBuilder)

		const response = await createApp().request("/1", {
			body: JSON.stringify({ title: "Updated" }),
			headers: { "Content-Type": "application/json" },
			method: "PUT",
		})

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(challenge)
		expect(updateBuilder.set).toHaveBeenCalled()
		expect(updateBuilder.set.mock.calls.at(0)?.at(0)).toMatchObject({
			title: "Updated",
		})
	})

	test("updates a challenge difficulty and youtubeUrl", async () => {
		const challenge = {
			creatorId: "user-1",
			difficulty: "easy",
			id: 1,
			youtubeUrl: "https://youtube.com/watch?v=xyz",
		}
		const updateBuilder = createUpdateBuilder([challenge])

		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([{ creatorId: "user-1" }]))
		db.update.mockReturnValue(updateBuilder)

		const response = await createApp().request("/1", {
			body: JSON.stringify({
				difficulty: "easy",
				youtubeUrl: "https://youtube.com/watch?v=xyz",
			}),
			headers: { "Content-Type": "application/json" },
			method: "PUT",
		})

		expect(response.status).toBe(200)
		expect(updateBuilder.set.mock.calls.at(0)?.at(0)).toMatchObject({
			difficulty: "easy",
			youtubeUrl: "https://youtube.com/watch?v=xyz",
		})
	})

	test("rejects challenge update with invalid difficulty", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([{ creatorId: "user-1" }]))

		const response = await createApp().request("/1", {
			body: JSON.stringify({ difficulty: "legendary" }),
			headers: { "Content-Type": "application/json" },
			method: "PUT",
		})

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({
			error: "Invalid challenge payload",
		})
		expect(db.update).not.toHaveBeenCalled()
	})

	test("deletes a challenge for an admin", async () => {
		const deleteBuilder = createDeleteBuilder()

		authState.getUser.mockResolvedValue({
			data: { user: { id: "admin-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select
			.mockReturnValueOnce(createSelectBuilder([{ creatorId: "user-1" }]))
			.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
		db.delete.mockReturnValue(deleteBuilder)

		const response = await createApp().request("/1", {
			method: "DELETE",
		})

		expect(response.status).toBe(204)
		expect(db.delete).toHaveBeenCalled()
		expect(deleteBuilder.where).toHaveBeenCalled()
	})

	test("subscribes an authenticated user to an active challenge", async () => {
		const user = { id: "user-1", user_metadata: {} }
		const subscription = {
			challengeId: 1,
			id: 1,
			profileId: "user-1",
		}
		const insertBuilder = createInsertBuilder([subscription])

		authState.getUser.mockResolvedValue({
			data: { user },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select
			.mockReturnValueOnce(createSelectBuilder([{ id: 1, status: "active" }]))
			.mockReturnValueOnce(createSelectBuilder([]))
		db.insert.mockReturnValue(insertBuilder)

		const response = await createApp().request("/1/subscribe", {
			method: "POST",
		})

		expect(response.status).toBe(201)
		expect(await response.json()).toEqual(subscription)
		expect(insertBuilder.values).toHaveBeenCalledWith({
			challengeId: 1,
			profileId: "user-1",
		})
	})

	test("unsubscribes an authenticated user from a challenge", async () => {
		const deleteBuilder = createDeleteReturningBuilder([{ id: 1 }])

		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([{ id: 1 }]))
		db.delete.mockReturnValue(deleteBuilder)

		const response = await createApp().request("/1/subscribe", {
			method: "DELETE",
		})

		expect(response.status).toBe(204)
		expect(deleteBuilder.returning).toHaveBeenCalled()
	})

	test("rejects completion submissions with unsupported video urls", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)

		const response = await createApp().request("/1/submissions", {
			body: JSON.stringify({ videoUrl: "https://example.com/video" }),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		})

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ error: "Invalid video URL" })
		expect(db.select).not.toHaveBeenCalled()
		expect(db.insert).not.toHaveBeenCalled()
	})

	test("returns current subscriptions for the authenticated user", async () => {
		const rows = [
			{
				challenge: { id: 1, title: "Any percent" },
				game: { id: 1, name: "Celeste", slug: "celeste" },
				subscribedAt: "2026-05-21T10:00:00.000Z",
				subscriptionId: 1,
			},
		]

		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		const selectBuilder = createSelectBuilder(rows, {
			terminalMethod: "offset",
		})
		db.select.mockReturnValue(selectBuilder)

		const response = await createApp().request("/me/subscriptions")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(rows)
		expect(selectBuilder.limit).toHaveBeenCalledWith(50)
		expect(selectBuilder.offset).toHaveBeenCalledWith(0)
	})

	test("applies capped pagination to current subscriptions", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		const selectBuilder = createSelectBuilder([], {
			terminalMethod: "offset",
		})
		db.select.mockReturnValue(selectBuilder)

		const response = await createApp().request(
			"/me/subscriptions?page=3&limit=250",
		)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual([])
		expect(selectBuilder.limit).toHaveBeenCalledWith(100)
		expect(selectBuilder.offset).toHaveBeenCalledWith(200)
	})

	test("returns participations for the authenticated user", async () => {
		const rows = [
			{
				challenge: { id: 1, title: "Any percent" },
				game: { id: 1, name: "Celeste", slug: "celeste" },
				participation: {
					id: 1,
					status: "validated",
					videoUrl: "https://videos.gamerchallenge.test/run.mp4",
				},
			},
		]

		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		const selectBuilder = createSelectBuilder(rows, {
			terminalMethod: "offset",
		})
		db.select.mockReturnValue(selectBuilder)

		const response = await createApp().request(
			"/me/participations?page=2&limit=10",
		)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(rows)
		expect(selectBuilder.limit).toHaveBeenCalledWith(10)
		expect(selectBuilder.offset).toHaveBeenCalledWith(10)
	})

	test("returns 500 when subscribing fails", async () => {
		await withoutConsoleError(async () => {
			const insertBuilder = createInsertBuilder([])
			insertBuilder.returning.mockImplementation(() =>
				Promise.reject(new Error("database timeout")),
			)

			authState.getUser.mockResolvedValue({
				data: { user: { id: "user-1", user_metadata: {} } },
				error: null,
			})
			syncProfile.mockResolvedValue(undefined)
			db.select
				.mockReturnValueOnce(createSelectBuilder([{ id: 1, status: "active" }]))
				.mockReturnValueOnce(createSelectBuilder([]))
			db.insert.mockReturnValue(insertBuilder)

			const response = await createApp().request("/1/subscribe", {
				method: "POST",
			})

			expect(response.status).toBe(500)
			expect(await response.json()).toEqual({ error: "Internal server error" })
		})
	})

	test("returns 500 when current subscriptions query fails", async () => {
		await withoutConsoleError(async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "user-1", user_metadata: {} } },
				error: null,
			})
			syncProfile.mockResolvedValue(undefined)
			const selectBuilder = createSelectBuilder([], {
				terminalMethod: "offset",
			})
			selectBuilder.offset.mockImplementation(() =>
				Promise.reject(new Error("database timeout")),
			)
			db.select.mockReturnValue(selectBuilder)

			const response = await createApp().request("/me/subscriptions")

			expect(response.status).toBe(500)
			expect(await response.json()).toEqual({ error: "Internal server error" })
		})
	})

	test("returns 404 when subscribing to a non-existent challenge", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([]))

		const response = await createApp().request("/999/subscribe", {
			method: "POST",
		})

		expect(response.status).toBe(404)
		expect(await response.json()).toEqual({ error: "Challenge not found" })
	})

	test("returns 400 when subscribing to a non-active challenge", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(
			createSelectBuilder([{ id: 1, status: "closed" }]),
		)

		const response = await createApp().request("/1/subscribe", {
			method: "POST",
		})

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ error: "Challenge is not active" })
	})

	test("returns the existing subscription when already subscribed to a challenge", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select
			.mockReturnValueOnce(createSelectBuilder([{ id: 1, status: "active" }]))
			.mockReturnValueOnce(createSelectBuilder([{ id: 1 }]))

		const response = await createApp().request("/1/subscribe", {
			method: "POST",
		})

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ id: 1 })
	})

	test("returns 404 when unsubscribing without an existing subscription", async () => {
		const deleteBuilder = createDeleteReturningBuilder([])

		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([{ id: 1 }]))
		db.delete.mockReturnValue(deleteBuilder)

		const response = await createApp().request("/1/subscribe", {
			method: "DELETE",
		})

		expect(response.status).toBe(404)
		expect(await response.json()).toEqual({ error: "Subscription not found" })
	})

	test("unsubscribes using the correct challengeId and profileId", async () => {
		const deleteBuilder = createDeleteReturningBuilder([{ id: 1 }])

		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(createSelectBuilder([{ id: 1 }]))
		db.delete.mockReturnValue(deleteBuilder)

		await createApp().request("/1/subscribe", { method: "DELETE" })

		expect(deleteBuilder.where).toHaveBeenCalled()
	})

	test("returns 400 when submitting a video without being subscribed", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select
			.mockReturnValueOnce(createSelectBuilder([{ id: 1, status: "active" }]))
			.mockReturnValueOnce(createSelectBuilder([]))

		const response = await createApp().request("/1/submissions", {
			body: JSON.stringify({ videoUrl: "https://www.youtube.com/watch?v=abc" }),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		})

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({
			error: "Subscribe to the challenge before submitting",
		})
	})

	test("returns participations including pending ones", async () => {
		const rows = [
			{
				challenge: { id: 1, title: "Any percent" },
				game: { id: 1, name: "Celeste", slug: "celeste" },
				participation: {
					id: 1,
					status: "pending",
					videoUrl: "https://youtu.be/abc",
				},
			},
		]

		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-1", user_metadata: {} } },
			error: null,
		})
		syncProfile.mockResolvedValue(undefined)
		db.select.mockReturnValue(
			createSelectBuilder(rows, { terminalMethod: "offset" }),
		)

		const response = await createApp().request("/me/participations")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(rows)
	})

	test("returns 500 when participations query fails", async () => {
		await withoutConsoleError(async () => {
			authState.getUser.mockResolvedValue({
				data: { user: { id: "user-1", user_metadata: {} } },
				error: null,
			})
			syncProfile.mockResolvedValue(undefined)
			const selectBuilder = createSelectBuilder([], {
				terminalMethod: "offset",
			})
			selectBuilder.offset.mockImplementation(() =>
				Promise.reject(new Error("database timeout")),
			)
			db.select.mockReturnValue(selectBuilder)

			const response = await createApp().request("/me/participations")

			expect(response.status).toBe(500)
			expect(await response.json()).toEqual({ error: "Internal server error" })
		})
	})
})
