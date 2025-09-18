import {
	AuthLevel,
	AuthOptions,
	Configurations,
	IAM,
	RequestHandler,
	Strategy
} from '../contracts';
import { Configuration } from '../../shared';
import Keycloak from 'keycloak-connect';

export class Provider extends IAM<Strategy.SESSION, Configurations> {
	public readonly strategy: Strategy.SESSION;

	protected _backend: InstanceType<typeof Keycloak>;

	protected roleBasedHandler(specs: string[]): RequestHandler {
		return this._backend.protect((token) =>
			specs.some((it) => token.hasRole(it))
		);
	}

	protected resourceBasedHandler(specs: string[]): RequestHandler {
		return this._backend.enforcer(specs);
	}

	public constructor(
		config: Configuration<Strategy.SESSION, Configurations>
	) {
		super(config);
		const { url, realm, clientId, ...options } = this.config;
		this._backend = new Keycloak(options, {
			'confidential-port': 0,
			'ssl-required': 'external',
			'auth-server-url': url,
			resource: clientId,
			realm: realm
		});
	}

	public initialize<T = Array<RequestHandler>>(options?: {
		admin?: string;
		logout?: string;
	}) {
		return this._backend.middleware(options) as T;
	}

	public auth(options?: AuthOptions): RequestHandler {
		const { level, permissions } = options || {};

		const specs = (Array.isArray(permissions) ? permissions : []).filter(
			Boolean
		);

		switch (level) {
			case AuthLevel.ROLE: {
				return this.roleBasedHandler(specs);
			}
			case AuthLevel.RESOURCE: {
				return this.resourceBasedHandler(specs);
			}
		}

		return this._backend.protect();
	}
}
