import { eq, inArray, sql } from "drizzle-orm"
import { db, sqlClient } from "../src/db/client"
import {
	authUsers,
	badges,
	challenges,
	games,
	participations,
	profiles,
	subscriptions,
	userBadges,
	votes,
} from "../src/db/schema"

const now = new Date()

const users = [
	{
		id: "10000000-0000-4000-8000-000000000001",
		email: "alex.runner@gamerchallenge.test",
		username: "AlexRunner",
		bio: "Fan de speedruns et de runs propres.",
		points: 1250,
		karma: 320,
	},
	{
		id: "10000000-0000-4000-8000-000000000002",
		email: "nina.combo@gamerchallenge.test",
		username: "NinaCombo",
		bio: "Toujours en recherche du combo parfait.",
		points: 980,
		karma: 250,
	},
	{
		id: "10000000-0000-4000-8000-000000000003",
		email: "max.pixel@gamerchallenge.test",
		username: "MaxPixel",
		bio: "Capture, montage, upload, repeat.",
		points: 760,
		karma: 180,
	},
	{
		id: "10000000-0000-4000-8000-000000000004",
		email: "jade.clutch@gamerchallenge.test",
		username: "JadeClutch",
		bio: "Les fins de match sous pression, c'est mon terrain.",
		points: 1420,
		karma: 410,
	},
	{
		id: "10000000-0000-4000-8000-000000000005",
		email: "leo.strat@gamerchallenge.test",
		username: "LeoStrat",
		bio: "Optimisation, routing et theorycraft.",
		points: 640,
		karma: 140,
	},
	{
		id: "10000000-0000-4000-8000-000000000006",
		email: "maya.aim@gamerchallenge.test",
		username: "MayaAim",
		bio: "FPS, tracking et flick shots.",
		points: 1120,
		karma: 300,
	},
	{
		id: "10000000-0000-4000-8000-000000000007",
		email: "tom.arcade@gamerchallenge.test",
		username: "TomArcade",
		bio: "Scores arcade et vieux classiques.",
		points: 520,
		karma: 115,
	},
	{
		id: "10000000-0000-4000-8000-000000000008",
		email: "sara.raid@gamerchallenge.test",
		username: "SaraRaid",
		bio: "Coordination d'equipe et challenges coop.",
		points: 890,
		karma: 225,
	},
	{
		id: "10000000-0000-4000-8000-000000000009",
		email: "enzo.drift@gamerchallenge.test",
		username: "EnzoDrift",
		bio: "Virages propres, chrono serré.",
		points: 700,
		karma: 160,
	},
	{
		id: "10000000-0000-4000-8000-000000000010",
		email: "lina.quest@gamerchallenge.test",
		username: "LinaQuest",
		bio: "RPG, exploration et completion.",
		points: 1010,
		karma: 275,
	},
] as const

const gameSeeds = [
	{
		name: "Rocket League",
		slug: "rocket-league",
		genre: "Sports",
		coverUrl:
			"https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1200&q=80",
	},
	{
		name: "Fortnite",
		slug: "fortnite",
		genre: "Battle Royale",
		coverUrl:
			"https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&w=1200&q=80",
	},
	{
		name: "Minecraft",
		slug: "minecraft",
		genre: "Sandbox",
		coverUrl:
			"https://images.unsplash.com/photo-1607513746994-51f730a44832?auto=format&fit=crop&w=1200&q=80",
	},
	{
		name: "Valorant",
		slug: "valorant",
		genre: "Tactical FPS",
		coverUrl:
			"https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
	},
	{
		name: "Mario Kart 8 Deluxe",
		slug: "mario-kart-8-deluxe",
		genre: "Racing",
		coverUrl:
			"https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
	},
] as const

const challengeSeeds = [
	{
		slug: "rocket-league-air-dribble-30s",
		title: "Air dribble de 30 secondes",
		description: "Garde le ballon en l'air le plus longtemps possible.",
		rules: "Mode entrainement libre. La video doit montrer le timer complet.",
		difficulty: "hard",
		youtubeUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
		rewardPoints: 250,
		status: "active",
		gameSlug: "rocket-league",
		creatorUsername: "AlexRunner",
	},
	{
		slug: "fortnite-no-build-top-3",
		title: "Top 3 sans construction",
		description: "Atteins le top 3 sans utiliser de construction.",
		rules: "Partie solo uniquement. Toute construction annule la tentative.",
		difficulty: "extreme",
		youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
		rewardPoints: 300,
		status: "active",
		gameSlug: "fortnite",
		creatorUsername: "JadeClutch",
	},
	{
		slug: "minecraft-diamond-under-15",
		title: "Diamant en moins de 15 minutes",
		description: "Trouve un diamant le plus rapidement possible en survie.",
		rules: "Seed aleatoire, pas de commandes, inventaire visible a la fin.",
		difficulty: "medium",
		youtubeUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
		rewardPoints: 220,
		status: "active",
		gameSlug: "minecraft",
		creatorUsername: "LeoStrat",
	},
	{
		slug: "valorant-guardian-only",
		title: "Round Guardian only",
		description: "Gagne un round avec uniquement le Guardian.",
		rules: "Aucune autre arme autorisee, competences autorisees.",
		difficulty: "hard",
		youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		rewardPoints: 180,
		status: "active",
		gameSlug: "valorant",
		creatorUsername: "MayaAim",
	},
	{
		slug: "mario-kart-rainbow-road-clean-lap",
		title: "Tour propre sur Route Arc-en-ciel",
		description: "Termine un tour sans chute et sans collision majeure.",
		rules: "150cc minimum. Replay ou capture complete du tour obligatoire.",
		difficulty: "easy",
		youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
		rewardPoints: 200,
		status: "active",
		gameSlug: "mario-kart-8-deluxe",
		creatorUsername: "EnzoDrift",
	},
	{
		slug: "rocket-league-zero-second-goal",
		title: "But a zero seconde",
		description: "Marque alors que le chrono affiche zero.",
		rules:
			"Match en ligne ou prive. Le score et le chrono doivent etre visibles.",
		difficulty: "insane",
		youtubeUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
		rewardPoints: 350,
		status: "active",
		gameSlug: "rocket-league",
		creatorUsername: "NinaCombo",
	},
	{
		slug: "minecraft-nether-speed-bridge",
		title: "Pont du Nether express",
		description:
			"Traverse 80 blocs dans le Nether avec un pont construit a la main.",
		rules: "Survie uniquement. Pas de fly, pas de commandes.",
		difficulty: "medium",
		youtubeUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
		rewardPoints: 210,
		status: "active",
		gameSlug: "minecraft",
		creatorUsername: "SaraRaid",
	},
	{
		slug: "valorant-one-tap-clutch",
		title: "Clutch one tap",
		description: "Remporte une situation 1v2 avec deux tirs dans la tete.",
		rules: "La capture doit inclure le kill feed et le round gagne.",
		difficulty: "extreme",
		youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		rewardPoints: 320,
		status: "active",
		gameSlug: "valorant",
		creatorUsername: "JadeClutch",
	},
	{
		slug: "fortnite-pistol-only-win",
		title: "Victoire pistolet uniquement",
		description: "Gagne une partie en utilisant seulement des pistolets.",
		rules: "Solo uniquement. Les grenades et explosifs sont interdits.",
		difficulty: "insane",
		youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
		rewardPoints: 450,
		status: "active",
		gameSlug: "fortnite",
		creatorUsername: "TomArcade",
	},
	{
		slug: "mario-kart-blue-shell-recovery",
		title: "Retour apres carapace bleue",
		description: "Subis une carapace bleue puis termine quand meme premier.",
		rules: "Course complete requise. Difficulté 150cc minimum.",
		difficulty: "hard",
		youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
		rewardPoints: 280,
		status: "active",
		gameSlug: "mario-kart-8-deluxe",
		creatorUsername: "LinaQuest",
	},
] as const

const badgeSeeds = [
	{
		name: "Premier defi",
		description: "A soumis sa premiere participation.",
		iconUrl:
			"https://api.dicebear.com/9.x/shapes/svg?seed=first-challenge&backgroundColor=7c3aed",
	},
	{
		name: "Speedrunner",
		description: "A valide un challenge chronometre.",
		iconUrl:
			"https://api.dicebear.com/9.x/shapes/svg?seed=speedrunner&backgroundColor=4edea3",
	},
	{
		name: "Clutch Master",
		description: "A reussi un challenge sous pression.",
		iconUrl:
			"https://api.dicebear.com/9.x/shapes/svg?seed=clutch-master&backgroundColor=ff5470",
	},
	{
		name: "Top du classement",
		description: "A atteint la premiere place du classement general.",
		iconUrl: "https://cdn.gamerchallenge.test/badges/top-leaderboard.svg",
	},
] as const

const participationSeeds = [
	{
		username: "NinaCombo",
		challengeSlug: "rocket-league-air-dribble-30s",
		videoUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
		screenshotUrl:
			"https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1200&q=80",
		description: "Run stable avec controle mural au depart.",
		upvotes: 18,
		downvotes: 1,
		status: "validated",
	},
	{
		username: "JadeClutch",
		challengeSlug: "valorant-one-tap-clutch",
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		screenshotUrl:
			"https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
		description: "Deux headshots propres en fin de round.",
		upvotes: 31,
		downvotes: 2,
		status: "validated",
	},
	{
		username: "LeoStrat",
		challengeSlug: "minecraft-diamond-under-15",
		videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
		screenshotUrl:
			"https://images.unsplash.com/photo-1607513746994-51f730a44832?auto=format&fit=crop&w=1200&q=80",
		description: "Diamant trouve a 12:48 avec seed aleatoire.",
		upvotes: 14,
		downvotes: 0,
		status: "validated",
	},
	{
		username: "EnzoDrift",
		challengeSlug: "mario-kart-rainbow-road-clean-lap",
		videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
		screenshotUrl:
			"https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
		description: "Tour propre en 150cc.",
		upvotes: 11,
		downvotes: 1,
		status: "pending",
	},
	{
		username: "MayaAim",
		challengeSlug: "valorant-guardian-only",
		videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
		screenshotUrl:
			"https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
		description: "Round gagne avec Guardian uniquement.",
		upvotes: 22,
		downvotes: 3,
		status: "validated",
	},
	{
		username: "TomArcade",
		challengeSlug: "fortnite-no-build-top-3",
		videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
		screenshotUrl:
			"https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&w=1200&q=80",
		description: "Top 2 sans construire.",
		upvotes: 9,
		downvotes: 2,
		status: "pending",
	},
] as const

const avatarUrl = (username: string) =>
	`https://api.dicebear.com/9.x/pixel-art/svg?seed=${username}`

const toMap = <T, K extends string | number>(
	items: T[],
	getKey: (item: T) => K,
) => new Map(items.map((item) => [getKey(item), item]))

const seedParticipationKey = (profileId: string, challengeId: number) =>
	`${profileId}:${challengeId}`

await db
	.insert(authUsers)
	.values(
		users.map((user) => ({
			id: user.id,
			email: user.email,
			encryptedPassword: "seeded-password",
			emailConfirmedAt: now,
			lastSignInAt: now,
			createdAt: now,
			updatedAt: now,
		})),
	)
	.onConflictDoNothing()

await db
	.insert(profiles)
	.values(
		users.map((user, index) => ({
			id: user.id,
			username: user.username,
			avatarUrl: avatarUrl(user.username),
			bio: user.bio,
			role: index === 0 ? "admin" : "user",
			points: user.points,
			karma: user.karma,
			isBanned: false,
			createdAt: now,
			updatedAt: now,
		})),
	)
	.onConflictDoUpdate({
		target: profiles.id,
		set: {
			avatarUrl: sql`excluded.avatar_url`,
			bio: sql`excluded.bio`,
			isBanned: sql`excluded.is_banned`,
			karma: sql`excluded.karma`,
			points: sql`excluded.points`,
			role: sql`excluded.role`,
			updatedAt: now,
			username: sql`excluded.username`,
		},
	})

await db
	.insert(games)
	.values([...gameSeeds])
	.onConflictDoUpdate({
		target: games.slug,
		set: {
			coverUrl: sql`excluded.cover_url`,
			genre: sql`excluded.genre`,
			name: sql`excluded.name`,
		},
	})
await db
	.insert(badges)
	.values([...badgeSeeds])
	.onConflictDoUpdate({
		target: badges.name,
		set: {
			description: sql`excluded.description`,
			iconUrl: sql`excluded.icon_url`,
		},
	})

const storedGames = await db.select().from(games)
const storedProfiles = await db.select().from(profiles)
const gamesBySlug = toMap(storedGames, (game) => game.slug)
const profilesByUsername = toMap(storedProfiles, (profile) => profile.username)

await db
	.insert(challenges)
	.values(
		challengeSeeds.map((challenge) => {
			const game = gamesBySlug.get(challenge.gameSlug)
			const creator = profilesByUsername.get(challenge.creatorUsername)

			if (!game || !creator) {
				throw new Error(`Missing seed relation for challenge ${challenge.slug}`)
			}

			return {
				slug: challenge.slug,
				title: challenge.title,
				description: challenge.description,
				rules: challenge.rules,
				difficulty: challenge.difficulty,
				youtubeUrl: challenge.youtubeUrl,
				rewardPoints: challenge.rewardPoints,
				status: challenge.status,
				gameId: game.id,
				creatorId: creator.id,
				createdAt: now,
				updatedAt: now,
			}
		}),
	)
	.onConflictDoUpdate({
		target: challenges.slug,
		set: {
			creatorId: sql`excluded.creator_id`,
			description: sql`excluded.description`,
			difficulty: sql`excluded.difficulty`,
			gameId: sql`excluded.game_id`,
			rewardPoints: sql`excluded.reward_points`,
			rules: sql`excluded.rules`,
			status: sql`excluded.status`,
			title: sql`excluded.title`,
			updatedAt: now,
			youtubeUrl: sql`excluded.youtube_url`,
		},
	})

const storedChallenges = await db.select().from(challenges)
const challengesBySlug = toMap(storedChallenges, (challenge) => challenge.slug)
const getSeedChallenge = (slug: string) => {
	const challenge = challengesBySlug.get(slug)

	if (!challenge) {
		throw new Error(`Missing seed challenge ${slug}`)
	}

	return challenge
}
const getSeedProfile = (username: string) => {
	const profile = profilesByUsername.get(username)

	if (!profile) {
		throw new Error(`Missing seed profile ${username}`)
	}

	return profile
}

await db
	.insert(subscriptions)
	.values(
		users.flatMap((user, index) =>
			challengeSeeds.slice(index % 4, (index % 4) + 3).map((challenge) => {
				const storedChallenge = getSeedChallenge(challenge.slug)

				return {
					profileId: user.id,
					challengeId: storedChallenge.id,
					createdAt: now,
				}
			}),
		),
	)
	.onConflictDoNothing()

const seedChallengeIds = challengeSeeds.map((challenge) =>
	getSeedChallenge(challenge.slug),
)
const existingSeedParticipations = await db
	.select()
	.from(participations)
	.where(
		inArray(
			participations.challengeId,
			seedChallengeIds.map((challenge) => challenge.id),
		),
	)
const participationsBySeedKey = toMap(
	existingSeedParticipations,
	(participation) =>
		seedParticipationKey(participation.profileId, participation.challengeId),
)
const upsertedParticipationIds: number[] = []

for (const participation of participationSeeds) {
	const profile = getSeedProfile(participation.username)
	const challenge = getSeedChallenge(participation.challengeSlug)
	const key = seedParticipationKey(profile.id, challenge.id)
	const existingParticipation = participationsBySeedKey.get(key)
	const values = {
		description: participation.description,
		downvotes: participation.downvotes,
		screenshotUrl: participation.screenshotUrl,
		status: participation.status,
		upvotes: participation.upvotes,
		updatedAt: now,
		videoUrl: participation.videoUrl,
	}

	if (existingParticipation) {
		await db
			.update(participations)
			.set(values)
			.where(eq(participations.id, existingParticipation.id))
		upsertedParticipationIds.push(existingParticipation.id)
		continue
	}

	const [createdParticipation] = await db
		.insert(participations)
		.values({
			...values,
			challengeId: challenge.id,
			createdAt: now,
			profileId: profile.id,
		})
		.returning({ id: participations.id })

	if (!createdParticipation) {
		throw new Error(`Unable to create participation ${participation.videoUrl}`)
	}

	upsertedParticipationIds.push(createdParticipation.id)
}

const storedParticipations = await db
	.select()
	.from(participations)
	.where(inArray(participations.id, upsertedParticipationIds))
const upsertedParticipationsBySeedKey = toMap(
	storedParticipations,
	(participation) =>
		seedParticipationKey(participation.profileId, participation.challengeId),
)

await db
	.insert(votes)
	.values(
		participationSeeds.flatMap((participation, index) => {
			const profile = getSeedProfile(participation.username)
			const challenge = getSeedChallenge(participation.challengeSlug)
			const storedParticipation = upsertedParticipationsBySeedKey.get(
				seedParticipationKey(profile.id, challenge.id),
			)

			if (!storedParticipation) {
				throw new Error(`Missing seed participation ${participation.videoUrl}`)
			}

			return users.slice(0, 5).map((user, voteIndex) => ({
				participationId: storedParticipation.id,
				profileId: user.id,
				value: (voteIndex + index) % 5 === 0 ? -1 : 1,
				createdAt: now,
			}))
		}),
	)
	.onConflictDoNothing()

const storedBadges = await db.select().from(badges)
const badgesByName = toMap(storedBadges, (badge) => badge.name)
const firstChallengeBadge = badgesByName.get("Premier defi")
const speedrunnerBadge = badgesByName.get("Speedrunner")
const clutchBadge = badgesByName.get("Clutch Master")

if (!firstChallengeBadge || !speedrunnerBadge || !clutchBadge) {
	throw new Error("Missing seed badges")
}

await db
	.insert(userBadges)
	.values([
		{
			profileId: users[1].id,
			badgeId: firstChallengeBadge.id,
			challengeId: getSeedChallenge("rocket-league-air-dribble-30s").id,
			awardedAt: now,
		},
		{
			profileId: users[2].id,
			badgeId: speedrunnerBadge.id,
			challengeId: getSeedChallenge("minecraft-diamond-under-15").id,
			awardedAt: now,
		},
		{
			profileId: users[3].id,
			badgeId: clutchBadge.id,
			challengeId: getSeedChallenge("valorant-one-tap-clutch").id,
			awardedAt: now,
		},
		{
			profileId: users[5].id,
			badgeId: firstChallengeBadge.id,
			challengeId: getSeedChallenge("valorant-guardian-only").id,
			awardedAt: now,
		},
	])
	.onConflictDoNothing()

await sqlClient.end()

console.info(
	"Seed completed: users, games, challenges and related data are ready.",
)
