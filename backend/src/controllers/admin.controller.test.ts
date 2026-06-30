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
	transaction: mock(),
	update: mock(),
}

const awardBadge = mock()
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
	awardBadge,
	checkAndAwardFirstParticipation: mock(),
	checkAndAwardTopLeaderboard,
}))

type TerminalMethod = "for" | "from" | "limit" | "offset"

function createSelectBuilder(
	result: unknown[],
	terminalMethod: TerminalMethod = "limit",
) {
	const builder = {
		from: mock(() =>
			terminalMethod === "from" ? Promise.resolve(result) : builder,
		),
		innerJoin: mock(() => builder),
		limit: mock(() =>
			terminalMethod === "limit" ? Promise.resolve(result) : builder,
		),
		offset: mock(() =>
			terminalMethod === "offset" ? Promise.resolve(result) : builder,
		),
		orderBy: mock(() => builder),
		where: mock(() => builder),
		for: mock(() =>
			terminalMethod === "for" ? Promise.resolve(result) : builder,
		),
	}

	return builder
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

function createDeleteBuilder() {
	const where = mock(() => Promise.resolve())

	return { where }
}

function createTransactionMock() {
	return {
		delete: mock(),
		select: mock(),
		update: mock(),
	}
}

const { default: adminRoutes } = await import("../routes/admin")

function createApp() {
	const app = new Hono()
	app.route("/", adminRoutes)
	return app
}

function authenticateAs(userId: string) {
	authState.getUser.mockResolvedValue({
		data: { user: { id: userId, user_metadata: {} } },
		error: null,
	})
}

describe("admin routes", () => {
	beforeEach(() => {
		authState.getUser.mockReset()
		syncProfile.mockReset()
		db.delete.mockReset()
		db.insert.mockReset()
		db.select.mockReset()
		db.transaction.mockReset()
		db.update.mockReset()
		awardBadge.mockReset()
		checkAndAwardTopLeaderboard.mockReset()

		syncProfile.mockResolvedValue(undefined)
	})

	test("returns 401 when the user is not authenticated", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: null },
			error: null,
		})

		const response = await createApp().request("/users")

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ error: "Unauthorized" })
		expect(db.select).not.toHaveBeenCalled()
	})

	test("returns 403 when the authenticated user is not admin", async () => {
		authenticateAs("user-1")
		db.select.mockReturnValue(createSelectBuilder([{ role: "user" }]))

		const response = await createApp().request("/users")

		expect(response.status).toBe(403)
		expect(await response.json()).toEqual({ error: "Forbidden" })
		expect(db.select).toHaveBeenCalledTimes(1)
	})

	test("returns 403 when the authenticated user is banned", async () => {
		authenticateAs("user-1")
		syncProfile.mockResolvedValue({
			id: "user-1",
			isBanned: true,
		})

		const response = await createApp().request("/users")

		expect(response.status).toBe(403)
		expect(await response.json()).toEqual({ error: "Forbidden" })
		expect(db.select).not.toHaveBeenCalled()
	})

	test("lists users for admins", async () => {
		authenticateAs("admin-1")
		const rows = [
			{
				email: "player@gamerchallenge.test",
				id: "user-1",
				isBanned: false,
				role: "user",
				username: "Player",
			},
		]
		const adminCheck = createSelectBuilder([{ role: "admin" }])
		const usersQuery = createSelectBuilder(rows, "offset")

		db.select.mockReturnValueOnce(adminCheck).mockReturnValueOnce(usersQuery)

		const response = await createApp().request("/users?page=2&limit=10")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(rows)
		expect(usersQuery.limit).toHaveBeenCalledWith(10)
		expect(usersQuery.offset).toHaveBeenCalledWith(10)
	})

	test("bans a user for admins", async () => {
		authenticateAs("admin-1")
		const updatedProfile = {
			id: "user-2",
			isBanned: true,
			role: "user",
			username: "Player",
		}

		db.select.mockReturnValue(createSelectBuilder([{ role: "admin" }]))
		db.update.mockReturnValue(createUpdateBuilder([updatedProfile]))

		const response = await createApp().request("/users/user-2/ban", {
			body: JSON.stringify({ isBanned: true }),
			headers: { "Content-Type": "application/json" },
			method: "PATCH",
		})

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(updatedProfile)
		expect(db.update).toHaveBeenCalled()
	})

	test("deletes a challenge and deducts points from validated participations", async () => {
		authenticateAs("admin-1")
		const tx = createTransactionMock()

		db.select.mockReturnValue(createSelectBuilder([{ role: "admin" }]))
		db.transaction.mockImplementation(async (run) => run(tx))
		tx.select
			.mockReturnValueOnce(
				createSelectBuilder([{ id: 1, rewardPoints: 50 }], "for"),
			)
			.mockReturnValueOnce(
				createSelectBuilder(
					[
						{ profileId: "user-1" },
						{ profileId: "user-1" },
						{ profileId: "user-2" },
					],
					"for",
				),
			)
		tx.update.mockReturnValue(createUpdateNoReturnBuilder())
		tx.delete.mockReturnValue(createDeleteBuilder())

		const response = await createApp().request("/challenges/1", {
			method: "DELETE",
		})

		expect(response.status).toBe(204)
		expect(tx.update).toHaveBeenCalledTimes(2)
		expect(tx.delete).toHaveBeenCalled()
	})

	test("moderates a participation and credits points once", async () => {
		authenticateAs("admin-1")
		const tx = createTransactionMock()
		const updatedParticipation = {
			id: 3,
			profileId: "user-2",
			status: "validated",
		}

		db.select.mockReturnValue(createSelectBuilder([{ role: "admin" }]))
		db.transaction.mockImplementation(async (run) => run(tx))
		tx.select.mockReturnValue(
			createSelectBuilder(
				[
					{
						id: 3,
						profileId: "user-2",
						rewardPoints: 120,
						status: "pending",
					},
				],
				"for",
			),
		)
		tx.update
			.mockReturnValueOnce(createUpdateBuilder([updatedParticipation]))
			.mockReturnValueOnce(createUpdateNoReturnBuilder())

		const response = await createApp().request("/participations/3", {
			body: JSON.stringify({ status: "validated" }),
			headers: { "Content-Type": "application/json" },
			method: "PATCH",
		})

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(updatedParticipation)
		expect(tx.update).toHaveBeenCalledTimes(2)
		expect(checkAndAwardTopLeaderboard).toHaveBeenCalledWith("user-2")
	})

	test("moderates a vote and recalculates counters in the same transaction", async () => {
		authenticateAs("admin-1")
		const tx = createTransactionMock()
		const updatedVote = {
			id: 4,
			participationId: 8,
			value: -1,
		}

		db.select.mockReturnValue(createSelectBuilder([{ role: "admin" }]))
		db.transaction.mockImplementation(async (run) => run(tx))
		tx.update
			.mockReturnValueOnce(createUpdateBuilder([updatedVote]))
			.mockReturnValueOnce(createUpdateNoReturnBuilder())

		const response = await createApp().request("/votes/4", {
			body: JSON.stringify({ value: -1 }),
			headers: { "Content-Type": "application/json" },
			method: "PATCH",
		})

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(updatedVote)
		expect(tx.update).toHaveBeenCalledTimes(2)
	})

	test("deletes a vote and recalculates counters in the same transaction", async () => {
		authenticateAs("admin-1")
		const tx = createTransactionMock()

		db.select.mockReturnValue(createSelectBuilder([{ role: "admin" }]))
		db.transaction.mockImplementation(async (run) => run(tx))
		tx.select.mockReturnValue(
			createSelectBuilder([{ participationId: 8 }], "for"),
		)
		tx.delete.mockReturnValue(createDeleteBuilder())
		tx.update.mockReturnValue(createUpdateNoReturnBuilder())

		const response = await createApp().request("/votes/4", {
			method: "DELETE",
		})

		expect(response.status).toBe(204)
		expect(tx.delete).toHaveBeenCalled()
		expect(tx.update).toHaveBeenCalledTimes(1)
	})

	test("moderates reports for admins", async () => {
		authenticateAs("admin-1")
		const updatedReport = {
			id: 2,
			moderatorId: "admin-1",
			status: "resolved",
		}

		db.select.mockReturnValue(createSelectBuilder([{ role: "admin" }]))
		db.update.mockReturnValue(createUpdateBuilder([updatedReport]))

		const response = await createApp().request("/reports/2", {
			body: JSON.stringify({
				moderatorNote: "Handled",
				status: "resolved",
			}),
			headers: { "Content-Type": "application/json" },
			method: "PATCH",
		})

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual(updatedReport)
		expect(db.update).toHaveBeenCalled()
	})

	test("returns platform stats for admins", async () => {
		authenticateAs("admin-1")
		const userStats = { admins: 1, banned: 0, total: 3 }
		const challengeStats = { active: 2, closed: 0, removed: 1, total: 3 }
		const participationStats = { pending: 1, total: 2, validated: 1 }
		const voteStats = { downvotes: 1, total: 5, upvotes: 4 }
		const badgeStats = { awarded: 2, total: 4 }
		const reportStats = { open: 1, resolved: 1, total: 2 }

		db.select
			.mockReturnValueOnce(createSelectBuilder([{ role: "admin" }]))
			.mockReturnValueOnce(createSelectBuilder([userStats], "from"))
			.mockReturnValueOnce(createSelectBuilder([challengeStats], "from"))
			.mockReturnValueOnce(createSelectBuilder([participationStats], "from"))
			.mockReturnValueOnce(createSelectBuilder([voteStats], "from"))
			.mockReturnValueOnce(createSelectBuilder([badgeStats], "from"))
			.mockReturnValueOnce(createSelectBuilder([reportStats], "from"))

		const response = await createApp().request("/stats")

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			badges: badgeStats,
			challenges: challengeStats,
			participations: participationStats,
			reports: reportStats,
			users: userStats,
			votes: voteStats,
		})
	})
})
