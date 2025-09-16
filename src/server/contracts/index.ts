import { Strategy } from '../../shared';
import { type IncomingMessage, type ServerResponse } from 'http';
import { type KeycloakOptions } from 'keycloak-connect';

export { IAM, Strategy } from '../../shared';

export type Request = IncomingMessage;

export type Response = ServerResponse;

export type NextFunction = () => void;

export type RequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction
) => void | Promise<void>;

export type Configurations =
	| { strategy: Strategy.SESSION; config: SessionConfig }
	| { strategy: Strategy.JWT; config: JwtConfig };

export type SessionConfig = KeycloakOptions & {
	url: string;
	realm: string;
	clientId: string;
};

export type JwtConfig = { url: string; realm: string; clientId: string };
