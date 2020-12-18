const path = require('path');
const { loadFilesSync } = require('@graphql-tools/load-files');

// Füge alle Rules zu einm Objekt
const rules = loadFilesSync(path.join(__dirname, './**/*')); // auto-ignoriert index.js

// Formatiere für GraphQL-Shield
const rulesObject = {};
rules.forEach((ruleCollection) => {
  Object.entries(ruleCollection).forEach(([key, value]) => {
    rulesObject[key] = value;
  });
});
module.exports = rulesObject;
