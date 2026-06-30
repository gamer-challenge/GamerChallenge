type AvatarSize = "sm" | "md" | "lg" | "xl"

type AvatarProps = {
	src?: string
	alt?: string
	size?: AvatarSize
	className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
	sm: "h-8 w-8 text-xs",
	md: "h-11 w-11 text-sm",
	lg: "h-24 w-24 text-xl",
	xl: "h-36 w-36 text-3xl",
}

export default function Avatar({
	src,
	alt = "avatar",
	size = "md",
	className = "",
}: AvatarProps) {
	return (
		<div
			className={`
				flex shrink-0 items-center justify-center overflow-hidden rounded-full
				border border-white/15 bg-surface-container-high text-primary
				shadow-[0_0_18px_rgba(124,58,237,0.25)]
				${sizeClasses[size]} ${className}
			`}
		>
			{src ? (
				<img src={src} alt={alt} className="h-full w-full object-cover" />
			) : (
				<span className="font-title font-black uppercase">
					{alt.trim().charAt(0) || "?"}
				</span>
			)}
		</div>
	)
}
