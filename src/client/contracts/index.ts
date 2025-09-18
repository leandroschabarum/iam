import { Strategy } from '../../shared';
import { type KeycloakTokenParsed } from 'keycloak-js';

export { IAM, Strategy } from '../../shared';

export interface Token extends KeycloakTokenParsed {
	toString(): Promise<string>;
	then(
		...args: Parameters<Promise<KeycloakTokenParsed>['then']>
	): Promise<KeycloakTokenParsed>;
}

export type Configurations = { strategy: Strategy.JWT; config: JwtConfig };

export type JwtConfig = {
	url: string;
	realm: string;
	clientId: string;
	tokenMinValidity?: number;
};
