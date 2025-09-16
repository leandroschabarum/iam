import { Strategy } from '../../shared';

export { IAM, Strategy } from '../../shared';

export type Configurations = { strategy: Strategy.JWT; config: JwtConfig };

export type JwtConfig = { url: string; realm: string; clientId: string };
