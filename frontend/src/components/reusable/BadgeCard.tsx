type BadgeCardProps = {
	name: string
	description: string
	iconUrl: string | null
	awardedAt: string
}

export default function BadgeCard({
	name,
	description,
	iconUrl,
	awardedAt,
}: BadgeCardProps) {
	const date = new Date(awardedAt).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})

	return (
		<article className="glass-panel neon-glow group relative overflow-hidden rounded-xl p-md">
			<div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-tertiary to-transparent opacity-80" />
			<div className="flex items-start gap-md pl-sm">
				<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/30 bg-primary-container/20 text-primary shadow-[0_0_18px_rgba(124,58,237,0.22)] transition-colors group-hover:border-tertiary/50 group-hover:text-tertiary">
					{iconUrl ? (
						<img
							src={iconUrl}
							alt={name}
							className="h-full w-full object-cover"
						/>
					) : (
						<span className="material-symbols-outlined text-3xl">
							military_tech
						</span>
					)}
				</div>
				<div className="min-w-0 flex-1 text-left">
					<div className="flex flex-wrap items-start justify-between gap-sm">
						<h3 className="min-w-0 truncate font-semibold text-on-surface">
							{name}
						</h3>
						<span className="shrink-0 rounded-full border border-tertiary/30 bg-tertiary-container/20 px-2 py-0.5 font-caption text-caption uppercase tracking-[0.05em] text-tertiary">
							Badge
						</span>
					</div>
					<p className="mt-xs line-clamp-2 text-sm leading-snug text-on-surface-variant">
						{description}
					</p>
					<div className="mt-md flex items-center gap-xs font-caption text-caption uppercase tracking-[0.05em] text-secondary">
						<span className="material-symbols-outlined text-[16px]">
							event_available
						</span>
						{date}
					</div>
				</div>
			</div>
		</article>
	)
}
