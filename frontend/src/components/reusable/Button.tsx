import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

type ButtonProps = {
	children: ReactNode
	variant?: ButtonVariant
	size?: ButtonSize
	className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-primary-container text-on-primary-container border border-primary-container/80 shadow-[0_0_15px_rgba(124,58,237,0.32)] hover:bg-inverse-primary",
	secondary:
		"glass-panel text-on-surface border-white/10 hover:border-primary/50 hover:bg-white/10",
	tertiary:
		"bg-tertiary text-on-tertiary border border-tertiary/80 hover:bg-tertiary-fixed-dim",
	danger:
		"bg-error-container text-on-error-container border border-error/50 hover:bg-error hover:text-on-error",
	ghost:
		"bg-transparent text-on-surface-variant border border-transparent hover:text-primary hover:bg-white/5",
}

const sizeClasses: Record<ButtonSize, string> = {
	sm: "px-3 py-2 text-sm",
	md: "px-5 py-2.5 text-base",
	lg: "px-8 py-4 text-lg",
}

export default function Button({
	children,
	variant = "primary",
	size = "md",
	disabled = false,
	type = "button",
	className = "",
	...props
}: ButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled}
			className={`
				neon-glow inline-flex items-center justify-center gap-2 rounded-lg
				font-caption font-bold uppercase tracking-[0.05em] transition-all duration-200
				focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
				${variantClasses[variant]}
				${sizeClasses[size]}
				${disabled ? "cursor-not-allowed opacity-50 hover:scale-100 hover:shadow-none" : "cursor-pointer"}
				${className}
			`}
			{...props}
		>
			{children}
		</button>
	)
}
