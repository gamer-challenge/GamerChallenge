import { eq } from "drizzle-orm"
import type { Context } from "hono"
import { syncProfile } from "../auth/profile"
import { getOAuthQueryParams, isOAuthProvider } from "../auth/providers"
import {
	getAuthCallbackUrl,
	getBackendOrigin,
	getFinalRedirectUrl,
	getSafeNextPath,
} from "../auth/redirects"
import { createSupabaseServerClient } from "../auth/supabase"
import { isAllowedFrontendOrigin } from "../config/frontend-origins"
import { db } from "../db/client"
import { profiles } from "../db/schema"

async function getRequestedProvider(c: Context) {
	const providerFromQuery = c.req.query("provider")

	if (providerFromQuery) {
		return providerFromQuery
	}

	if (c.req.method !== "POST") {
		return undefined
	}

	try {
		const body = await c.req.json<{ provider?: string }>()
		return body.provider
	} catch {
		return undefined
	}
}

function getHeaderOrigin(value?: string) {
	if (!value) {
		return undefined
	}

	try {
		return new URL(value).origin
	} catch {
		return undefined
	}
}

function hasAllowedRequestOrigin(c: Context) {
	const requestOrigin =
		getHeaderOrigin(c.req.header("Origin")) ??
		getHeaderOrigin(c.req.header("Referer"))

	return requestOrigin
		? requestOrigin === getBackendOrigin(c) ||
				isAllowedFrontendOrigin(requestOrigin)
		: false
}

export async function handleOAuthCallback(c: Context) {
	const code = c.req.query("code")
	const next = getSafeNextPath(c.req.query("next"))

	if (!code) {
		return c.redirect(getFinalRedirectUrl(next), 303)
	}

	const { data, error } =
		await createSupabaseServerClient(c).auth.exchangeCodeForSession(code)

	if (error) {
		return c.json({ error: error.message }, 400)
	}

	if (data.user) {
		try {
			await syncProfile(data.user)
		} catch (error) {
			console.error("Failed to sync OAuth user profile", {
				userId: data.user.id,
				error,
			})
		}
	}
	return c.redirect(getFinalRedirectUrl(next), 303)
}

export async function handleOAuthSignIn(c: Context) {
	const provider = await getRequestedProvider(c)

	if (!provider || !isOAuthProvider(provider)) {
		return c.json({ error: "Unsupported OAuth provider" }, 400)
	}

	const next = getSafeNextPath(c.req.query("next"))
	const { data, error } = await createSupabaseServerClient(
		c,
	).auth.signInWithOAuth({
		provider,
		options: {
			redirectTo: getAuthCallbackUrl(c, next),
			queryParams: getOAuthQueryParams(provider),
		},
	})

	if (error) {
		return c.json({ error: error.message }, 400)
	}

	if (!data.url) {
		return c.json(
			{ error: "OAuth provider did not return a redirect URL" },
			502,
		)
	}

	return c.redirect(data.url)
}

export async function handleGetMe(c: Context) {
	const {
		data: { user },
		error,
	} = await createSupabaseServerClient(c).auth.getUser()

	if (error || !user) {
		return c.json({ error: "Unauthorized" }, 401)
	}

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, user.id))
		.limit(1)

	if (!profile) {
		return c.json({ error: "Profile not found" }, 404)
	}

	return c.json(profile)
}

export async function handleLogout(c: Context) {
	if (!hasAllowedRequestOrigin(c)) {
		return c.json({ error: "Invalid request origin" }, 403)
	}

	const { error } = await createSupabaseServerClient(c).auth.signOut()

	if (error) {
		return c.json({ error: error.message }, 400)
	}

	return c.body(null, 204)
}
