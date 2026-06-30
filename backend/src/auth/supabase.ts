import { createServerClient } from "@supabase/ssr"
import type { Context } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import { getRequiredEnv } from "../config/env"

export function createSupabaseServerClient(c: Context) {
	return createServerClient(
		getRequiredEnv("SUPABASE_URL"),
		getRequiredEnv("SUPABASE_PUBLISHABLE_KEY"),
		{
			cookies: {
				getAll() {
					return Object.entries(getCookie(c)).map(([name, value]) => ({
						name,
						value,
					}))
				},
				setAll(cookiesToSet) {
					for (const { name, options, value } of cookiesToSet) {
						const sameSite =
							typeof options.sameSite === "boolean"
								? options.sameSite
									? "strict"
									: "lax"
								: options.sameSite

						setCookie(c, name, value, {
							...options,
							sameSite,
						})
					}
				},
			},
		},
	)
}
