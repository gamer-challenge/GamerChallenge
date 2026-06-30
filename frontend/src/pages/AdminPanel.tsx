import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import Avatar from "../components/reusable/Avatar"
import Button from "../components/reusable/Button"
import Input from "../components/reusable/Input"
import { useAuth } from "../context/useAuth"
import { api } from "../lib/api"
import type { Badge, UserBadge } from "../types/badge"

type AdminUser = {
	avatarUrl: string | null
	bio: string | null
	createdAt: string
	email: string | null
	id: string
	isBanned: boolean
	karma: number
	lastSignInAt: string | null
	points: number
	role: "user" | "admin"
	updatedAt: string | null
	username: string
}

type AdminParticipation = {
	challenge: {
		id: number
		rewardPoints: number
		slug: string
		status: string
		title: string
	}
	createdAt: string
	description: string | null
	downvotes: number
	id: number
	player: {
		avatarUrl: string | null
		id: string
		isBanned: boolean
		username: string
	}
	screenshotUrl: string | null
	status: "pending" | "validated" | "rejected" | "removed"
	updatedAt: string | null
	upvotes: number
	videoUrl: string
}

type UserChallenge = {
	createdAt: string
	description: string
	difficulty: string | null
	gameId: number
	id: number
	rewardPoints: number
	slug: string
	status: "active" | "closed" | "removed"
	title: string
	updatedAt: string | null
	youtubeUrl: string | null
}

type AdminStats = {
	badges: {
		awarded: number
		total: number
	}
	challenges: {
		active: number
		closed: number
		removed: number
		total: number
	}
	participations: {
		pending: number
		rejected: number
		removed: number
		total: number
		validated: number
	}
	reports: {
		open: number
		rejected: number
		resolved: number
		reviewing: number
		total: number
	}
	users: {
		admins: number
		banned: number
		total: number
		totalKarma: number
		totalPoints: number
	}
	votes: {
		downvotes: number
		total: number
		upvotes: number
	}
}

const statFormat = new Intl.NumberFormat("fr-FR")

export default function AdminPanel() {
	const { loading: authLoading, user } = useAuth()
	const navigate = useNavigate()
	const [users, setUsers] = useState<AdminUser[]>([])
	const [badges, setBadges] = useState<Badge[]>([])
	const [stats, setStats] = useState<AdminStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [detailsLoading, setDetailsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [search, setSearch] = useState("")
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
	const [selectedBadges, setSelectedBadges] = useState<UserBadge[]>([])
	const [selectedChallenges, setSelectedChallenges] = useState<UserChallenge[]>(
		[],
	)
	const [selectedParticipations, setSelectedParticipations] = useState<
		AdminParticipation[]
	>([])
	const [detailsRefresh, setDetailsRefresh] = useState(0)
	const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
	const [savingUsernameId, setSavingUsernameId] = useState<string | null>(null)
	const [creatingBadge, setCreatingBadge] = useState(false)
	const [awardingUserId, setAwardingUserId] = useState<string | null>(null)
	const [deletingBadgeId, setDeletingBadgeId] = useState<number | null>(null)
	const [removingUserBadgeId, setRemovingUserBadgeId] = useState<number | null>(
		null,
	)
	const [deletingParticipationId, setDeletingParticipationId] = useState<
		number | null
	>(null)
	const [updatingParticipationId, setUpdatingParticipationId] = useState<
		number | null
	>(null)
	const [deletingChallengeId, setDeletingChallengeId] = useState<number | null>(
		null,
	)

	useEffect(() => {
		if (!authLoading && (!user || user.role !== "admin")) {
			navigate("/")
		}
	}, [authLoading, navigate, user])

	useEffect(() => {
		if (!user || user.role !== "admin") return
		let ignore = false

		async function loadAdminData() {
			setLoading(true)
			setError(null)

			try {
				const [statsResponse, usersResponse, badgesResponse] =
					await Promise.all([
						api.getAdminStats(),
						api.getAdminUsers({ limit: 100 }),
						api.getBadges(),
					])

				const [statsData, usersData, badgesData] = await Promise.all([
					readJson<AdminStats>(
						statsResponse,
						"Impossible de charger les stats.",
					),
					readJson<AdminUser[]>(
						usersResponse,
						"Impossible de charger les users.",
					),
					readJson<Badge[]>(
						badgesResponse,
						"Impossible de charger les badges.",
					),
				])

				if (!ignore) {
					setStats(statsData)
					setUsers(usersData)
					setBadges(badgesData)
					setSelectedUserId((current) => current ?? usersData[0]?.id ?? null)
				}
			} catch (err) {
				if (!ignore) {
					setError(err instanceof Error ? err.message : "Erreur admin.")
				}
			} finally {
				if (!ignore) setLoading(false)
			}
		}

		loadAdminData()

		return () => {
			ignore = true
		}
	}, [user])

	// biome-ignore lint/correctness/useExhaustiveDependencies: detailsRefresh intentionally refetches the selected user details after admin actions.
	useEffect(() => {
		if (!selectedUserId) {
			setSelectedBadges([])
			setSelectedChallenges([])
			setSelectedParticipations([])
			return
		}

		const userId = selectedUserId
		let ignore = false

		async function loadSelectedUserDetails() {
			setDetailsLoading(true)
			setError(null)

			try {
				const [badgesResponse, challengesResponse, participationsResponse] =
					await Promise.all([
						api.userBadges(userId),
						api.getUserChallenges(userId),
						api.getAdminParticipations({
							limit: 100,
							userId,
						}),
					])

				const [badgeRows, challengeRows, participationRows] = await Promise.all(
					[
						readJson<unknown[]>(
							badgesResponse,
							"Impossible de charger les badges du user.",
						),
						readJson<UserChallenge[]>(
							challengesResponse,
							"Impossible de charger les challenges du user.",
						),
						readJson<AdminParticipation[]>(
							participationsResponse,
							"Impossible de charger les submissions du user.",
						),
					],
				)

				if (!ignore) {
					setSelectedBadges(
						badgeRows
							.map(normalizeUserBadge)
							.filter((badge): badge is UserBadge => badge !== null),
					)
					setSelectedChallenges(challengeRows)
					setSelectedParticipations(participationRows)
				}
			} catch (err) {
				if (!ignore) {
					setError(
						err instanceof Error
							? err.message
							: "Impossible de charger le detail user.",
					)
				}
			} finally {
				if (!ignore) setDetailsLoading(false)
			}
		}

		loadSelectedUserDetails()

		return () => {
			ignore = true
		}
	}, [detailsRefresh, selectedUserId])

	const selectedUser = useMemo(
		() => users.find((adminUser) => adminUser.id === selectedUserId) ?? null,
		[selectedUserId, users],
	)

	const statCards = useMemo(() => {
		if (!stats) return []

		return [
			{
				accent: "text-primary",
				icon: "group",
				label: "Users",
				value: stats.users.total,
				meta: `${stats.users.admins} admins / ${stats.users.banned} banned`,
			},
			{
				accent: "text-tertiary",
				icon: "sports_esports",
				label: "Challenges",
				value: stats.challenges.total,
				meta: `${stats.challenges.active} active / ${stats.challenges.closed} closed`,
			},
			{
				accent: "text-warning",
				icon: "pending_actions",
				label: "Pending Proofs",
				value: stats.participations.pending,
				meta: `${stats.participations.validated} validated`,
			},
			{
				accent: "text-primary",
				icon: "military_tech",
				label: "Badges",
				value: stats.badges.total,
				meta: `${stats.badges.awarded} awarded`,
			},
			{
				accent: "text-tertiary",
				icon: "how_to_vote",
				label: "Votes",
				value: stats.votes.total,
				meta: `${stats.votes.upvotes} up / ${stats.votes.downvotes} down`,
			},
			{
				accent: "text-error",
				icon: "flag",
				label: "Reports",
				value: stats.reports.total,
				meta: `${stats.reports.open} open`,
			},
		]
	}, [stats])

	const filteredUsers = useMemo(() => {
		const query = search.trim().toLowerCase()
		if (!query) return users

		return users.filter(
			(adminUser) =>
				adminUser.username.toLowerCase().includes(query) ||
				adminUser.email?.toLowerCase().includes(query) ||
				adminUser.id.toLowerCase().includes(query),
		)
	}, [search, users])

	async function refreshStats() {
		const response = await api.getAdminStats()
		if (response.ok) {
			setStats((await response.json()) as AdminStats)
		}
	}

	function refreshSelectedDetails() {
		setDetailsRefresh((value) => value + 1)
	}

	function updateUserInList(updatedUser: Partial<AdminUser> & { id: string }) {
		setUsers((currentUsers) =>
			currentUsers.map((currentUser) =>
				currentUser.id === updatedUser.id
					? { ...currentUser, ...updatedUser }
					: currentUser,
			),
		)
	}

	async function handleBanToggle(adminUser: AdminUser) {
		setUpdatingUserId(adminUser.id)
		setNotice(null)
		setError(null)

		try {
			const nextIsBanned = !adminUser.isBanned
			const response = await api.updateAdminUserBan(adminUser.id, nextIsBanned)
			if (!response.ok) throw new Error("Impossible de modifier le ban.")

			updateUserInList({ id: adminUser.id, isBanned: nextIsBanned })
			await refreshStats()
			setNotice(
				nextIsBanned
					? `${adminUser.username} est banni.`
					: `${adminUser.username} est debanni.`,
			)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur de bannissement.")
		} finally {
			setUpdatingUserId(null)
		}
	}

	async function handleUpdateUsername(
		event: FormEvent<HTMLFormElement>,
		adminUser: AdminUser,
	) {
		event.preventDefault()
		setSavingUsernameId(adminUser.id)
		setNotice(null)
		setError(null)

		const formData = new FormData(event.currentTarget)
		const username = String(formData.get("username") ?? "").trim()

		if (!username) {
			setError("Le pseudo ne peut pas etre vide.")
			setSavingUsernameId(null)
			return
		}

		try {
			const response = await api.updateAdminUser(adminUser.id, { username })
			const updatedUser = await readJson<AdminUser>(
				response,
				"Impossible de modifier le pseudo.",
			)

			updateUserInList(updatedUser)
			setNotice(`Pseudo mis a jour pour ${updatedUser.username}.`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur pseudo.")
		} finally {
			setSavingUsernameId(null)
		}
	}

	async function handleCreateBadge(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setCreatingBadge(true)
		setNotice(null)
		setError(null)

		const form = event.currentTarget
		const formData = new FormData(form)
		const name = String(formData.get("name") ?? "").trim()
		const description = String(formData.get("description") ?? "").trim()
		const iconUrl = String(formData.get("iconUrl") ?? "").trim()

		try {
			const response = await api.createBadge({
				name,
				description,
				iconUrl: iconUrl || null,
			})
			const badge = await readJson<Badge>(
				response,
				"Impossible de creer le badge.",
			)

			setBadges((currentBadges) => [...currentBadges, badge])
			await refreshStats()
			form.reset()
			setNotice(`Badge ${badge.name} cree.`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur badge.")
		} finally {
			setCreatingBadge(false)
		}
	}

	async function handleDeleteBadge(badge: Badge) {
		if (!window.confirm(`Supprimer le badge "${badge.name}" ?`)) return

		setDeletingBadgeId(badge.id)
		setNotice(null)
		setError(null)

		try {
			const response = await api.deleteBadge(badge.id)
			if (!response.ok) throw new Error("Impossible de supprimer le badge.")

			setBadges((currentBadges) =>
				currentBadges.filter((currentBadge) => currentBadge.id !== badge.id),
			)
			setSelectedBadges((currentBadges) =>
				currentBadges.filter(
					(currentBadge) => currentBadge.badges.id !== badge.id,
				),
			)
			await refreshStats()
			setNotice(`Badge ${badge.name} supprime.`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur suppression badge.")
		} finally {
			setDeletingBadgeId(null)
		}
	}

	async function handleAwardBadge(
		event: FormEvent<HTMLFormElement>,
		adminUser: AdminUser,
	) {
		event.preventDefault()
		setAwardingUserId(adminUser.id)
		setNotice(null)
		setError(null)

		const formData = new FormData(event.currentTarget)
		const badgeName = String(formData.get("badgeName") ?? "").trim()
		const challengeIdValue = String(formData.get("challengeId") ?? "").trim()
		const challengeId = challengeIdValue ? Number(challengeIdValue) : undefined

		try {
			const response = await api.awardBadgeToUser(adminUser.id, {
				badgeName,
				...(challengeId ? { challengeId } : {}),
			})
			if (!response.ok) throw new Error("Impossible d'attribuer le badge.")

			await refreshStats()
			if (adminUser.id === selectedUserId) refreshSelectedDetails()
			setNotice(`${badgeName} attribue a ${adminUser.username}.`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur d'attribution.")
		} finally {
			setAwardingUserId(null)
		}
	}

	async function handleRemoveUserBadge(userBadge: UserBadge) {
		if (!selectedUser) return

		setRemovingUserBadgeId(userBadge.userBadges.id)
		setNotice(null)
		setError(null)

		try {
			const response = await api.deleteUserBadge(
				selectedUser.id,
				userBadge.userBadges.id,
			)
			if (!response.ok) throw new Error("Impossible de retirer le badge.")

			setSelectedBadges((currentBadges) =>
				currentBadges.filter(
					(currentBadge) =>
						currentBadge.userBadges.id !== userBadge.userBadges.id,
				),
			)
			await refreshStats()
			setNotice(`${userBadge.badges.name} retire de ${selectedUser.username}.`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur retrait badge.")
		} finally {
			setRemovingUserBadgeId(null)
		}
	}

	async function handleParticipationStatus(
		participation: AdminParticipation,
		status: "validated" | "rejected" | "removed",
	) {
		setUpdatingParticipationId(participation.id)
		setNotice(null)
		setError(null)

		try {
			const response = await api.updateParticipationStatus(
				participation.id,
				status,
			)
			if (!response.ok) throw new Error("Impossible de modifier la submit.")

			setSelectedParticipations((currentParticipations) =>
				currentParticipations.map((currentParticipation) =>
					currentParticipation.id === participation.id
						? { ...currentParticipation, status }
						: currentParticipation,
				),
			)
			await refreshStats()
			setNotice(`Submission #${participation.id} mise a jour.`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur moderation.")
		} finally {
			setUpdatingParticipationId(null)
		}
	}

	async function handleDeleteParticipation(participation: AdminParticipation) {
		if (!window.confirm(`Supprimer la submission #${participation.id} ?`)) {
			return
		}

		setDeletingParticipationId(participation.id)
		setNotice(null)
		setError(null)

		try {
			const response = await api.deleteAdminParticipation(participation.id)
			if (!response.ok) throw new Error("Impossible de supprimer la submit.")

			setSelectedParticipations((currentParticipations) =>
				currentParticipations.filter(
					(currentParticipation) =>
						currentParticipation.id !== participation.id,
				),
			)
			await refreshStats()
			setNotice(`Submission #${participation.id} supprimee.`)
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Erreur suppression submit.",
			)
		} finally {
			setDeletingParticipationId(null)
		}
	}

	async function handleDeleteChallenge(challenge: UserChallenge) {
		if (!window.confirm(`Supprimer le challenge "${challenge.title}" ?`)) {
			return
		}

		setDeletingChallengeId(challenge.id)
		setNotice(null)
		setError(null)

		try {
			const response = await api.deleteAdminChallenge(challenge.id)
			if (!response.ok) throw new Error("Impossible de supprimer le challenge.")

			setSelectedChallenges((currentChallenges) =>
				currentChallenges.filter(
					(currentChallenge) => currentChallenge.id !== challenge.id,
				),
			)
			setSelectedParticipations((currentParticipations) =>
				currentParticipations.filter(
					(currentParticipation) =>
						currentParticipation.challenge.id !== challenge.id,
				),
			)
			await refreshStats()
			setNotice(`Challenge ${challenge.title} supprime.`)
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Erreur suppression challenge.",
			)
		} finally {
			setDeletingChallengeId(null)
		}
	}

	if (authLoading || loading) {
		return (
			<div className="flex min-h-[60svh] items-center justify-center px-md">
				<div className="glass-panel rounded-xl p-xl text-on-surface-variant">
					Chargement...
				</div>
			</div>
		)
	}

	if (!user || user.role !== "admin") return null

	return (
		<div className="mx-auto flex w-full max-w-container-max flex-col gap-xl px-md py-xl md:px-xl">
			<header className="flex flex-col justify-between gap-md md:flex-row md:items-end">
				<div>
					<p className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
						Admin Console
					</p>
					<h1 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
						Platform Control
					</h1>
				</div>
				<Link to="/admin/participations">
					<Button variant="secondary">
						<span className="material-symbols-outlined">fact_check</span>
						Moderation
					</Button>
				</Link>
			</header>

			{(error || notice) && (
				<div
					className={`rounded-xl border p-md ${
						error
							? "border-error/30 bg-error-container/20 text-error"
							: "border-tertiary/30 bg-tertiary-container/20 text-tertiary"
					}`}
				>
					{error ?? notice}
				</div>
			)}

			<section className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
				{statCards.map((stat) => (
					<div key={stat.label} className="glass-panel rounded-xl p-lg">
						<div className="flex items-center justify-between gap-md">
							<div>
								<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
									{stat.label}
								</p>
								<p className={`mt-xs font-h2 text-h2 ${stat.accent}`}>
									{statFormat.format(stat.value)}
								</p>
								<p className="mt-xs text-sm text-on-surface-variant">
									{stat.meta}
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface-container">
								<span className={`material-symbols-outlined ${stat.accent}`}>
									{stat.icon}
								</span>
							</div>
						</div>
					</div>
				))}
			</section>

			<section className="grid grid-cols-1 gap-xl 2xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.4fr)_24rem]">
				<div className="flex flex-col gap-md">
					<div className="flex flex-col justify-between gap-md md:flex-row md:items-end 2xl:flex-col 2xl:items-stretch">
						<div>
							<h2 className="font-h2 text-h2 text-on-surface">Users</h2>
							<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
								{filteredUsers.length} results
							</p>
						</div>
						<Input
							name="admin-user-search"
							label="Search"
							placeholder="username, email, id"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>

					<div className="grid grid-cols-1 gap-md">
						{filteredUsers.map((adminUser) => (
							<article
								key={adminUser.id}
								className={`glass-panel rounded-xl p-md transition-colors ${
									adminUser.id === selectedUserId
										? "border-primary/60 bg-primary-container/10"
										: ""
								}`}
							>
								<button
									type="button"
									onClick={() => setSelectedUserId(adminUser.id)}
									className="flex w-full min-w-0 items-center gap-md text-left"
								>
									<Avatar
										src={adminUser.avatarUrl ?? undefined}
										alt={adminUser.username}
										size="md"
									/>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-sm">
											<p className="truncate font-semibold text-on-surface">
												{adminUser.username}
											</p>
											<span
												className={`rounded-full border px-2 py-0.5 font-caption text-caption uppercase tracking-[0.05em] ${
													adminUser.isBanned
														? "border-error/40 bg-error-container/20 text-error"
														: "border-tertiary/40 bg-tertiary-container/20 text-tertiary"
												}`}
											>
												{adminUser.isBanned ? "Banned" : "Active"}
											</span>
										</div>
										<p className="truncate text-sm text-on-surface-variant">
											{adminUser.email ?? adminUser.id}
										</p>
									</div>
									<span className="material-symbols-outlined text-primary">
										chevron_right
									</span>
								</button>
							</article>
						))}
					</div>
				</div>

				<UserDetailPanel
					awardingUserId={awardingUserId}
					badges={badges}
					deletingChallengeId={deletingChallengeId}
					deletingParticipationId={deletingParticipationId}
					detailsLoading={detailsLoading}
					onAwardBadge={handleAwardBadge}
					onBanToggle={handleBanToggle}
					onDeleteChallenge={handleDeleteChallenge}
					onDeleteParticipation={handleDeleteParticipation}
					onRemoveUserBadge={handleRemoveUserBadge}
					onUpdateParticipationStatus={handleParticipationStatus}
					onUpdateUsername={handleUpdateUsername}
					removingUserBadgeId={removingUserBadgeId}
					savingUsernameId={savingUsernameId}
					selectedBadges={selectedBadges}
					selectedChallenges={selectedChallenges}
					selectedParticipations={selectedParticipations}
					selectedUser={selectedUser}
					updatingParticipationId={updatingParticipationId}
					updatingUserId={updatingUserId}
					viewerId={user.id}
				/>

				<aside className="flex flex-col gap-lg">
					<section className="glass-panel rounded-xl p-lg">
						<h2 className="font-h2 text-h2 text-on-surface">Badges</h2>
						<form onSubmit={handleCreateBadge} className="mt-lg space-y-md">
							<div>
								<label
									htmlFor="badge-name"
									className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
								>
									Name
								</label>
								<input
									id="badge-name"
									name="name"
									className="tactical-input mt-sm w-full px-md py-sm"
									required
								/>
							</div>
							<div>
								<label
									htmlFor="badge-description"
									className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
								>
									Description
								</label>
								<textarea
									id="badge-description"
									name="description"
									className="tactical-input mt-sm min-h-24 w-full resize-y px-md py-sm"
									required
								/>
							</div>
							<div>
								<label
									htmlFor="badge-icon"
									className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
								>
									Icon URL
								</label>
								<input
									id="badge-icon"
									name="iconUrl"
									type="url"
									className="tactical-input mt-sm w-full px-md py-sm"
								/>
							</div>
							<Button type="submit" className="w-full" disabled={creatingBadge}>
								{creatingBadge ? "Creating..." : "Create Badge"}
							</Button>
						</form>
					</section>

					<section className="glass-panel rounded-xl p-lg">
						<h3 className="font-h3 text-h3 text-on-surface">Badge Inventory</h3>
						<div className="mt-md flex flex-col gap-sm">
							{badges.length === 0 ? (
								<p className="text-sm text-on-surface-variant">Aucun badge.</p>
							) : (
								badges.map((badge) => (
									<div
										key={badge.id}
										className="flex items-center gap-sm rounded-lg border border-white/10 bg-surface-container/50 p-sm"
									>
										<BadgeIcon badge={badge} />
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold text-on-surface">
												{badge.name}
											</p>
											<p className="line-clamp-2 text-xs text-on-surface-variant">
												{badge.description}
											</p>
										</div>
										<button
											type="button"
											onClick={() => handleDeleteBadge(badge)}
											disabled={deletingBadgeId === badge.id}
											className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-error/30 text-error transition-colors hover:bg-error-container/20 disabled:opacity-50"
											aria-label={`Delete ${badge.name}`}
										>
											<span className="material-symbols-outlined text-[20px]">
												delete
											</span>
										</button>
									</div>
								))
							)}
						</div>
					</section>
				</aside>
			</section>
		</div>
	)
}

function UserDetailPanel({
	awardingUserId,
	badges,
	deletingChallengeId,
	deletingParticipationId,
	detailsLoading,
	onAwardBadge,
	onBanToggle,
	onDeleteChallenge,
	onDeleteParticipation,
	onRemoveUserBadge,
	onUpdateParticipationStatus,
	onUpdateUsername,
	removingUserBadgeId,
	savingUsernameId,
	selectedBadges,
	selectedChallenges,
	selectedParticipations,
	selectedUser,
	updatingParticipationId,
	updatingUserId,
	viewerId,
}: {
	awardingUserId: string | null
	badges: Badge[]
	deletingChallengeId: number | null
	deletingParticipationId: number | null
	detailsLoading: boolean
	onAwardBadge: (
		event: FormEvent<HTMLFormElement>,
		adminUser: AdminUser,
	) => void
	onBanToggle: (adminUser: AdminUser) => void
	onDeleteChallenge: (challenge: UserChallenge) => void
	onDeleteParticipation: (participation: AdminParticipation) => void
	onRemoveUserBadge: (userBadge: UserBadge) => void
	onUpdateParticipationStatus: (
		participation: AdminParticipation,
		status: "validated" | "rejected" | "removed",
	) => void
	onUpdateUsername: (
		event: FormEvent<HTMLFormElement>,
		adminUser: AdminUser,
	) => void
	removingUserBadgeId: number | null
	savingUsernameId: string | null
	selectedBadges: UserBadge[]
	selectedChallenges: UserChallenge[]
	selectedParticipations: AdminParticipation[]
	selectedUser: AdminUser | null
	updatingParticipationId: number | null
	updatingUserId: string | null
	viewerId: string
}) {
	if (!selectedUser) {
		return (
			<section className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
				Select a user to inspect submissions, badges, and challenges.
			</section>
		)
	}

	return (
		<section className="glass-panel-strong rounded-xl p-lg md:p-xl">
			<div className="flex flex-col gap-lg">
				<div className="flex flex-col justify-between gap-md md:flex-row md:items-start">
					<div className="flex min-w-0 items-center gap-md">
						<Avatar
							src={selectedUser.avatarUrl ?? undefined}
							alt={selectedUser.username}
							size="md"
						/>
						<div className="min-w-0">
							<h2 className="truncate font-h2 text-h2 text-on-surface">
								{selectedUser.username}
							</h2>
							<p className="truncate text-sm text-on-surface-variant">
								{selectedUser.email ?? selectedUser.id}
							</p>
							<div className="mt-sm flex flex-wrap gap-sm">
								<StatusPill
									label={selectedUser.isBanned ? "Banned" : "Active"}
									tone={selectedUser.isBanned ? "error" : "success"}
								/>
								<StatusPill label={selectedUser.role} tone="neutral" />
							</div>
						</div>
					</div>
					<Button
						size="sm"
						variant={selectedUser.isBanned ? "tertiary" : "danger"}
						disabled={
							updatingUserId === selectedUser.id || selectedUser.id === viewerId
						}
						onClick={() => onBanToggle(selectedUser)}
					>
						{updatingUserId === selectedUser.id
							? "..."
							: selectedUser.isBanned
								? "Unban"
								: "Ban"}
					</Button>
				</div>

				<form
					key={selectedUser.id}
					onSubmit={(event) => onUpdateUsername(event, selectedUser)}
					className="grid grid-cols-1 gap-sm border-t border-white/10 pt-md md:grid-cols-[minmax(0,1fr)_auto]"
				>
					<div>
						<label
							htmlFor={`admin-username-${selectedUser.id}`}
							className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant"
						>
							Pseudo
						</label>
						<input
							id={`admin-username-${selectedUser.id}`}
							name="username"
							defaultValue={selectedUser.username}
							className="tactical-input mt-sm px-md py-sm"
						/>
					</div>
					<Button
						type="submit"
						className="self-end"
						disabled={savingUsernameId === selectedUser.id}
					>
						{savingUsernameId === selectedUser.id ? "Saving..." : "Update"}
					</Button>
				</form>

				{detailsLoading ? (
					<div className="rounded-xl border border-white/10 bg-surface-container/40 p-lg text-center text-on-surface-variant">
						Chargement du detail...
					</div>
				) : (
					<>
						<section>
							<SectionHeading icon="military_tech" title="User Badges" />
							<form
								onSubmit={(event) => onAwardBadge(event, selectedUser)}
								className="mb-md grid grid-cols-[minmax(0,1fr)_auto] gap-sm"
							>
								<select
									name="badgeName"
									className="tactical-input min-w-0 px-md py-sm"
									disabled={badges.length === 0}
								>
									{badges.map((badge) => (
										<option key={badge.id} value={badge.name}>
											{badge.name}
										</option>
									))}
								</select>
								<Button
									type="submit"
									variant="secondary"
									disabled={
										badges.length === 0 || awardingUserId === selectedUser.id
									}
								>
									{awardingUserId === selectedUser.id ? "..." : "Add"}
								</Button>
							</form>
							<div className="grid grid-cols-1 gap-sm md:grid-cols-2">
								{selectedBadges.length === 0 ? (
									<EmptyState text="Aucun badge attribue." />
								) : (
									selectedBadges.map((userBadge) => (
										<div
											key={userBadge.userBadges.id}
											className="flex items-center gap-sm rounded-lg border border-white/10 bg-surface-container/50 p-sm"
										>
											<BadgeIcon badge={userBadge.badges} />
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-semibold text-on-surface">
													{userBadge.badges.name}
												</p>
												<p className="text-xs text-on-surface-variant">
													{formatDate(userBadge.userBadges.awardedAt)}
												</p>
											</div>
											<button
												type="button"
												onClick={() => onRemoveUserBadge(userBadge)}
												disabled={
													removingUserBadgeId === userBadge.userBadges.id
												}
												className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-error/30 text-error transition-colors hover:bg-error-container/20 disabled:opacity-50"
												aria-label={`Remove ${userBadge.badges.name}`}
											>
												<span className="material-symbols-outlined text-[18px]">
													delete
												</span>
											</button>
										</div>
									))
								)}
							</div>
						</section>

						<section>
							<SectionHeading icon="movie" title="Submissions" />
							<div className="flex flex-col gap-sm">
								{selectedParticipations.length === 0 ? (
									<EmptyState text="Aucune submission." />
								) : (
									selectedParticipations.map((participation) => (
										<div
											key={participation.id}
											className="rounded-lg border border-white/10 bg-surface-container/50 p-md"
										>
											<div className="flex flex-col justify-between gap-md md:flex-row md:items-start">
												<div className="min-w-0">
													<div className="flex flex-wrap items-center gap-sm">
														<p className="font-semibold text-on-surface">
															{participation.challenge.title}
														</p>
														<StatusPill
															label={participation.status}
															tone={getParticipationTone(participation.status)}
														/>
													</div>
													<a
														href={participation.videoUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="mt-xs block truncate text-sm text-primary underline underline-offset-4"
													>
														{participation.videoUrl}
													</a>
													<p className="mt-xs text-xs text-on-surface-variant">
														{formatDate(participation.createdAt)} -{" "}
														{participation.upvotes} up /{" "}
														{participation.downvotes} down
													</p>
												</div>
												<div className="flex flex-wrap gap-sm">
													{participation.status !== "validated" && (
														<Button
															size="sm"
															variant="tertiary"
															disabled={
																updatingParticipationId === participation.id
															}
															onClick={() =>
																onUpdateParticipationStatus(
																	participation,
																	"validated",
																)
															}
														>
															Approve
														</Button>
													)}
													{participation.status !== "rejected" && (
														<Button
															size="sm"
															variant="secondary"
															disabled={
																updatingParticipationId === participation.id
															}
															onClick={() =>
																onUpdateParticipationStatus(
																	participation,
																	"rejected",
																)
															}
														>
															Reject
														</Button>
													)}
													<Button
														size="sm"
														variant="danger"
														disabled={
															deletingParticipationId === participation.id
														}
														onClick={() => onDeleteParticipation(participation)}
													>
														<span className="material-symbols-outlined text-[18px]">
															delete
														</span>
													</Button>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</section>

						<section>
							<SectionHeading
								icon="sports_esports"
								title="Created Challenges"
							/>
							<div className="flex flex-col gap-sm">
								{selectedChallenges.length === 0 ? (
									<EmptyState text="Aucun challenge cree." />
								) : (
									selectedChallenges.map((challenge) => (
										<div
											key={challenge.id}
											className="flex flex-col justify-between gap-md rounded-lg border border-white/10 bg-surface-container/50 p-md md:flex-row md:items-center"
										>
											<div className="min-w-0">
												<div className="flex flex-wrap items-center gap-sm">
													<p className="font-semibold text-on-surface">
														{challenge.title}
													</p>
													<StatusPill label={challenge.status} tone="neutral" />
												</div>
												<p className="text-sm text-on-surface-variant">
													{statFormat.format(challenge.rewardPoints)} XP -{" "}
													{formatDate(challenge.createdAt)}
												</p>
											</div>
											<Button
												size="sm"
												variant="danger"
												disabled={deletingChallengeId === challenge.id}
												onClick={() => onDeleteChallenge(challenge)}
											>
												<span className="material-symbols-outlined text-[18px]">
													delete
												</span>
												Delete
											</Button>
										</div>
									))
								)}
							</div>
						</section>
					</>
				)}
			</div>
		</section>
	)
}

function SectionHeading({ icon, title }: { icon: string; title: string }) {
	return (
		<div className="mb-md flex items-center gap-sm border-b border-white/10 pb-sm">
			<span className="material-symbols-outlined text-primary">{icon}</span>
			<h3 className="font-h3 text-h3 text-on-surface">{title}</h3>
		</div>
	)
}

function BadgeIcon({ badge }: { badge: Badge }) {
	return (
		<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/30 bg-primary-container/20 text-primary">
			{badge.iconUrl ? (
				<img
					src={badge.iconUrl}
					alt={badge.name}
					className="h-full w-full object-cover"
				/>
			) : (
				<span className="material-symbols-outlined">military_tech</span>
			)}
		</div>
	)
}

function EmptyState({ text }: { text: string }) {
	return (
		<div className="rounded-lg border border-white/10 bg-surface-container/40 p-md text-sm text-on-surface-variant">
			{text}
		</div>
	)
}

function StatusPill({
	label,
	tone,
}: {
	label: string
	tone: "error" | "neutral" | "success" | "warning"
}) {
	const toneClass = {
		error: "border-error/40 bg-error-container/20 text-error",
		neutral:
			"border-white/10 bg-surface-container px-2 py-0.5 text-on-surface-variant",
		success: "border-tertiary/40 bg-tertiary-container/20 text-tertiary",
		warning: "border-warning/40 bg-warning/10 text-warning",
	}[tone]

	return (
		<span
			className={`rounded-full border px-2 py-0.5 font-caption text-caption uppercase tracking-[0.05em] ${toneClass}`}
		>
			{label}
		</span>
	)
}

function getParticipationTone(
	status: AdminParticipation["status"],
): "error" | "neutral" | "success" | "warning" {
	if (status === "validated") return "success"
	if (status === "pending") return "warning"
	if (status === "rejected") return "error"
	return "neutral"
}

function normalizeUserBadge(value: unknown): UserBadge | null {
	if (!isRecord(value)) return null

	const userBadge = value.userBadges ?? value.user_badges
	const badge = value.badges

	if (!isRecord(userBadge) || !isRecord(badge)) return null

	return {
		userBadges: userBadge as UserBadge["userBadges"],
		badges: badge as UserBadge["badges"],
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null
}

async function readJson<T>(response: Response, message: string) {
	if (!response.ok) throw new Error(message)
	return response.json() as Promise<T>
}

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}
