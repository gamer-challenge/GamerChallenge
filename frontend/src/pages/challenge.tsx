import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import {
	Avatar,
	Button,
	Leaderboard,
	ParticipationModal,
	PointsBadge,
} from "../components/reusable"
import VoteButtons from "../components/VoteButtons/VoteButtons"
import { api } from "../lib/api"
import type { Challenge, Submission } from "../types/challenge"

type ChallengeLeaderboardEntry = {
	id: number
	score: number
	player: {
		id: string
		username: string
		avatarUrl: string | null
	}
}

type ParticipantPreview = {
	id: string
	username: string
	avatarUrl: string | null
}

export default function ChallengePage() {
	const [open, setOpen] = useState(false)
	const { id } = useParams<{ id: string }>()
	const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>(
		[],
	)
	const [leaderboardError, setLeaderboardError] = useState(false)
	const [challenge, setChallenge] = useState<Challenge | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [submissions, setSubmissions] = useState<Submission[]>([])
	const [submissionsError, setSubmissionsError] = useState(false)

	useEffect(() => {
		if (!id) return

		api
			.getChallengeLeaderboard(id)
			.then((res) => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then((data: unknown) => {
				if (Array.isArray(data)) setLeaderboard(data)
			})
			.catch(() => setLeaderboardError(true))
	}, [id])

	useEffect(() => {
		if (!id) return
		api
			.getChallenge(id)
			.then((res) => {
				if (!res.ok) throw new Error("Challenge introuvable")
				return res.json()
			})
			.then((data: Challenge) => setChallenge(data))
			.catch((err: Error) => setError(err.message))
			.finally(() => setLoading(false))
	}, [id])

	useEffect(() => {
		if (!id) return
		api
			.getChallengeSubmissions(id)
			.then((res) => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then((data: unknown) => {
				if (Array.isArray(data)) setSubmissions(data)
			})
			.catch(() => setSubmissionsError(true))
	}, [id])

	const rules = useMemo(() => {
		if (!challenge?.rules) return []
		return challenge.rules
			.split(/\r?\n/)
			.map((rule) => rule.replace(/^[-*]\s*/, "").trim())
			.filter(Boolean)
	}, [challenge])

	const participants = useMemo(() => {
		const uniqueParticipants = new Map<string, ParticipantPreview>()

		for (const submission of submissions) {
			uniqueParticipants.set(submission.player.id, submission.player)
		}

		for (const entry of leaderboard) {
			uniqueParticipants.set(entry.player.id, entry.player)
		}

		return [...uniqueParticipants.values()].slice(0, 5)
	}, [leaderboard, submissions])

	useEffect(() => {
		if (!challenge) return

		const previousTitle = document.title
		const metaDescription = getMetaDescriptionElement()
		const previousDescription = metaDescription.getAttribute("content")

		document.title = `${challenge.title} | Gamer Challenge`
		metaDescription.setAttribute("content", challenge.description)

		return () => {
			document.title = previousTitle
			if (previousDescription === null) {
				metaDescription.removeAttribute("content")
			} else {
				metaDescription.setAttribute("content", previousDescription)
			}
		}
	}, [challenge])

	if (loading) {
		return (
			<div className="flex min-h-[60svh] items-center justify-center px-md">
				<div className="glass-panel rounded-xl p-xl text-on-surface-variant">
					Chargement...
				</div>
			</div>
		)
	}

	if (error || !challenge) {
		return (
			<div className="flex min-h-[60svh] items-center justify-center px-md">
				<div className="rounded-xl border border-error/30 bg-error-container/20 p-xl text-error">
					{error ?? "Challenge introuvable"}
				</div>
			</div>
		)
	}

	const coverUrl = challenge.game.coverUrl ?? undefined
	const latestSubmission = submissions[0]
	const latestEmbed = latestSubmission
		? getYouTubeEmbedUrl(latestSubmission.videoUrl)
		: null
	const challengeEmbed = challenge.youtubeUrl
		? getYouTubeEmbedUrl(challenge.youtubeUrl)
		: null

	return (
		<div className="flex flex-col">
			<section className="relative flex min-h-[560px] flex-col justify-end overflow-hidden">
				<div className="absolute inset-0">
					{coverUrl ? (
						<img
							src={coverUrl}
							alt={challenge.game.name}
							className="h-full w-full object-cover opacity-75"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-surface-container-lowest">
							<span className="material-symbols-outlined text-[12rem] text-primary/20">
								sports_esports
							</span>
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-background via-background/54 to-surface/20" />
					<div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
				</div>

				<div className="relative z-10 mx-auto flex w-full max-w-container-max flex-col justify-between gap-lg px-md pb-xl md:flex-row md:items-end md:px-xl">
					<div className="max-w-[48rem]">
						<div className="mb-md flex flex-wrap gap-sm">
							<span className="rounded-full border border-primary/50 bg-primary-container/30 px-3 py-1 font-caption text-caption uppercase tracking-[0.05em] text-primary backdrop-blur-md">
								{challenge.game.name}
							</span>
							{challenge.difficulty && (
								<span className="rounded-full border border-error/40 bg-error-container/30 px-3 py-1 font-caption text-caption uppercase tracking-[0.05em] text-error backdrop-blur-md">
									{challenge.difficulty}
								</span>
							)}
							<span className="rounded-full border border-tertiary/30 bg-tertiary-container/20 px-3 py-1 font-caption text-caption uppercase tracking-[0.05em] text-tertiary backdrop-blur-md">
								{challenge.status}
							</span>
						</div>
						<h1 className="font-h1 text-h1-mobile text-on-surface md:text-h1">
							{challenge.title}
						</h1>
						<p className="mt-md max-w-[42rem] text-lead text-on-surface-variant">
							{challenge.description}
						</p>
						<div className="mt-lg flex flex-wrap items-center gap-md">
							<div className="flex items-center gap-sm">
								<Avatar
									size="md"
									src={challenge.creator.avatarUrl ?? undefined}
									alt={challenge.creator.username}
								/>
								<div>
									<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
										Created by
									</p>
									<p className="font-semibold text-on-surface">
										{challenge.creator.username}
									</p>
								</div>
							</div>
							<div className="h-9 w-px bg-white/15" />
							<div>
								<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
									Completions
								</p>
								<p className="font-semibold text-tertiary">
									{submissions.length}
								</p>
							</div>
							{participants.length > 0 && (
								<>
									<div className="h-9 w-px bg-white/15" />
									<div>
										<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
											Participants
										</p>
										<div className="mt-xs flex -space-x-2">
											{participants.map((participant) => (
												<Avatar
													key={participant.id}
													size="sm"
													src={participant.avatarUrl ?? undefined}
													alt={participant.username}
													className="ring-2 ring-background"
												/>
											))}
										</div>
									</div>
								</>
							)}
							<PointsBadge points={challenge.rewardPoints} />
						</div>
					</div>

					<div className="w-full shrink-0 md:w-auto">
						<Button
							size="lg"
							className="w-full md:w-auto"
							onClick={() => setOpen(true)}
						>
							<span className="material-symbols-outlined">flag</span>
							Accept Challenge
						</Button>
						<p className="pt-sm text-center font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
							Requires video proof
						</p>
					</div>
				</div>
			</section>

			<ParticipationModal
				visible={open}
				onClose={() => setOpen(false)}
				challengeId={challenge.id}
				challengeTitle={challenge.title}
				challengeGame={challenge.game.name}
				challengeImage={challenge.game.coverUrl}
			/>

			<div className="mx-auto grid w-full max-w-container-max grid-cols-1 gap-xl px-md py-xl md:px-xl lg:grid-cols-12">
				<div className="flex flex-col gap-xl lg:col-span-8">
					<section className="glass-panel rounded-xl p-lg md:p-xl">
						<h2 className="mb-lg flex items-center gap-sm border-b border-white/10 pb-sm font-h2 text-h2 text-on-surface">
							<span className="material-symbols-outlined text-primary">
								gavel
							</span>
							Rules of Engagement
						</h2>
						{rules.length > 0 ? (
							<ul className="space-y-md">
								{rules.map((rule, index) => (
									<li key={rule} className="flex items-start gap-md">
										<span
											className={`material-symbols-outlined mt-0.5 ${
												index % 3 === 0 ? "text-error" : "text-tertiary"
											}`}
										>
											{index % 3 === 0 ? "close" : "check"}
										</span>
										<p className="text-on-surface-variant">{rule}</p>
									</li>
								))}
							</ul>
						) : (
							<p className="text-on-surface-variant">
								No custom rules were provided for this challenge.
							</p>
						)}
					</section>

					<section className="glass-panel rounded-xl p-lg md:p-xl">
						<Link
							to={`/challenges/${challenge.id}/submissions`}
							className="group mb-lg flex items-center justify-between gap-md border-b border-white/10 pb-sm transition-colors hover:text-primary"
							aria-label="Open all proof submissions"
						>
							<h2 className="flex min-w-0 items-center gap-sm font-h2 text-h2 text-on-surface transition-colors group-hover:text-primary">
								<span className="material-symbols-outlined text-primary">
									movie
								</span>
								Latest Proof
								<span className="material-symbols-outlined text-[28px] text-primary transition-transform duration-300 motion-safe:animate-pulse group-hover:translate-x-1">
									arrow_forward
								</span>
							</h2>
							<span className="font-caption text-caption uppercase tracking-[0.05em] text-primary">
								{submissions.length} submissions
							</span>
						</Link>

						{submissionsError ? (
							<p className="text-on-surface-variant">
								Impossible de charger les submissions.
							</p>
						) : latestSubmission ? (
							<div className="space-y-md">
								<div className="overflow-hidden rounded-lg border border-white/10 bg-surface-container-lowest">
									{latestEmbed ? (
										<iframe
											src={latestEmbed}
											title="Latest proof video"
											className="aspect-video w-full"
											allowFullScreen
										/>
									) : (
										<a
											href={latestSubmission.videoUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex aspect-video items-center justify-center bg-surface-container-high text-primary"
										>
											<span className="material-symbols-outlined mr-sm text-4xl">
												play_circle
											</span>
											Open proof video
										</a>
									)}
								</div>
								<div className="flex flex-col justify-between gap-md md:flex-row md:items-center">
									<div className="flex items-center gap-sm">
										<Avatar
											size="sm"
											src={latestSubmission.player.avatarUrl ?? undefined}
											alt={latestSubmission.player.username}
										/>
										<div>
											<p className="font-semibold text-on-surface">
												{latestSubmission.player.username}
											</p>
											<p className="font-caption text-caption text-on-surface-variant">
												{formatDate(latestSubmission.createdAt)}
											</p>
										</div>
									</div>
									<VoteButtons
										participationId={latestSubmission.id}
										initialUpvotes={latestSubmission.upvotes}
										initialDownvotes={latestSubmission.downvotes}
										userVote={latestSubmission.userVote}
									/>
								</div>
								{latestSubmission.description && (
									<p className="rounded-lg border border-white/5 bg-surface-container/50 p-md text-sm text-on-surface-variant">
										{latestSubmission.description}
									</p>
								)}
							</div>
						) : (
							<p className="text-on-surface-variant">
								Aucune submission pour ce challenge.
							</p>
						)}
					</section>

					<section className="glass-panel rounded-xl p-lg md:p-xl">
						<h2 className="mb-lg flex items-center gap-sm border-b border-white/10 pb-sm font-h2 text-h2 text-on-surface">
							<span className="material-symbols-outlined text-primary">
								description
							</span>
							Mission Briefing
						</h2>
						<p className="whitespace-pre-line text-on-surface-variant">
							{challenge.description}
						</p>
						<div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-3">
							<StatTile
								label="Game"
								value={challenge.game.name}
								icon="stadia_controller"
							/>
							<StatTile
								label="Reward"
								value={`${challenge.rewardPoints.toLocaleString()} XP`}
								icon="stars"
							/>
							<StatTile
								label="Created"
								value={formatDate(challenge.createdAt)}
								icon="calendar_month"
							/>
						</div>
					</section>

					{challenge.youtubeUrl && (
						<section className="glass-panel rounded-xl p-lg md:p-xl">
							<h2 className="mb-lg flex items-center gap-sm border-b border-white/10 pb-sm font-h2 text-h2 text-on-surface">
								<span className="material-symbols-outlined text-primary">
									smart_display
								</span>
								Challenge Video
							</h2>
							<div className="overflow-hidden rounded-lg border border-white/10 bg-surface-container-lowest">
								{challengeEmbed ? (
									<iframe
										src={challengeEmbed}
										title={`${challenge.title} video`}
										className="aspect-video w-full"
										allowFullScreen
									/>
								) : (
									<a
										href={challenge.youtubeUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex aspect-video items-center justify-center bg-surface-container-high text-primary"
									>
										<span className="material-symbols-outlined mr-sm text-4xl">
											open_in_new
										</span>
										Open challenge video
									</a>
								)}
							</div>
						</section>
					)}
				</div>

				<aside className="flex flex-col gap-xl lg:col-span-4">
					<section className="glass-panel rounded-xl p-lg">
						<h2 className="mb-md font-h3 text-h3 text-on-surface">
							Challenge Stats
						</h2>
						<div className="space-y-md">
							<ProgressStat
								label="Community proofs"
								value={submissions.length}
								max={50}
							/>
							<ProgressStat
								label="Leaderboard entries"
								value={leaderboard.length}
								max={25}
							/>
							<ProgressStat
								label="Reward tier"
								value={Math.min(challenge.rewardPoints, 10000)}
								max={10000}
							/>
						</div>
					</section>

					{leaderboardError ? (
						<div className="glass-panel rounded-xl p-lg text-on-surface-variant">
							Impossible de charger le leaderboard.
						</div>
					) : (
						<Leaderboard
							entries={leaderboard.map((entry) => ({
								id: entry.player.id,
								username: entry.player.username,
								points: entry.score,
								avatarUrl: entry.player.avatarUrl ?? undefined,
							}))}
							title="Run Rankings"
							subtitle="Best scores on this challenge"
							limit={8}
						/>
					)}
				</aside>
			</div>
		</div>
	)
}

function StatTile({
	label,
	value,
	icon,
}: {
	label: string
	value: string
	icon: string
}) {
	return (
		<div className="rounded-lg border border-white/10 bg-surface-container/50 p-md">
			<span className="material-symbols-outlined text-primary">{icon}</span>
			<p className="mt-sm font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
				{label}
			</p>
			<p className="mt-xs font-semibold text-on-surface">{value}</p>
		</div>
	)
}

function ProgressStat({
	label,
	value,
	max,
}: {
	label: string
	value: number
	max: number
}) {
	const percentage = Math.max(4, Math.min(100, Math.round((value / max) * 100)))

	return (
		<div>
			<div className="mb-xs flex justify-between gap-md font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
				<span>{label}</span>
				<span className="text-tertiary">{value.toLocaleString()}</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-surface-container-lowest">
				<div
					className="h-full rounded-full bg-gradient-to-r from-primary-container to-tertiary shadow-[0_0_10px_rgba(78,222,163,0.45)]"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	)
}

function getYouTubeEmbedUrl(url: string) {
	try {
		const parsed = new URL(url)
		const hostname = parsed.hostname.replace(/^www\./, "")

		if (
			hostname === "youtube.com" ||
			hostname.endsWith(".youtube.com") ||
			hostname === "youtube-nocookie.com" ||
			hostname.endsWith(".youtube-nocookie.com")
		) {
			if (parsed.pathname.startsWith("/embed/")) {
				const id = parsed.pathname.split("/").filter(Boolean)[1]
				return id ? `https://www.youtube.com/embed/${id}` : null
			}

			if (parsed.pathname.startsWith("/shorts/")) {
				const id = parsed.pathname.split("/").filter(Boolean)[1]
				return id ? `https://www.youtube.com/embed/${id}` : null
			}

			const id = parsed.searchParams.get("v")
			return id ? `https://www.youtube.com/embed/${id}` : null
		}

		if (hostname === "youtu.be") {
			const id = parsed.pathname.replace("/", "")
			return id ? `https://www.youtube.com/embed/${id}` : null
		}
	} catch {
		return null
	}

	return null
}

function getMetaDescriptionElement() {
	const existing = document.querySelector<HTMLMetaElement>(
		'meta[name="description"]',
	)

	if (existing) return existing

	const meta = document.createElement("meta")
	meta.name = "description"
	document.head.appendChild(meta)
	return meta
}

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}
