import { Strategy } from '../../shared';
import { JWTPayload } from 'jose';
import { type KeycloakOptions } from 'keycloak-connect';
import { type IncomingMessage, type ServerResponse } from 'http';

export { IAM, Strategy } from '../../shared';

export type Request = IncomingMessage;

export type Response = ServerResponse;

export type NextFunction = () => void;

export type RequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction
) => void | Promise<void>;

export interface Token extends JWTPayload {
	azp?: string;
	realm_access?: { roles: string[] };
	resource_access?: { [clientId: string]: { roles: string[] } };
}

export enum AuthLevel {
	ROLE = 'role',
	RESOURCE = 'resource'
}

export type AuthOptions = { level: string; permissions: string[] };

export type Configurations =
	| { strategy: Strategy.SESSION; config: SessionConfig }
	| { strategy: Strategy.JWT; config: JwtConfig };

export type SessionConfig = KeycloakOptions & {
	url: string;
	realm: string;
	clientId: string;
};

export type JwtConfig = { url: string; realm: string; clientId: string };
