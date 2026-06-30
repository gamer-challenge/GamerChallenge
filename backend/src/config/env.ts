export function getRequiredEnv(name: string) {
	const value = Bun.env[name]

	if (!value) {
		throw new Error(`Missing ${name} environment variable`)
	}

	return value
}

export function getOptionalEnv(name: string) {
	return Bun.env[name]
}
