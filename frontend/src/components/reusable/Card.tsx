import type { ReactNode } from "react"

type CardProps = {
	icon?: ReactNode
	title: string
	description?: string
	children?: ReactNode
	className?: string
	accent?: "primary" | "tertiary" | "error" | "warning" | "secondary"
}

const accentClasses: Record<NonNullable<CardProps["accent"]>, string> = {
	primary: "border-t-primary",
	tertiary: "border-t-tertiary",
	error: "border-t-error",
	warning: "border-t-warning",
	secondary: "border-t-secondary",
}

export default function Card({
	icon,
	title,
	description,
	children,
	className = "",
	accent = "primary",
}: CardProps) {
	return (
		<div
			className={`glass-panel neon-glow rounded-xl border-t-2 ${accentClasses[accent]} p-lg ${className}`}
		>
			<div className="flex items-start gap-md">
				{icon && (
					<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary-container/20 text-primary">
						{icon}
					</span>
				)}
				<div className="min-w-0 flex-1">
					<h3 className="font-h3 text-[20px] leading-snug text-on-surface">
						{title}
					</h3>
					{description && (
						<p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
							{description}
						</p>
					)}
				</div>
			</div>
			{children && <div className="mt-md">{children}</div>}
		</div>
	)
}
