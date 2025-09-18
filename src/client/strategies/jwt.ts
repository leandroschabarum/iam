import { Configurations, IAM, Strategy, Token } from '../contracts';
import { Configuration } from '../../shared';
import Keycloak, { type KeycloakInitOptions } from 'keycloak-js';

export class Provider extends IAM<Strategy.JWT, Configurations> {
	public readonly strategy: Strategy.JWT;

	protected initialized: boolean = false;

	protected _backend: Keycloak;

	public get token(): Token {
		return {
			...this._backend?.tokenParsed,
			toString: async () => {
				await this.refresh();
				return this._backend?.token || '';
			},
			then: async (resolve, reject) => {
				try {
					await this.refresh();

					const parsed = { ...this._backend?.tokenParsed };

					return resolve ? resolve(parsed) : parsed;
				} catch (e) {
					if (!reject) throw e;

					return reject(e);
				}
			}
		};
	}

	protected async refresh() {
		if (!this.initialized || !this._backend?.authenticated) return;

		if (!this._backend.isTokenExpired(this.config.tokenMinValidity)) return;

		await this._backend.updateToken(this.config.tokenMinValidity);
	}

	public constructor(config: Configuration<Strategy.JWT, Configurations>) {
		super(config);
		this._backend = new Keycloak(this.config);
	}

	public initialize<T = Promise<boolean>>(options?: KeycloakInitOptions) {
		if (!this.initialized) {
			this.initialized = true;
			return this._backend.init({
				onLoad: 'login-required',
				...options
			}) as T;
		}

		return Promise.resolve<boolean>(this._backend?.authenticated) as T;
	}

	public get login() {
		return this._backend.login.bind(this._backend);
	}

	public get logout() {
		return this._backend.logout.bind(this._backend);
	}
}
