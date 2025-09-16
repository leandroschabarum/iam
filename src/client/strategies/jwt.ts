import { Configurations, IAM, Strategy } from '../contracts';
import { Configuration } from '../../shared';
import Keycloak, {
	type KeycloakInitOptions,
	type KeycloakTokenParsed
} from 'keycloak-js';

export class Provider extends IAM<Strategy.JWT, Configurations> {
	public readonly strategy: Strategy.JWT;

	protected initialized: boolean = false;

	protected backend: InstanceType<typeof Keycloak>;

	public get token(): KeycloakTokenParsed & { toString(): string } {
		return {
			...this.backend?.tokenParsed,
			toString: () => this.backend?.token || ''
		};
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
