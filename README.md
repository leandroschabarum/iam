# iam
Identity and access management abstraction for applications.
----

## Getting started:

This package is an Identity and Access Management abstraction built on top of [Keycloak](https://www.keycloak.org).

It provides a simplified interface for handling authentication and authorization in both **backend** and **frontend** applications.


### Installation:

Install the package via `npm`. It supports both server and client side usage.

```bash
npm install @lndr/iam
```

### Development setup:

The IAM application on top of which this package is built is Keycloak. For more information on Keycloak, see [the official documentation](https://www.keycloak.org).

In the repository of this package you can find a `docker-compose.yml` to quickly spin up a Keycloak instance for **development purposes only**. Just run:

```bash
docker-compose up -d
```

All data is stored in the `keycloak/data` folder, which is mounted to the Keycloak instance.


----


## Usage:

When using this package, it is strongly recommended to import the `@lndr/iam/server` or `@lndr/iam/client` in its own module for configuring it and then import that where you want to use it. The examples are based on this approach.


### Server side:

Define the IAM module for a token based authentication/authorization approach:

```typescript
// src/iam.ts
import { JwtProvider } from '@lndr/iam/server';

const iam = new JwtProvider({
    url: 'http://localhost:8080',
    realm: 'my-realm',
    clientId: 'my-client'
});

iam.initialize();

export default iam;
```

Then you can use it in your backend as follows:

```typescript
// src/index.ts
import express from 'express';
import iam from './iam';

const app = express();

app.get('/protected', iam.auth(), (req, res) => {
    // This route is now protected
});
```

You can also opt for a session based authentication/authorization approach:

```typescript
// src/iam.ts
import { SessionProvider } from '@lndr/iam/server';
import session from 'express-session';

const store = new session.MemoryStore();

const iam = new SessionProvider({
    url: 'http://localhost:8080',
    realm: 'my-realm',
    clientId: 'my-client',
    store
});

export const middlewares = [
    session({
        store,
        secret: 'my-secret',
        resave: false,
        saveUninitialized: true,
    }),
    ...iam.initialize(),
];

export default iam;
```

Then you can use it in your backend with the slight difference that it comes with a couple of middlewares to attach to your requests:

```typescript
// src/index.ts
import express from 'express';
import iam, { middlewares } from './iam';

const app = express();

app.use(...middlewares);

app.get('/protected', iam.auth(), (req, res) => {
    // This route is now protected
});
```

### Client side:

On the application you will follow a similar pattern:

```typescript
// src/iam.ts
import { JwtProvider } from '@lndr/iam/client';

const iam = new JwtProvider({
    url: 'http://localhost:8080',
    realm: 'my-realm',
    clientId: 'my-client'
});

export default iam;
```

And then you can use it in your frontend as follows:

```typescript
// src/App.tsx
import React, { useState, useEffect } from 'react';
import iam from './iam';

export default function App() {
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        iam.initialize().then(setAllowed);
    }, []);

    if (!allowed) return <div>Loading...</div>;

    /**
     * When making requests for the backend, add the
     * token `Bearer ${await iam.token.toString()}` to
     * the 'Authorization' headers of your request.
     */
    return <div>Authenticated</div>;
}
```


----


## Notice


This project, **iam**, makes use of the [Keycloak](https://www.keycloak.org) packages published under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).


This package itself is licensed under the [MIT license](./LICENSE).


**Disclaimer:** This project is provided “as is”, without warranty of any kind. The author assumes no responsibility for how this package is used.
