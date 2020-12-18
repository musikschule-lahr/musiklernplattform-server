const { rule, inputRule } = require('graphql-shield');
const {
  generateCustomError,
  getUserFromToken,
  getRelation,
  getBoard,
  getBoardFromLane,
  getCard,
  getGroup,
} = require('../helpers');

// Input Validation
const validateAddCard = inputRule()(
  (yup) => yup.object({
    to: yup.object({
      lane: yup.object({}),
      sorting: yup.number().required(),
    }),
    data: yup.object({
      // title: yup.string().trim().min(2, 'Der Titel ist zu kurz.').required(),
      description: yup.string().trim().min(2, 'Die Beschreibung ist zu kurz.').required(),
    }),
  },
  {
    abortEarly: false, // false für Array mit allen Fehlern, true für ersten Fehler
  }),
);

// Ist das Board, auf das zugegriffen wird vom User? -> Prüft BoardInput
const boardInputIsOfRequestingUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const board = await getBoard(context, args.where.id);
  if (!board) return false;
  if (board.board.user) return user.id === board.board.user.id;
  if (board.board.group) return user.id === board.board.group.owner.id;
  return false;
});

// Ist die Lane auf die zugegriffen wird vom User? -> Prüft LaneInput
const laneInputIsOfRequestingUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const board = await getBoardFromLane(context, args.where.id);
  if (!board) return false;
  if (board.board.user) return user.id === board.board.user.id;
  if (board.board.group) return user.id === board.board.group.owner.id;
  return false;
});

const cardLaneInputIsOfRequestingUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const board = await getBoardFromLane(context, args.where.lane.id);
  if (!board) return false;
  if (board.board.user) return user.id === board.board.user.id;
  if (board.board.group) return user.id === board.board.group.owner.id;
  return false;
});

const cardLaneSortingInputIsOfRequestingUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const board = await getBoardFromLane(context, args.to.lane.id);
  if (!board) return false;
  if (board.board.user) return user.id === board.board.user.id;
  if (board.board.group) return user.id === board.board.group.owner.id;
  return false;
});

const userCardInputIsOfRequestingUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const card = await getCard(context, args.where.id);
  // Get Cards und dann check if ID is same
  return card.creator.id === user.id;
});

const userBoardIsAuthorized = rule({ cache: 'strict' })(async (parent, args, context, info) => {
  const relation = await getRelation(context, args.where.id);
  return (relation.length > 0);
});
const userLaneIsAuthorized = rule({ cache: 'strict' })(async (parent, args, context, info) => true);
const userCardIsAuthorized = rule({ cache: 'strict' })(async (parent, args, context, info) => true);
const addUserCardIsAuthorized = rule({ cache: 'strict' })(async (parent, args, context, info) => {
  const board = await getBoardFromLane(context, args.to.lane.id);
  const relation = await getRelation(context, board.board.user.id);
  // Wenn User auswählen darf ob Add erlaubt: hier feingranularer...
  return (relation.length > 0);
});

// Erstmal nur der administering user:
const groupBoardIsAuthorized = rule({ cache: 'strict' })(async (parent, args, context, info) => {
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const group = await getGroup(context, args.where.id);
  return user.id === group.owner.id;
});

const addGroupCardIsAuthorized = rule({ cache: 'strict' })(async (parent, args, context, info) => {
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const group = await getGroup(context, args.group.id);
  return user.id === group.owner.id;
});

module.exports = {
  validateAddCard,
  boardInputIsOfRequestingUser,
  laneInputIsOfRequestingUser,
  cardLaneInputIsOfRequestingUser,
  cardLaneSortingInputIsOfRequestingUser,
  userCardInputIsOfRequestingUser,
  userBoardIsAuthorized,
  userLaneIsAuthorized,
  userCardIsAuthorized,
  addUserCardIsAuthorized,
  addGroupCardIsAuthorized,
  groupBoardIsAuthorized,
};
