const tokenRequester = require('keycloak-request-token');
const keycloak = require('../../keycloak.json');

if (!process.env.npm_config_user || !process.env.npm_config_password) console.log('Bitte das Skript mit den Logindaten aufrufen: npm run keycloak:grant --user=<user> --password=<password>');
else {
  const username = process.env.npm_config_user.split('=');
  const password = process.env.npm_config_password.split('=');

  const baseUrl = keycloak['auth-server-url'].slice(0, -1);
  const settings = {
    username,
    password,
    grant_type: 'password',
    client_id: keycloak.resource,
    realmName: keycloak.realm,
  };
  console.log(`For client ${keycloak.resource} in realm ${keycloak.realm}`);

  tokenRequester(baseUrl, settings)
    .then((token) => {
      const headers = `{"Authorization": "Bearer ${token}"}`;
      console.log('Kopiere folgendes in http headers:');
      console.log(headers);
    }).catch((err) => {
      console.log('err', err);
    });
}
