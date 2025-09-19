export type { RemoteJWKSetOptions, JWTPayload } from 'jose';

export type RemoteJWKSet = ReturnType<
	NonNullable<typeof import('jose').createRemoteJWKSet>
>;

/**
 * Lazy loader for 'jose' package to support both
 * ESM and CJS while avoiding runtime overhead.
 */
const josePreloader = import('jose')
	.then((jose) => ({
		createRemoteJWKSet: jose.createRemoteJWKSet,
		jwtVerify: jose.jwtVerify
	}))
	.catch((e) => {
		console.error(`The jose library failed to load:`, e);
		throw e;
	});

/**
 * Returns the cached jose's library functions.
 */
export async function jose() {
	return josePreloader;
}
