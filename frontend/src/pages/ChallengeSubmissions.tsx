import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { Avatar, Button, PointsBadge } from "../components/reusable"
import VoteButtons from "../components/VoteButtons/VoteButtons"
import { api } from "../lib/api"
import type { Challenge, Submission } from "../types/challenge"

export default function ChallengeSubmissionsPage() {
	const { id } = useParams<{ id: string }>()
	const [challenge, setChallenge] = useState<Challenge | null>(null)
	const [challengeLoading, setChallengeLoading] = useState(true)
	const [challengeError, setChallengeError] = useState<string | null>(null)
	const [submissions, setSubmissions] = useState<Submission[]>([])
	const [submissionsLoading, setSubmissionsLoading] = useState(true)
	const [submissionsError, setSubmissionsError] = useState(false)

	useEffect(() => {
		if (!id) return

		setChallengeLoading(true)
		setChallengeError(null)

		api
			.getChallenge(id)
			.then((res) => {
				if (!res.ok) throw new Error("Challenge introuvable")
				return res.json()
			})
			.then((data: Challenge) => setChallenge(data))
			.catch((error: Error) => setChallengeError(error.message))
			.finally(() => setChallengeLoading(false))
	}, [id])

	useEffect(() => {
		if (!id) return

		setSubmissionsLoading(true)
		setSubmissionsError(false)

		api
			.getChallengeSubmissions(id)
			.then((res) => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then((data: unknown) => {
				if (Array.isArray(data)) setSubmissions(data as Submission[])
			})
			.catch(() => setSubmissionsError(true))
			.finally(() => setSubmissionsLoading(false))
	}, [id])

	if (challengeLoading) {
		return (
			<div className="flex min-h-[60svh] items-center justify-center px-md">
				<div className="glass-panel rounded-xl p-xl text-on-surface-variant">
					Chargement...
				</div>
			</div>
		)
	}

	if (challengeError || !challenge) {
		return (
			<div className="flex min-h-[60svh] items-center justify-center px-md">
				<div className="rounded-xl border border-error/30 bg-error-container/20 p-xl text-error">
					{challengeError ?? "Challenge introuvable"}
				</div>
			</div>
		)
	}

	const coverUrl = challenge.game.coverUrl ?? undefined

	return (
		<div className="flex flex-col">
			<section className="relative overflow-hidden border-b border-white/10 py-xl">
				<div className="absolute inset-0">
					{coverUrl ? (
						<img
							src={coverUrl}
							alt={challenge.game.name}
							className="h-full w-full object-cover opacity-20"
						/>
					) : (
						<div className="h-full w-full bg-surface-container-lowest" />
					)}
					<div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/92 to-background" />
					<div className="kinetic-grid" />
				</div>

				<div className="relative z-10 mx-auto flex w-full max-w-container-max flex-col gap-lg px-md md:px-xl">
					<Link
						to={`/challenges/${challenge.id}`}
						className="inline-flex w-fit items-center gap-sm rounded-lg border border-white/10 bg-surface-container/70 px-md py-sm text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
					>
						<span className="material-symbols-outlined text-[18px]">
							arrow_back
						</span>
						Back to challenge
					</Link>

					<div className="grid grid-cols-1 gap-lg lg:grid-cols-[1fr_auto] lg:items-end">
						<div>
							<p className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
								Community proof thread
							</p>
							<h1 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
								{challenge.title}
							</h1>
							<p className="mt-sm max-w-[48rem] text-on-surface-variant">
								All submitted proofs for this challenge, newest first.
							</p>
						</div>
						<div className="flex flex-wrap gap-sm">
							<span className="rounded-full border border-primary/40 bg-primary-container/20 px-md py-sm font-caption text-caption uppercase tracking-[0.05em] text-primary">
								{submissions.length} submissions
							</span>
							<PointsBadge points={challenge.rewardPoints} />
						</div>
					</div>
				</div>
			</section>

			<div className="mx-auto grid w-full max-w-container-max grid-cols-1 gap-xl px-md py-xl md:px-xl lg:grid-cols-12">
				<main className="min-w-0 lg:col-span-8">
					<div className="mb-lg flex items-center justify-between gap-md border-b border-white/10 pb-sm">
						<h2 className="flex items-center gap-sm font-h2 text-h2 text-on-surface">
							<span className="material-symbols-outlined text-primary">
								forum
							</span>
							Submissions
						</h2>
						<span className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
							Newest first
						</span>
					</div>

					{submissionsError ? (
						<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
							Impossible de charger les submissions.
						</div>
					) : submissionsLoading ? (
						<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
							Chargement des submissions...
						</div>
					) : submissions.length > 0 ? (
						<div className="space-y-lg">
							{submissions.map((submission, index) => (
								<SubmissionThreadItem
									key={submission.id}
									submission={submission}
									index={index}
								/>
							))}
						</div>
					) : (
						<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
							Aucune submission pour ce challenge.
						</div>
					)}
				</main>

				<aside className="lg:col-span-4">
					<div className="glass-panel sticky top-[96px] rounded-xl p-lg">
						<h2 className="font-h3 text-h3 text-on-surface">Mission Context</h2>
						<p className="mt-sm text-on-surface-variant">
							{challenge.description}
						</p>
						<div className="mt-lg space-y-md">
							<ContextRow
								icon="stadia_controller"
								label="Game"
								value={challenge.game.name}
							/>
							<ContextRow
								icon="local_fire_department"
								label="Difficulty"
								value={challenge.difficulty ?? "Challenge"}
							/>
							<ContextRow
								icon="calendar_month"
								label="Created"
								value={formatDate(challenge.createdAt)}
							/>
						</div>
						<Link to={`/challenges/${challenge.id}`} className="mt-lg flex">
							<Button variant="secondary" className="w-full">
								Open Challenge
							</Button>
						</Link>
					</div>
				</aside>
			</div>
		</div>
	)
}

function SubmissionThreadItem({
	submission,
	index,
}: {
	submission: Submission
	index: number
}) {
	const embedUrl = getYouTubeEmbedUrl(submission.videoUrl)
	const score = submission.upvotes - submission.downvotes

	return (
		<article className="glass-panel overflow-hidden rounded-xl">
			<div className="grid grid-cols-1 sm:grid-cols-[72px_1fr]">
				<div className="hidden border-white/10 bg-surface-container-lowest/40 p-md sm:flex sm:flex-col sm:items-center sm:gap-sm sm:border-r">
					<span className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
						#{index + 1}
					</span>
					<span className="font-h3 text-h3 text-tertiary">
						{score.toLocaleString()}
					</span>
					<span className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
						score
					</span>
				</div>

				<div className="min-w-0 p-md md:p-lg">
					<div className="flex flex-col justify-between gap-md md:flex-row md:items-center">
						<div className="flex min-w-0 items-center gap-sm">
							<Avatar
								size="sm"
								src={submission.player.avatarUrl ?? undefined}
								alt={submission.player.username}
							/>
							<div className="min-w-0">
								<p className="truncate font-semibold text-on-surface">
									{submission.player.username}
								</p>
								<p className="font-caption text-caption text-on-surface-variant">
									{formatDate(submission.createdAt)}
								</p>
							</div>
						</div>
						<div className="flex items-center justify-between gap-md">
							<span className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary sm:hidden">
								{score.toLocaleString()} score
							</span>
							<VoteButtons
								participationId={submission.id}
								initialUpvotes={submission.upvotes}
								initialDownvotes={submission.downvotes}
								userVote={submission.userVote}
							/>
						</div>
					</div>

					<div className="mt-md overflow-hidden rounded-lg border border-white/10 bg-surface-container-lowest">
						{embedUrl ? (
							<iframe
								src={embedUrl}
								title={`Proof by ${submission.player.username}`}
								className="aspect-video w-full"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
								allowFullScreen
							/>
						) : (
							<a
								href={submission.videoUrl}
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

					<p className="mt-md rounded-lg border border-white/5 bg-surface-container/50 p-md text-sm leading-relaxed text-on-surface-variant">
						{submission.description || "No description provided."}
					</p>

					<div className="mt-md flex justify-end">
						<a
							href={submission.videoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-xs text-sm font-semibold text-primary transition-colors hover:text-tertiary"
						>
							Open source video
							<span className="material-symbols-outlined text-[18px]">
								open_in_new
							</span>
						</a>
					</div>
				</div>
			</div>
		</article>
	)
}

function ContextRow({
	icon,
	label,
	value,
}: {
	icon: string
	label: string
	value: string
}) {
	return (
		<div className="flex items-center gap-md rounded-lg border border-white/10 bg-surface-container/50 p-md">
			<span className="material-symbols-outlined text-primary">{icon}</span>
			<div>
				<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
					{label}
				</p>
				<p className="font-semibold text-on-surface">{value}</p>
			</div>
		</div>
	)
}

function getYouTubeEmbedUrl(url: string) {
	try {
		const parsed = new URL(url)
		if (parsed.hostname.includes("youtube.com")) {
			const id = parsed.searchParams.get("v")
			return id ? `https://www.youtube.com/embed/${id}` : null
		}
		if (parsed.hostname.includes("youtu.be")) {
			const id = parsed.pathname.replace("/", "")
			return id ? `https://www.youtube.com/embed/${id}` : null
		}
	} catch {
		return null
	}

	return null
}

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}
