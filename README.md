# express-openapi-backend

```javascript
const { Server } = require("@sbesson/express-openapi-backend");

const server = new Serveur({
    host, // host for listen server
    port, // port for listen server
    ssl: {
      enable, // if set to true use of https (default false)
      keyFile, // key file for https
      certFile, // certificat file for https
    },
    swaggerUiOption, // see https://www.npmjs.com/package/swagger-ui-express
    validateResponses, // allows to control the responses by openapi validator (default true)
  })

const context = {logger}
// server.initializeSite can be run multiple times to, for example, manage different versions of the backend
await server.initializeSite({
  apiSpecFile, // openapi file global
  modulesPaths, // string|array path to modules
  context, // inject services or informations to modules
})
await server.start();
```

Dans le répertoire modulesPath :

```text
module1/
  openapi/
    openapi.yml
  index.js
```

## Exemple d'un module _root_

Ces modules sont les 1er a être initialisé et donc les middleware seront les 1er a être exécuté avant même la mise en place de openapi

structure du fichier `index.js`

```javascript
const { RootModuleInterface } = require("@sbesson/express-openapi-backend");

class Module1 extends RootModuleInterface {
  constructor({ context }) {} // facultatif
  async initialize({ modules }) {} // facultatif, peut ne pas être async !
  async updateRootRouter({ router }) { // peut ne pas être async
    router.use(function middleware(req, res, next) {}) // for exemple
    ...
  }
}
```

## Exemple d'un module _public_ 

Ces modules sont initialisés après la mise en place de openapi et donc les routes devront faire partie de l'API, mais elles seront avant les modules d'authentification permettant donc d'être accédé sans authentification préalable.

structure du fichier `index.js`

```javascript
const { PublicModuleInterface } = require("@sbesson/express-openapi-backend");

class Module1 extends PublicModuleInterface {
  constructor({ context }) {} // facultatif
  async initialize({ modules }) {} // facultatif, peut ne pas être async !
  async routerFactory() { // peut ne pas être async
    const router = express.Router();
    ...
    return router
  }
}
```

## Exemple d'un module _authentification_

Ces modules ont pour but de gérer l'authentification (exemple création de token et validation du token), ils seront donc initialisés après les modules public

structure du fichier `index.js`

```javascript
const { AuthentificationModuleInterface } = require("@sbesson/express-openapi-backend");

class Module1 extends AuthentificationModuleInterface {
  constructor({ context }) {} // facultatif
  async initialize({ modules }) {} // facultatif, peut ne pas être async !
  async updateRootRouter({ router }) {} // peut ne pas être async
    router.use(function middleware(req, res, next) {/* check authentification */}) // for example
    router.post(`/${this.apiPath}/token`, function middleware(req, res, next) {/* create token */})
    ...
  }
}
```

## Exemple d'un module _private_ 

Ces modules seront accessible après validation de l'authentification. Ils seront donc initialisés après les modules d'authentification

Module accessible si identifié
structure du fichier `index.js`

```javascript
const { PrivateModuleInterface } = require("@sbesson/express-openapi-backend");

class Module1 extends PrivateModuleInterface {
  constructor({ context }) {} // facultatif
  async initialize({ modules }) {} // facultatif, peut ne pas être async !
  async routerFactory() { // peut ne pas être async
    const router = express.Router();
    router.get("/", function middleware(req, res, next)); // for example
    ...
    return router
  }
}
```

## Exemple d'un module _error_

Ces modules ont pour but gérer les erreurs et seront donc initialisé en dernier.

error non géré par openapi
structure du fichier `index.js`

```javascript
const { ErrorModuleInterface } = require("@sbesson/express-openapi-backend");

class Module1 extends ErrorModuleInterface {
  constructor({ context }) {} // facultatif
  async initialize({ modules }) {} // facultatif, peut ne pas être async !
  async updateRootRouter({ router }) {} // peut ne pas être async
    // error global
    router.use(function middleware(error, req, res, next) {/* manage error */})
    // error module
    router.use(`/${this.apiPath}`, function errorMiddleware(error, req, res, next) {/* manage error */})
    ...
  }
}
```

## TODO

* [ ] readme.md
