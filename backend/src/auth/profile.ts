import type { User } from "@supabase/supabase-js"
import { eq } from "drizzle-orm"
import { db } from "../db/client"
import { profiles } from "../db/schema"

function getUserDisplayName(user: User) {
	const metadata = user.user_metadata ?? {}

	return (
		metadata.user_name ??
		metadata.preferred_username ??
		metadata.name ??
		metadata.full_name ??
		user.email?.split("@")[0] ??
		"user"
	)
}

function getUsername(user: User) {
	const normalized = getUserDisplayName(user)
		.toString()
		.toLowerCase()
		.replace(/[^a-z0-9_]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 17)

	const base = normalized || "user"
	const suffix = user.id.replaceAll("-", "")

	return `${base}-${suffix}`
}

function getAvatarUrl(user: User) {
	const metadata = user.user_metadata ?? {}
	const avatarUrl = metadata.avatar_url ?? metadata.picture

	if (typeof avatarUrl !== "string" || !avatarUrl) {
		return null
	}

	return avatarUrl
}

export async function syncProfile(user: User) {
	const [existingProfile] = await db
		.select({ id: profiles.id, isBanned: profiles.isBanned })
		.from(profiles)
		.where(eq(profiles.id, user.id))
		.limit(1)
	const avatarUrl = getAvatarUrl(user)
	const updatedAt = new Date()

	if (existingProfile) {
		const [profile] = await db
			.update(profiles)
			.set({
				avatarUrl,
				updatedAt,
			})
			.where(eq(profiles.id, user.id))
			.returning({ id: profiles.id, isBanned: profiles.isBanned })
		return profile ?? existingProfile
	}

	const [profile] = await db
		.insert(profiles)
		.values({
			id: user.id,
			username: getUsername(user),
			avatarUrl,
			updatedAt,
		})
		.onConflictDoUpdate({
			target: profiles.id,
			set: {
				avatarUrl,
				updatedAt,
			},
		})
		.returning({ id: profiles.id, isBanned: profiles.isBanned })

	return profile
}
