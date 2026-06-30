import { beforeEach, describe, expect, mock, test } from "bun:test"
import { Hono } from "hono"

const db = {
	select: mock(),
}

mock.module("../db/client", () => ({
	db,
}))

type TerminalMethod = "limit" | "offset" | "orderBy"

function createSelectBuilder(
	result: unknown[],
	terminalMethod: TerminalMethod = "orderBy",
) {
	const builder = {
		from: mock(() => builder),
		groupBy: mock(() => builder),
		innerJoin: mock(() => builder),
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

const { default: leaderboardRoutes } = await import("../routes/leaderboard")

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
	app.route("/", leaderboardRoutes)
	return app
}

describe("leaderboard routes", () => {
	beforeEach(() => {
		db.select.mockReset()
	})

	test("returns the global leaderboard", async () => {
		const rows = [
			{
				avatarUrl: null,
				id: "user-1",
				karma: 25,
				points: 1420,
				username: "JadeClutch",
			},
			{
				avatarUrl: null,
				id: "user-2",
				karma: 12,
				points: 1250,
				username: "NinaCombo",
			},
		]
		const selectBuilder = createSelectBuilder(rows, "offset")
		db.select.mockReturnValue(selectBuilder)

		const response = await createApp().request("/")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(rows)
		expect(selectBuilder.from).toHaveBeenCalled()
		expect(selectBuilder.where).toHaveBeenCalled()
		expect(selectBuilder.orderBy).toHaveBeenCalled()
		expect(selectBuilder.limit).toHaveBeenCalledWith(50)
		expect(selectBuilder.offset).toHaveBeenCalledWith(0)
	})

	test("applies capped pagination to the global leaderboard", async () => {
		const selectBuilder = createSelectBuilder([], "offset")
		db.select.mockReturnValue(selectBuilder)

		const response = await createApp().request("/?page=3&limit=250")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual([])
		expect(selectBuilder.limit).toHaveBeenCalledWith(100)
		expect(selectBuilder.offset).toHaveBeenCalledWith(200)
	})

	test("returns a filtered global leaderboard for month and game", async () => {
		const rows = [
			{
				avatarUrl: null,
				game: {
					id: 1,
					name: "Elden Ring",
				},
				id: "user-1",
				karma: 12,
				points: 5000,
				username: "JadeClutch",
			},
		]
		const selectBuilder = createSelectBuilder(rows, "offset")
		db.select.mockReturnValue(selectBuilder)

		const response = await createApp().request(
			"/?period=month&gameId=1&limit=25",
		)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(rows)
		expect(selectBuilder.from).toHaveBeenCalled()
		expect(selectBuilder.innerJoin).toHaveBeenCalledTimes(3)
		expect(selectBuilder.where).toHaveBeenCalled()
		expect(selectBuilder.groupBy).toHaveBeenCalled()
		expect(selectBuilder.orderBy).toHaveBeenCalled()
		expect(selectBuilder.limit).toHaveBeenCalledWith(25)
		expect(selectBuilder.offset).toHaveBeenCalledWith(0)
	})

	test("returns a challenge leaderboard", async () => {
		const rows = [
			{
				createdAt: "2026-05-21T10:00:00.000Z",
				description: "Run stable",
				downvotes: 1,
				id: 1,
				player: {
					avatarUrl: null,
					id: "user-1",
					karma: 12,
					points: 1250,
					username: "NinaCombo",
				},
				score: 17,
				screenshotUrl: null,
				upvotes: 18,
				videoUrl: "https://videos.gamerchallenge.test/run.mp4",
			},
		]
		const challengeSelectBuilder = createSelectBuilder([{ id: 1 }], "limit")
		const leaderboardSelectBuilder = createSelectBuilder(rows, "offset")
		db.select
			.mockReturnValueOnce(challengeSelectBuilder)
			.mockReturnValueOnce(leaderboardSelectBuilder)

		const response = await createApp().request("/1")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(rows)
		expect(challengeSelectBuilder.limit).toHaveBeenCalledWith(1)
		expect(leaderboardSelectBuilder.innerJoin).toHaveBeenCalled()
		expect(leaderboardSelectBuilder.where).toHaveBeenCalled()
		expect(leaderboardSelectBuilder.orderBy).toHaveBeenCalled()
		expect(leaderboardSelectBuilder.limit).toHaveBeenCalledWith(50)
		expect(leaderboardSelectBuilder.offset).toHaveBeenCalledWith(0)
	})

	test("applies capped pagination to the challenge leaderboard", async () => {
		const challengeSelectBuilder = createSelectBuilder([{ id: 1 }], "limit")
		const leaderboardSelectBuilder = createSelectBuilder([], "offset")
		db.select
			.mockReturnValueOnce(challengeSelectBuilder)
			.mockReturnValueOnce(leaderboardSelectBuilder)

		const response = await createApp().request("/1?page=2&limit=200")

		expect(response.status).toBe(200)
		expect(leaderboardSelectBuilder.limit).toHaveBeenCalledWith(100)
		expect(leaderboardSelectBuilder.offset).toHaveBeenCalledWith(100)
	})

	test("rejects invalid challenge ids", async () => {
		const response = await createApp().request("/abc")

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ error: "Invalid challenge id" })
		expect(db.select).not.toHaveBeenCalled()
	})

	test("returns 404 when a challenge does not exist", async () => {
		db.select.mockReturnValue(createSelectBuilder([], "limit"))

		const response = await createApp().request("/999")

		expect(response.status).toBe(404)
		expect(await response.json()).toEqual({ error: "Challenge not found" })
		expect(db.select).toHaveBeenCalledTimes(1)
	})

	test("returns 500 when the global leaderboard query fails", async () => {
		await withoutConsoleError(async () => {
			const selectBuilder = createSelectBuilder([], "offset")
			selectBuilder.offset.mockImplementation(() =>
				Promise.reject(new Error("database timeout")),
			)
			db.select.mockReturnValue(selectBuilder)

			const response = await createApp().request("/")

			expect(response.status).toBe(500)
			expect(await response.json()).toEqual({ error: "Internal server error" })
		})
	})

	test("returns 500 when the challenge leaderboard query fails", async () => {
		await withoutConsoleError(async () => {
			const challengeSelectBuilder = createSelectBuilder([{ id: 1 }], "limit")
			const leaderboardSelectBuilder = createSelectBuilder([], "offset")
			leaderboardSelectBuilder.offset.mockImplementation(() =>
				Promise.reject(new Error("database timeout")),
			)
			db.select
				.mockReturnValueOnce(challengeSelectBuilder)
				.mockReturnValueOnce(leaderboardSelectBuilder)

			const response = await createApp().request("/1")

			expect(response.status).toBe(500)
			expect(await response.json()).toEqual({ error: "Internal server error" })
		})
	})
})
