import { relations, sql } from "drizzle-orm"
import {
	boolean,
	check,
	integer,
	pgSchema,
	pgTable,
	serial,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"

export const authSchema = pgSchema("auth")

export const authUsers = authSchema.table("users", {
	id: uuid("id").primaryKey().notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	encryptedPassword: varchar("encrypted_password", { length: 255 }),
	emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true }),
	lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
})

export const profiles = pgTable(
	"profiles",
	{
		id: uuid("id")
			.primaryKey()
			.notNull()
			.references(() => authUsers.id, { onDelete: "cascade" }),
		username: varchar("username", { length: 50 }).notNull().unique(),
		avatarUrl: varchar("avatar_url", { length: 500 }),
		bio: text("bio"),
		role: varchar("role", { length: 20 }).notNull().default("user"),
		points: integer("points").notNull().default(0),
		karma: integer("karma").notNull().default(0),
		isBanned: boolean("is_banned").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		check("profiles_role_check", sql`${table.role} in ('user', 'admin')`),
	],
)

export const games = pgTable("games", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 150 }).notNull().unique(),
	slug: varchar("slug", { length: 150 }).notNull().unique(),
	coverUrl: varchar("cover_url", { length: 500 }),
	genre: varchar("genre", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export const challenges = pgTable(
	"challenges",
	{
		id: serial("id").primaryKey(),
		slug: varchar("slug", { length: 200 }).notNull().unique(),
		title: varchar("title", { length: 150 }).notNull(),
		description: text("description").notNull(),
		rules: text("rules").notNull(),
		difficulty: varchar("difficulty", { length: 20 }),
		youtubeUrl: varchar("youtube_url", { length: 500 }),
		rewardPoints: integer("reward_points").notNull().default(0),
		status: varchar("status", { length: 20 }).notNull().default("active"),
		gameId: integer("game_id")
			.notNull()
			.references(() => games.id, { onDelete: "restrict" }),
		creatorId: uuid("creator_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		check(
			"challenges_status_check",
			sql`${table.status} in ('active', 'closed', 'removed')`,
		),
		check(
			"challenges_difficulty_check",
			sql`${table.difficulty} is null or ${table.difficulty} in ('easy', 'medium', 'hard', 'extreme', 'insane')`,
		),
	],
)

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: serial("id").primaryKey(),
		profileId: uuid("profile_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		challengeId: integer("challenge_id")
			.notNull()
			.references(() => challenges.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("subscriptions_profile_challenge_unique").on(
			table.profileId,
			table.challengeId,
		),
	],
)

export const participations = pgTable(
	"participations",
	{
		id: serial("id").primaryKey(),
		profileId: uuid("profile_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		challengeId: integer("challenge_id")
			.notNull()
			.references(() => challenges.id, { onDelete: "cascade" }),
		videoUrl: varchar("video_url", { length: 500 }).notNull(),
		screenshotUrl: varchar("screenshot_url", { length: 500 }),
		description: text("description"),
		upvotes: integer("upvotes").notNull().default(0),
		downvotes: integer("downvotes").notNull().default(0),
		status: varchar("status", { length: 20 }).notNull().default("pending"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		check(
			"participations_status_check",
			sql`${table.status} in ('pending', 'validated', 'rejected', 'removed')`,
		),
	],
)

export const votes = pgTable(
	"votes",
	{
		id: serial("id").primaryKey(),
		participationId: integer("participation_id")
			.notNull()
			.references(() => participations.id, { onDelete: "cascade" }),
		profileId: uuid("profile_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		value: smallint("value").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("votes_participation_profile_unique").on(
			table.participationId,
			table.profileId,
		),
		check("votes_value_check", sql`${table.value} in (1, -1)`),
	],
)

export const badges = pgTable("badges", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	description: text("description").notNull(),
	iconUrl: varchar("icon_url", { length: 500 }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export const userBadges = pgTable(
	"user_badges",
	{
		id: serial("id").primaryKey(),
		profileId: uuid("profile_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		badgeId: integer("badge_id")
			.notNull()
			.references(() => badges.id, { onDelete: "cascade" }),
		challengeId: integer("challenge_id").references(() => challenges.id, {
			onDelete: "cascade",
		}),
		awardedAt: timestamp("awarded_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("user_badges_context_unique")
			.on(table.profileId, table.badgeId, table.challengeId)
			.where(sql`${table.challengeId} is not null`),
		uniqueIndex("user_badges_global_unique")
			.on(table.profileId, table.badgeId)
			.where(sql`${table.challengeId} is null`),
	],
)

export const reports = pgTable(
	"reports",
	{
		id: serial("id").primaryKey(),
		reporterId: uuid("reporter_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		targetType: varchar("target_type", { length: 30 }).notNull(),
		targetId: varchar("target_id", { length: 100 }).notNull(),
		reason: varchar("reason", { length: 100 }).notNull(),
		description: text("description"),
		status: varchar("status", { length: 20 }).notNull().default("open"),
		moderatorId: uuid("moderator_id").references(() => profiles.id, {
			onDelete: "set null",
		}),
		moderatorNote: text("moderator_note"),
		resolvedAt: timestamp("resolved_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		check(
			"reports_target_type_check",
			sql`${table.targetType} in ('user', 'challenge', 'participation', 'vote')`,
		),
		check(
			"reports_status_check",
			sql`${table.status} in ('open', 'reviewing', 'resolved', 'rejected')`,
		),
	],
)

export const profilesRelations = relations(profiles, ({ many, one }) => ({
	user: one(authUsers, {
		fields: [profiles.id],
		references: [authUsers.id],
	}),
	challenges: many(challenges),
	subscriptions: many(subscriptions),
	participations: many(participations),
	votes: many(votes),
	userBadges: many(userBadges),
}))

export const gamesRelations = relations(games, ({ many }) => ({
	challenges: many(challenges),
}))

export const challengesRelations = relations(challenges, ({ many, one }) => ({
	game: one(games, {
		fields: [challenges.gameId],
		references: [games.id],
	}),
	creator: one(profiles, {
		fields: [challenges.creatorId],
		references: [profiles.id],
	}),
	subscriptions: many(subscriptions),
	participations: many(participations),
	userBadges: many(userBadges),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	profile: one(profiles, {
		fields: [subscriptions.profileId],
		references: [profiles.id],
	}),
	challenge: one(challenges, {
		fields: [subscriptions.challengeId],
		references: [challenges.id],
	}),
}))

export const participationsRelations = relations(
	participations,
	({ many, one }) => ({
		profile: one(profiles, {
			fields: [participations.profileId],
			references: [profiles.id],
		}),
		challenge: one(challenges, {
			fields: [participations.challengeId],
			references: [challenges.id],
		}),
		votes: many(votes),
	}),
)

export const votesRelations = relations(votes, ({ one }) => ({
	participation: one(participations, {
		fields: [votes.participationId],
		references: [participations.id],
	}),
	profile: one(profiles, {
		fields: [votes.profileId],
		references: [profiles.id],
	}),
}))

export const badgesRelations = relations(badges, ({ many }) => ({
	userBadges: many(userBadges),
}))

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
	profile: one(profiles, {
		fields: [userBadges.profileId],
		references: [profiles.id],
	}),
	badge: one(badges, {
		fields: [userBadges.badgeId],
		references: [badges.id],
	}),
	challenge: one(challenges, {
		fields: [userBadges.challengeId],
		references: [challenges.id],
	}),
}))
