type SocialProvider = "google" | "twitch"

type SocialLoginButtonProps = {
	provider: SocialProvider
	onClick?: () => void
	className?: string
}

const providerConfig: Record<
	SocialProvider,
	{ label: string; icon: string; color: string }
> = {
	google: {
		label: "Google",
		icon: "https://img.magnific.com/premium-vector/google-logo-white-background_1273375-1416.jpg?semt=ais_hybrid&w=740&q=80",
		color: "hover:border-red-400 hover:text-red-400",
	},
	twitch: {
		label: "Twitch",
		icon: "https://img.magnific.com/vecteurs-premium/logo-medias-sociaux-vector-twitch_1093524-449.jpg?semt=ais_hybrid&w=740&q=80",
		color: "hover:border-purple-400 hover:text-purple-400",
	},
}

export default function SocialLoginButton({
	provider,
	onClick,
	className = "",
}: SocialLoginButtonProps) {
	const config = providerConfig[provider]

	return (
		<button
			type="button"
			onClick={onClick}
			className={`
        w-10 h-10 rounded-full font-bold text-sm
        flex items-center justify-center transition-all duration-200 cursor-pointer
        ${config.color} ${className}
      `}
			aria-label={`Sign in with ${config.label}`}
		>
			<img
				src={config.icon}
				alt={config.label}
				className="bg-white rounded-full"
			/>
		</button>
	)
}
