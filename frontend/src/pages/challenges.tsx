import { useEffect, useMemo, useState } from "react"
import { Button, GameCard } from "../components/reusable"
import CreateChallengeModal from "../components/reusable/CreateChallengeModal"
import { useAuth } from "../context/useAuth"
import { api } from "../lib/api"
import type { Challenge } from "../types/challenge"

const filters = [
	{ key: "Games", icon: "category" },
	{ key: "Difficulty", icon: "equalizer" },
	{ key: "Status", icon: "history" },
]

export default function ChallengesPage() {
	const { user } = useAuth()
	const isAuthenticated = !!user
	const [open, setOpen] = useState(false)
	const [challenges, setChallenges] = useState<Challenge[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [activeFilter, setActiveFilter] = useState<string | null>(null)
	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string[]>
	>({})
	const [search, setSearch] = useState("")

	const gameOptions = useMemo(
		() =>
			Array.from(
				new Set(
					challenges
						.map((challenge) => challenge.game.name ?? "")
						.filter(Boolean),
				),
			).sort(),
		[challenges],
	)

	const filterOptions: Record<string, string[]> = {
		Games: gameOptions,
		Difficulty: ["easy", "medium", "hard", "extreme", "insane"],
		Status: ["active", "closed", "removed"],
	}

	const handleFilterClick = (filter: string) => {
		setActiveFilter((current) => (current === filter ? null : filter))
	}

	const handleSelectOption = (filter: string, option: string) => {
		setSelectedOptions((prev) => {
			const current = prev[filter] || []
			if (current.includes(option)) {
				return {
					...prev,
					[filter]: current.filter((o) => o !== option),
				}
			}

			return {
				...prev,
				[filter]: [...current, option],
			}
		})
	}

	const resetFilters = () => {
		setSelectedOptions({})
		setActiveFilter(null)
		setSearch("")
	}

	const filteredChallenges = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase()

		return challenges.filter((challenge) => {
			const selectedGames = selectedOptions.Games ?? []
			const selectedDifficulties = selectedOptions.Difficulty ?? []
			const selectedStatuses = selectedOptions.Status ?? []

			if (
				normalizedSearch &&
				!`${challenge.title} ${challenge.description} ${challenge.game.name}`
					.toLowerCase()
					.includes(normalizedSearch)
			) {
				return false
			}

			if (
				selectedGames.length > 0 &&
				!(challenge.game.name && selectedGames.includes(challenge.game.name))
			) {
				return false
			}

			if (
				selectedDifficulties.length > 0 &&
				!selectedDifficulties.includes(challenge.difficulty ?? "")
			) {
				return false
			}

			if (
				selectedStatuses.length > 0 &&
				!selectedStatuses.includes(challenge.status)
			) {
				return false
			}

			return true
		})
	}, [challenges, search, selectedOptions])

	useEffect(() => {
		api
			.getChallenges()
			.then((res) => {
				if (!res.ok) throw new Error("Failed to fetch challenges")
				return res.json()
			})
			.then((data: Challenge[]) => setChallenges(data))
			.catch((err: Error) => setError(err.message))
			.finally(() => setLoading(false))
	}, [])

	const selectedCount = Object.values(selectedOptions).reduce(
		(total, options) => total + options.length,
		0,
	)

	return (
		<div className="mx-auto grid w-full max-w-container-max grid-cols-1 gap-xl px-md py-xl md:px-xl lg:grid-cols-[260px_1fr]">
			<aside className="glass-panel h-fit rounded-xl p-md lg:sticky lg:top-[96px]">
				<div className="mb-lg">
					<h1 className="font-h3 text-h3 text-primary">Discovery</h1>
					<p className="font-caption text-caption uppercase tracking-[0.05em] text-on-surface-variant">
						Filter challenges
					</p>
				</div>
				<nav className="flex flex-col gap-sm">
					{filters.map((filter) => {
						const isActive = activeFilter === filter.key
						const count = selectedOptions[filter.key]?.length ?? 0
						return (
							<div key={filter.key} className="relative">
								<button
									type="button"
									onClick={() => handleFilterClick(filter.key)}
									className={`flex w-full items-center justify-between gap-md rounded-lg p-sm text-left transition-all ${
										isActive || count > 0
											? "bg-primary-container text-on-primary-container shadow-[0_0_10px_rgba(124,58,237,0.3)]"
											: "text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary"
									}`}
								>
									<span className="flex items-center gap-md">
										<span className="material-symbols-outlined">
											{filter.icon}
										</span>
										{filter.key}
									</span>
									{count > 0 && (
										<span className="rounded-full bg-white/15 px-2 text-xs">
											{count}
										</span>
									)}
								</button>
								{isActive && (
									<div className="mt-sm rounded-lg border border-white/10 bg-surface-container-high p-sm">
										{filterOptions[filter.key].length === 0 ? (
											<p className="px-sm py-xs text-sm text-on-surface-variant">
												No options
											</p>
										) : (
											filterOptions[filter.key].map((option) => {
												const isSelected =
													selectedOptions[filter.key]?.includes(option)
												return (
													<button
														type="button"
														key={option}
														onClick={() =>
															handleSelectOption(filter.key, option)
														}
														className={`flex w-full items-center justify-between rounded-md px-sm py-xs text-left text-sm capitalize transition-colors ${
															isSelected
																? "bg-primary-container/40 text-primary"
																: "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
														}`}
													>
														{option}
														{isSelected && (
															<span className="material-symbols-outlined text-[16px]">
																check
															</span>
														)}
													</button>
												)
											})
										)}
									</div>
								)}
							</div>
						)
					})}
				</nav>
				<Button
					variant="secondary"
					size="sm"
					className="mt-lg w-full"
					onClick={resetFilters}
					disabled={selectedCount === 0 && !search}
				>
					Reset Filters
				</Button>
			</aside>

			<main className="min-w-0">
				<header className="mb-xl">
					<div className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-end">
						<div>
							<p className="font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
								Mission Board
							</p>
							<h1 className="mt-sm font-h1 text-h1-mobile text-on-surface md:text-h1">
								Browse Challenges
							</h1>
							<p className="mt-sm max-w-[42rem] text-on-surface-variant">
								Find a bounty, read the rules, and submit proof when your run is
								clean.
							</p>
						</div>
						{isAuthenticated && (
							<Button onClick={() => setOpen(true)}>
								<span className="material-symbols-outlined">add</span>
								Create Challenge
							</Button>
						)}
					</div>

					<div className="glass-panel flex flex-col gap-md rounded-xl p-md md:flex-row md:items-center md:justify-between">
						<div className="relative w-full md:max-w-[36rem] md:flex-1">
							<span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">
								search
							</span>
							<input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="tactical-input py-sm pl-xl pr-md"
								placeholder="Search challenges..."
								type="text"
							/>
						</div>
						<div className="flex items-center gap-sm text-sm text-on-surface-variant">
							<span className="material-symbols-outlined text-[20px]">
								database
							</span>
							{filteredChallenges.length} visible / {challenges.length} total
						</div>
					</div>
				</header>

				{open && <CreateChallengeModal onClose={() => setOpen(false)} />}

				{loading && (
					<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
						Chargement...
					</div>
				)}

				{error && (
					<div className="rounded-xl border border-error/30 bg-error-container/20 p-xl text-center text-error">
						Erreur : {error}
					</div>
				)}

				{!loading && !error && filteredChallenges.length === 0 && (
					<div className="glass-panel rounded-xl p-xl text-center text-on-surface-variant">
						Aucun challenge disponible.
					</div>
				)}

				<div className="grid grid-cols-1 gap-lg md:grid-cols-2 xl:grid-cols-3">
					{filteredChallenges.map((challenge) => (
						<GameCard
							key={challenge.id}
							id={challenge.id}
							title={challenge.title}
							game={challenge.game.name}
							points={challenge.rewardPoints}
							difficulty={challenge.difficulty ?? undefined}
							imageUrl={challenge.game.coverUrl ?? undefined}
							description={challenge.description}
						/>
					))}
				</div>
			</main>
		</div>
	)
}
