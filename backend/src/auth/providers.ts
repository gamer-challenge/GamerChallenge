import type { Provider } from "@supabase/supabase-js"

export const oauthProviders = ["google", "twitch"] as const satisfies Provider[]

export type OAuthProvider = (typeof oauthProviders)[number]

const oauthProviderSet = new Set<string>(oauthProviders)

export function isOAuthProvider(provider: string): provider is OAuthProvider {
	return oauthProviderSet.has(provider)
}

export function getOAuthQueryParams(provider: OAuthProvider) {
	if (provider !== "google") {
		return undefined
	}

	return {
		access_type: "offline",
		prompt: "consent",
	}
}
