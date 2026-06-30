import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { Hono } from "hono"

const authState = {
	getUser: mock(),
}

mock.module("../auth/supabase", () => ({
	createSupabaseServerClient: () => ({
		auth: authState,
	}),
}))

const db = {
	select: mock(),
	transaction: mock(),
}

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

function createTransactionMock() {
	const tx = {
		select: mock(),
		insert: mock(() => ({
			values: () => Promise.resolve(),
		})),
		update: mock(() => ({
			set: () => ({
				where: () => Promise.resolve(),
			}),
		})),
		delete: mock(() => ({
			where: () => Promise.resolve(),
		})),
	}
	return tx
}

const { default: voteRoutes } = await import("../routes/vote")

function createApp() {
	const app = new Hono()
	app.route("/vote", voteRoutes)
	return app
}

describe("vote route", () => {
	beforeEach(() => {
		authState.getUser.mockReset()
		db.select.mockReset()
		db.transaction.mockReset()
	})

	afterEach(() => {})

	test("returns 401 when not authenticated", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: null },
			error: null,
		})

		const app = createApp()

		const res = await app.request("/vote", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				participationId: 1,
				value: 1,
			}),
		})

		expect(res.status).toBe(401)
		const body = await res.json()
		expect(body).toEqual({ error: "Unauthorized" })

		expect(db.select).not.toHaveBeenCalled()
		expect(db.transaction).not.toHaveBeenCalled()
	})

	test("returns 400 when value is not 1 or -1", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-123" } },
			error: null,
		})

		const app = createApp()

		const res = await app.request("/vote", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				participationId: 1,
				value: 5,
			}),
		})

		expect(res.status).toBe(400)
		const body = await res.json()
		expect(body).toEqual({ error: "Invalid value, must be 1 or -1" })

		expect(db.select).not.toHaveBeenCalled()
		expect(db.transaction).not.toHaveBeenCalled()
	})

	test("returns 400 when participationId is missing or invalid", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-123" } },
			error: null,
		})

		const app = createApp()

		const res = await app.request("/vote", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ value: 1 }),
		})

		expect(res.status).toBe(400)
		const body = await res.json()
		expect(body).toEqual({ error: "Invalid participationId" })
	})

	test("returns 404 when participation does not exist", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-123" } },
			error: null,
		})

		db.select.mockReturnValue(createQueryBuilder([]))

		const app = createApp()

		const res = await app.request("/vote", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ participationId: 999, value: 1 }),
		})

		expect(res.status).toBe(404)
		expect(await res.json()).toEqual({ error: "Participation not found" })
		expect(db.transaction).not.toHaveBeenCalled()
	})

	test("creates a new vote when none exists", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-123" } },
			error: null,
		})

		db.select
			.mockReturnValueOnce(
				createQueryBuilder([{ id: 1, upvotes: 1, downvotes: 0 }]),
			)
			.mockReturnValueOnce(
				createQueryBuilder([{ id: 1, upvotes: 1, downvotes: 0 }]),
			)

		const tx = createTransactionMock()
		tx.select.mockReturnValue(createQueryBuilder([]))

		db.transaction.mockImplementation(
			async (cb: (tx: unknown) => Promise<void>) => {
				await cb(tx)
			},
		)

		const res = await createApp().request("/vote", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ participationId: 1, value: 1 }),
		})

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ id: 1, upvotes: 1, downvotes: 0 })

		expect(tx.insert).toHaveBeenCalledTimes(1)
		expect(tx.delete).not.toHaveBeenCalled()
		expect(tx.update).toHaveBeenCalledTimes(1)
	})

	test("removes the vote when re-voting with the same value (toggle off)", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-123" } },
			error: null,
		})

		db.select
			.mockReturnValueOnce(
				createQueryBuilder([{ id: 1, upvotes: 1, downvotes: 0 }]),
			)
			.mockReturnValueOnce(
				createQueryBuilder([{ id: 1, upvotes: 0, downvotes: 0 }]),
			)

		const tx = createTransactionMock()

		tx.select.mockReturnValue(
			createQueryBuilder([
				{ id: 42, value: 1, participationId: 1, profileId: "user-123" },
			]),
		)

		db.transaction.mockImplementation(
			async (cb: (tx: unknown) => Promise<void>) => {
				await cb(tx)
			},
		)

		const res = await createApp().request("/vote", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ participationId: 1, value: 1 }),
		})

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ id: 1, upvotes: 0, downvotes: 0 })

		expect(tx.delete).toHaveBeenCalledTimes(1)
		expect(tx.insert).not.toHaveBeenCalled()
		expect(tx.update).toHaveBeenCalledTimes(1)
	})

	test("updates the vote when re-voting with the opposite value (flip)", async () => {
		authState.getUser.mockResolvedValue({
			data: { user: { id: "user-123" } },
			error: null,
		})

		db.select
			.mockReturnValueOnce(
				createQueryBuilder([{ id: 1, upvotes: 1, downvotes: 0 }]),
			)
			.mockReturnValueOnce(
				createQueryBuilder([{ id: 1, upvotes: 0, downvotes: 1 }]),
			)

		const tx = createTransactionMock()
		tx.select.mockReturnValue(
			createQueryBuilder([
				{ id: 42, value: 1, participationId: 1, profileId: "user-123" },
			]),
		)
		db.transaction.mockImplementation(
			async (cb: (tx: unknown) => Promise<void>) => {
				await cb(tx)
			},
		)

		const res = await createApp().request("/vote", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ participationId: 1, value: -1 }),
		})

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ id: 1, upvotes: 0, downvotes: 1 })

		expect(tx.insert).not.toHaveBeenCalled()
		expect(tx.delete).not.toHaveBeenCalled()
		expect(tx.update).toHaveBeenCalledTimes(2)
	})
})
