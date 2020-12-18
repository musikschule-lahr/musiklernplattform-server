const { rule, inputRule } = require('graphql-shield');
const {
  generateCustomError,
  getUserFromToken,
  getGroup,
} = require('../helpers');

// Ist User Admin der Gruppe?
const groupInputIsOfAdministeringUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const group = await getGroup(context, args.where.id);
  return user.id === group.owner.id;
});
module.exports = {
  groupInputIsOfAdministeringUser,
};
