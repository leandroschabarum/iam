export enum Strategy {
	JWT = 'jwt',
	SESSION = 'session'
}

export type ConfigurationOptions = {
	strategy: Strategy;
	config: { url: string; realm: string; clientId: string };
};

export type Configuration<
	TStrategy extends Strategy,
	TConfigurations extends ConfigurationOptions
> = Extract<TConfigurations, { strategy: TStrategy }>['config'];

export interface Manager<
	TStrategy extends Strategy,
	TConfigurations extends ConfigurationOptions
> {
	readonly strategy: TStrategy;

	readonly config: Configuration<TStrategy, TConfigurations>;
}

const IAM_KEY = Symbol.for('IAM');
const getGlobalScope = () =>
	globalThis as typeof globalThis & {
		[IAM_KEY]?: InstanceType<typeof IAM>;
	};

export abstract class IAM<
	TStrategy extends Strategy,
	TConfigurations extends ConfigurationOptions
> implements Manager<TStrategy, TConfigurations>
{
	abstract readonly strategy: TStrategy;

	readonly config: Configuration<TStrategy, TConfigurations>;

	public constructor(config: Configuration<TStrategy, TConfigurations>) {
		const globalScope = getGlobalScope();

		if (globalScope?.[IAM_KEY]) {
			return globalScope[IAM_KEY] as this;
		}

		this.config = config;

		globalScope[IAM_KEY] = this;
	}

	public abstract initialize<T>(): T | Promise<T>;
}
