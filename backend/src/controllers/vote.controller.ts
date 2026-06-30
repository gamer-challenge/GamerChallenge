import { and, eq, sql } from "drizzle-orm"
import type { Context } from "hono"
import { db } from "../db/client"
import { participations, votes } from "../db/schema"

export async function handleVote(c: Context) {
	const user = c.get("user")

	let body: { participationId?: unknown; value?: unknown }
	try {
		body = await c.req.json()
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400)
	}

	const participationId = Number(body.participationId)
	const value = Number(body.value)

	if (!Number.isInteger(participationId) || participationId <= 0) {
		return c.json({ error: "Invalid participationId" }, 400)
	}

	if (value !== 1 && value !== -1) {
		return c.json({ error: "Invalid value, must be 1 or -1" }, 400)
	}

	const [participation] = await db
		.select()
		.from(participations)
		.where(eq(participations.id, participationId))
		.limit(1)

	if (!participation) {
		return c.json({ error: "Participation not found" }, 404)
	}

	try {
		await db.transaction(async (tx) => {
			const [existingVote] = await tx
				.select()
				.from(votes)
				.where(
					and(
						eq(votes.participationId, participationId),
						eq(votes.profileId, user.id),
					),
				)
				.limit(1)
			if (!existingVote) {
				await tx.insert(votes).values({
					participationId,
					profileId: user.id,
					value,
				})
			} else if (existingVote.value === value) {
				await tx.delete(votes).where(eq(votes.id, existingVote.id))
			} else {
				await tx
					.update(votes)
					.set({ value })
					.where(eq(votes.id, existingVote.id))
			}

			await tx
				.update(participations)
				.set({
					upvotes: sql`(select count(*) from ${votes} where ${votes.participationId} = ${participationId} and ${votes.value} = 1)`,
					downvotes: sql`(select count(*) from ${votes} where ${votes.participationId} = ${participationId} and ${votes.value} = -1)`,
				})
				.where(eq(participations.id, participationId))
		})
	} catch (error) {
		console.error("Vote transaction failed", error)
		return c.json({ error: "Internal server error" }, 500)
	}

	const [updatedParticipation] = await db
		.select({
			id: participations.id,
			upvotes: participations.upvotes,
			downvotes: participations.downvotes,
		})
		.from(participations)
		.where(eq(participations.id, participationId))
		.limit(1)

	if (!updatedParticipation) {
		return c.json({ error: "Internal server error" }, 500)
	}

	return c.json(updatedParticipation)
}
