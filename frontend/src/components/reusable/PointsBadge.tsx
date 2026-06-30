type PointsBadgeProps = {
	points: number
	className?: string
	label?: string
}

export default function PointsBadge({
	points,
	className = "",
	label = "XP",
}: PointsBadgeProps) {
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-container/20 px-3 py-1 font-caption text-caption uppercase tracking-[0.05em] text-primary ${className}`}
		>
			<span className="material-symbols-outlined text-[16px]">stars</span>
			{points.toLocaleString()} {label}
		</span>
	)
}
