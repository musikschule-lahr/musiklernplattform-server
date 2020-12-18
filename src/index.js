const { execute, subscribe } = require('graphql');
const dotenv = require('dotenv');
const express = require('express');
const { ApolloServer, makeExecutableSchema } = require('apollo-server-express');
const { applyMiddleware } = require('graphql-middleware');
const { PrismaClient } = require('@prisma/client');
const Keycloak = require('keycloak-connect');
const {
  KeycloakContext, KeycloakSchemaDirectives,
  KeycloakSubscriptionHandler, KeycloakSubscriptionContext,
} = require('keycloak-connect-graphql');
const {
  DateTimeResolver, TimeResolver, DateResolver,
} = require('graphql-scalars');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const typesArray = require('./schema');
const resolversArray = require('./resolvers');
const datasources = require('./dataSources');
const permissions = require('./authorization');

// add dotenv
dotenv.config();

// Instance of prisma for resolver (NOT datasource) specific queries, can be removed if unused
const prisma = new PrismaClient();

const app = express();

// Initialize keycloak from keycloak.json
const keycloak = new Keycloak({});
const graphqlPath = process.env.GRAPHQL_PATH; // /graphql
app.use(`/${graphqlPath}`, keycloak.middleware());

// Add GraphQL-iso-date scalars: https://www.npmjs.com/package/graphql-iso-date for schema stitching
resolversArray.DateTime = DateTimeResolver;
resolversArray.Time = TimeResolver;
resolversArray.Date = DateResolver;

async function start() {
  // Stitch schema from schema + resolvers, add keycloak directives
  const schema = makeExecutableSchema({
    typeDefs: typesArray,
    resolvers: resolversArray,
    schemaDirectives: {
      auth: KeycloakSchemaDirectives.auth,
      hasRole: KeycloakSchemaDirectives.hasRole,
    },
  });

  // Add Permissions / Rules / Authorization
  const schemaWithMiddleware = applyMiddleware(schema, permissions);

  /* Apollo Server with stitched schema + rules,
     add datasources and prisma instance (NOT datasource)
    + keycloak context for auth token based stuff
  */
  const server = new ApolloServer({
    schema: schemaWithMiddleware,
    dataSources: () => (datasources),
    context: ({ req }) => ({
      kauth: new KeycloakContext({ req }),
      prisma,
    }),
    playground: {
      subscriptionEndpoint:
      `ws://${process.env.SERVER_URL}:${process.env.SERVER_PORT}/${process.env.GRAPHQL_SUBSCRIPTION_PATH}`,
    },
  });
  server.applyMiddleware({ app });

  const httpServer = app.listen({ port: process.env.SERVER_PORT }, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at http://${process.env.SERVER_URL}:${process.env.SERVER_PORT}/${graphqlPath}`);
  });

  const keycloakSubscriptionHandler = new KeycloakSubscriptionHandler({ keycloak });
  // eslint-disable-next-line no-unused-vars
  const subscriptionServer = new SubscriptionServer({
    execute,
    subscribe,
    schema: server.schema,
    // eslint-disable-next-line no-unused-vars
    onConnect: async (connectionParams, websocket, connectionContext) => {
      const token = await keycloakSubscriptionHandler.onSubscriptionConnect(connectionParams);
      return {
        kauth: new KeycloakSubscriptionContext(token),
        dataSources: { ...datasources },
      };
    },
  }, {
    server: httpServer,
    path: `/${process.env.GRAPHQL_SUBSCRIPTION_PATH}`,
  });
}

// eslint-disable-next-line no-console
start().catch((err) => console.error(err));
