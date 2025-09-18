import { Configurations, IAM, Strategy, Token } from '../contracts';
import { Configuration } from '../../shared';
import Keycloak, { type KeycloakInitOptions } from 'keycloak-js';

export class Provider extends IAM<Strategy.JWT, Configurations> {
	public readonly strategy: Strategy.JWT;

	protected initialized: boolean = false;

	protected backend: Keycloak;

	public get token(): Token {
		return {
			...this.backend?.tokenParsed,
			toString: async () => {
				await this.refresh();
				return this.backend?.token || '';
			},
			then: async (resolve, reject) => {
				try {
					await this.refresh();

					const parsed = { ...this.backend?.tokenParsed };

					return resolve ? resolve(parsed) : parsed;
				} catch (e) {
					if (!reject) throw e;

					return reject(e);
				}
			}
		};
	}

	protected async refresh() {
		if (!this.backend.isTokenExpired(this.config.tokenMinValidity)) return;

		await this.backend.updateToken(this.config.tokenMinValidity);
	}

	public constructor(config: Configuration<Strategy.JWT, Configurations>) {
		super(config);
		this.backend = new Keycloak(this.config);
	}

	public initialize<T = Promise<boolean>>(options?: KeycloakInitOptions) {
		if (!this.initialized) {
			this.initialized = true;
			return this.backend.init({
				onLoad: 'login-required',
				...options
			}) as T;
		}

		return Promise.resolve<boolean>(this.initialized) as T;
	}
}
