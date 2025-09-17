import {
	AuthOptions,
	Configurations,
	IAM,
	JWTDecoded,
	NextFunction,
	Request,
	RequestHandler,
	Response,
	Strategy
} from '../contracts';
import { createRemoteJWKSet, jwtVerify, RemoteJWKSetOptions } from 'jose';
import { URL } from 'url';

export class Provider extends IAM<Strategy.JWT, Configurations> {
	public readonly strategy: Strategy.JWT;

	protected issuer: string;

	protected jwks: ReturnType<typeof createRemoteJWKSet>;

	protected getAuthorization(req: Request) {
		const headers = req?.headers || {};
		const [scheme, token] = headers.authorization?.split(' ') || [];

		if (scheme !== 'Bearer' || !token) {
			throw new Error('Missing Bearer authorization token');
		}

		return token;
	}

	protected validateAuthorizedParty(decoded: JWTDecoded) {
		const { aud, azp } = decoded || {};

		if (Array.isArray(aud)) {
			if (!azp) {
				throw new Error('Missing azp claim while aud is an array');
			}

			if (!aud.includes(azp)) {
				throw new Error('Missing azp claim in the aud entries');
			}

			if (!aud.includes(this.config.clientId)) {
				throw new Error(`Unauthorized audience claim`);
			}
		} else {
			if (azp !== this.config.clientId && aud !== this.config.clientId) {
				throw new Error(`Unauthorized audience claim`);
			}
		}
	}

	protected role(specs: string[], decoded: JWTDecoded): boolean {
		const roles = decoded.realm_access?.roles || [];

		return specs.some((it) => roles.includes(it));
	}

	protected resource(specs: string[], decoded: JWTDecoded): boolean {
		const audience =
			(!Array.isArray(decoded.aud) && decoded.aud) ||
			decoded.azp ||
			this.config.clientId;
		const resources = decoded.resource_access?.[audience]?.roles || [];

		return specs.some((it) => resources.includes(it));
	}

	public initialize<T = Array<RequestHandler>>(
		options?: RemoteJWKSetOptions
	) {
		const issuer = `${this.config.url}/realms/${this.config.realm}`;
		const url = new URL(`${issuer}/protocol/openid-connect/certs`);

		this.issuer = issuer;
		this.jwks = createRemoteJWKSet(url, options);

		return [] as T;
	}

	public auth(options?: AuthOptions): RequestHandler {
		const { level, permissions } = options || {};

		const specs = (Array.isArray(permissions) ? permissions : []).filter(
			Boolean
		);
		const validator = (level && this[level]?.bind(this)) || (() => true);

		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const { payload } = await jwtVerify<JWTDecoded>(
					this.getAuthorization(req),
					this.jwks,
					{ issuer: this.issuer }
				);

				this.validateAuthorizedParty(payload);

				if (!validator?.(specs, payload)) {
					res.writeHead(403).end(
						`Forbidden: missing ${level} permission`
					);
				}

				Object.assign(req, { user: payload });

				next?.();
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e);

				res.writeHead(401).end(message);
			}
		};
	}
}
