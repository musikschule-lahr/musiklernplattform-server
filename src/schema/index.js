const path = require('path');
const { mergeTypeDefs } = require('@graphql-tools/merge');
const { loadFilesSync } = require('@graphql-tools/load-files');
const { KeycloakTypeDefs } = require('keycloak-connect-graphql');

let typesArray = loadFilesSync(
  path.join(__dirname, './**/*.js'),
);
typesArray = typesArray.concat(KeycloakTypeDefs);

module.exports = mergeTypeDefs(typesArray, { all: true });
