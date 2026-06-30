import type { Context } from "hono"
import { getOptionalEnv } from "../config/env"

function getForwardedHeaderValue(value?: string) {
	return value?.split(",")[0]?.trim()
}

function hasUnsafePathCharacter(value: string) {
	for (const character of value) {
		const codePoint = character.charCodeAt(0)

		if (codePoint <= 0x1f || codePoint === 0x7f || character === "\\") {
			return true
		}
	}

	return false
}

export function getBackendOrigin(c: Context) {
	const configuredOrigin = getOptionalEnv("AUTH_REDIRECT_ORIGIN")

	if (configuredOrigin) {
		return configuredOrigin
	}

	const forwardedProto = getForwardedHeaderValue(
		c.req.header("X-Forwarded-Proto"),
	)
	const forwardedHost = getForwardedHeaderValue(
		c.req.header("X-Forwarded-Host"),
	)

	if (forwardedProto && forwardedHost) {
		try {
			const forwardedOrigin = new URL(`${forwardedProto}://${forwardedHost}`)

			if (["http:", "https:"].includes(forwardedOrigin.protocol)) {
				return forwardedOrigin.origin
			}
		} catch {}
	}

	return new URL(c.req.url).origin
}

export function getSafeNextPath(next?: string) {
	if (!next?.startsWith("/")) {
		return "/"
	}

	let decodedNext: string

	try {
		decodedNext = decodeURIComponent(next)
	} catch {
		return "/"
	}

	if (
		decodedNext !== "/" &&
		(!/^\/[^/\\]/.test(decodedNext) || hasUnsafePathCharacter(decodedNext))
	) {
		return "/"
	}

	return next
}

export function getAuthCallbackUrl(c: Context, nextPath: string) {
	const redirectTo = new URL("/api/v1/auth/callback", getBackendOrigin(c))
	redirectTo.searchParams.set("next", nextPath)

	return redirectTo.toString()
}

export function getFinalRedirectUrl(nextPath: string) {
	const frontendUrl = getOptionalEnv("FRONTEND_URL")

	if (!frontendUrl) {
		return nextPath
	}

	return new URL(nextPath, frontendUrl).toString()
}
