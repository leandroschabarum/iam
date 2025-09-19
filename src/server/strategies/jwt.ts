import {
	AuthLevel,
	AuthOptions,
	Configurations,
	IAM,
	Token,
	NextFunction,
	Request,
	RequestHandler,
	Response,
	Strategy
} from '../contracts';
import { jose, type RemoteJWKSet, type RemoteJWKSetOptions } from '../../lib';
import { URL } from 'url';

export class Provider extends IAM<Strategy.JWT, Configurations> {
	public readonly strategy: Strategy.JWT;

	protected issuer: string;

	protected _jwks: RemoteJWKSet;

	protected getAuthorization(req: Request) {
		const headers = req?.headers || {};
		const [scheme, token] = headers.authorization?.split(' ') || [];

		if (scheme !== 'Bearer' || !token) {
			throw new Error('Missing Bearer authorization token');
		}

		return token;
	}

	protected getParties(decoded: Token): string[] {
		const { aud, azp } = decoded || {};
		const parties: string[] = [];

		if (Array.isArray(aud)) {
			parties.push(azp!, ...aud);
		} else {
			parties.push(azp!, aud!);
		}

		return parties.filter(Boolean);
	}

	protected getPermissionsValidator(
		level?: string
	): (specs: string[], decoded: Token) => boolean {
		switch (level) {
			case AuthLevel.ROLE: {
				return this.hasRole.bind(this);
			}
			case AuthLevel.RESOURCE: {
				return this.hasResource.bind(this);
			}
			default: {
				return () => true;
			}
		}
	}

	protected isAuthorized(decoded: Token, checkAllParties = false): boolean {
		const parties = this.getParties(decoded);

		if (!decoded?.azp) {
			checkAllParties = true;
		}

		if (checkAllParties) {
			return parties.filter(Boolean).includes(this.config.clientId);
		}

		return parties.filter(Boolean).shift() === this.config.clientId;
	}

	protected hasRole(specs: string[], decoded: Token): boolean {
		const roles = decoded.realm_access?.roles || [];

		return specs.some((role) => roles.includes(role));
	}

	protected hasResource(specs: string[], decoded: Token): boolean {
		const defaultScope = this.getParties(decoded).shift()!;
		const scoped = (spec: string, separator = ':') => {
			const parsed = spec.split(separator);

			if (parsed.length === 1) {
				parsed.unshift(defaultScope);
			}

			return [parsed[0], parsed.slice(1).join(separator)];
		};

		return specs.some((it) => {
			const [scope, resource] = scoped(it);
			const resources = decoded.resource_access?.[scope]?.roles || [];

			return resources.includes(resource);
		});
	}

	public async initialize<T = Array<RequestHandler>>(
		options?: RemoteJWKSetOptions
	) {
		const { createRemoteJWKSet } = await jose();
		const issuer = `${this.config.url}/realms/${this.config.realm}`;
		const url = new URL(`${issuer}/protocol/openid-connect/certs`);

		this.issuer = issuer;
		this._jwks = createRemoteJWKSet(url, options);

		return [] as T;
	}

	public auth(options?: AuthOptions): RequestHandler {
		const { level, permissions } = options || {};

		const isPermitted = this.getPermissionsValidator(level);
		const specs = (Array.isArray(permissions) ? permissions : []).filter(
			Boolean
		);

		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const { jwtVerify } = await jose();
				const { payload } = await jwtVerify<Token>(
					this.getAuthorization(req),
					this._jwks,
					{ issuer: this.issuer }
				);

				if (!this.isAuthorized(payload)) {
					res.writeHead(403).end(`Forbidden: unauthorized party`);
					return;
				}

				if (!isPermitted(specs, payload)) {
					res.writeHead(403).end(`Forbidden: missing permissions`);
					return;
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
