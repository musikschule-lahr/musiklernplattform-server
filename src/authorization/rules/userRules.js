const { rule, inputRule } = require('graphql-shield');
const {
  generateCustomError,
  getInstrumentsFromIds,
  getRelation,
  getPlans,
  plansList,
} = require('../helpers');

// Input Validation
const phoneRegExp = /^(((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?)?$/;

const validateAddUser = inputRule()(
  (yup) => yup.object({
    data: yup.object({
      firstname: yup.string().min(2, 'Der Vorname ist zu kurz.')
        .required(),
      lastname: yup.string().min(2, 'Der Nachname ist zu kurz.')
        .required(),
      username: yup.string().min(2, 'Der Username ist zu kurz.')
        .required(),
      mail: yup.string().email().required(),
      phone: yup.string().matches(phoneRegExp, 'Telefonnummer ist nicht valide.'),
      // birthyear: //schon durc graphql datestring erledigt
      instruments: yup.array().of(yup.object({ id: yup.number() })),
    }),
  },
  {
    name: 'Fehler bei Validierung von AddUser',
    abortEarly: false, // true stoppt bei erstem false, später also true setzen
  }),
);

const validateUpdateUser = inputRule()(
  (yup) => yup.object({
    data: yup.object({
      firstname: yup.string().default(undefined)
        .min(2, 'Der Vorname ist zu kurz.'),
      lastname: yup.string().default(undefined)
        .min(2, 'Der Nachname ist zu kurz.'),
      username: yup.string().default(undefined)
        .min(2, 'Der Username ist zu kurz.'),
      mail: yup.string().default(undefined).email(),
      phone: yup.string().default(undefined).matches(phoneRegExp, 'Telefonnummer ist nicht valide.'),
      // birthyear: //schon durch graphql datestring erledigt
    }),
  },
  {
    name: 'Fehler bei Validierung von UpdateUser',
    abortEarly: false, // true stoppt bei erstem false, später also true setzen
    strict: false,
  }),
);

// Ist der sendende User der gleiche wie der im OID-Token?
const userInputIsOfRequestingUser = rule()(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await context.dataSources.prisma.user.getUser(
    { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
  );
  if (!user) return false;
  return args.where.id === user.id;
});

// Ist der sendende User NICHT der gleiche wie der im OID-Token?
const userInputIsNotOfRequestingUser = rule()(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await context.dataSources.prisma.user.getUser(
    { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
  );
  if (!user) { return false; }
  if (args.where) return args.where.id !== user.id;
  if (args.user) return args.user.id !== user.id;
  return false;
});

const userIsAuthorized = rule()(async (parent, args, context, info) => {
  const relation = await getRelation(context, args.where.id);
  return (relation.length > 0);
});

// Als weitere Absicherung wg fehlendem Transaktions-Support
const instrumentInputIsValid = rule()(async (parent, args, context, info) => {
  if (!args.data.instruments) return true;
  if (args.data.instruments.length < 1) return true;
  const instruments = await getInstrumentsFromIds(context, args.data.instruments);
  return (instruments.length === args.data.instruments.length);
});

const isNone = rule()(async (parent, args, context, info) => {
  const plans = await getPlans(context);
  // console.log('isNone', plansList, plans, plansList.NONE);
  return plans === plansList.NONE;
});
const isTeacher = rule()(async (parent, args, context, info) => {
  const plans = await getPlans(context);
  // console.log('isTeacher', plansList, plans, plansList.TEACHER);
  return (plans === plansList.TEACHER);
});
const isStudent = rule()(async (parent, args, context, info) => {
  const plans = await getPlans(context);
  // console.log('isStudent', plansList, plans, plansList.STUDENT, plans === plansList.STUDENT);
  return (plans === plansList.STUDENT);
});
const isParent = rule()(async (parent, args, context, info) => {
  const plans = await getPlans(context);
  // console.log(plans, plansList.PARENT);
  return (plans === plansList.PARENT);
});

const userIsSchool = rule()(async (parent, args, context, info) => {
  const school = await context.dataSources.prisma.user.getSchoolByUserId(
    { where: args.user },
  );
  return school !== null;
});

const isAdministratingUser = rule()(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const canUseMgmt = await context.dataSources.prisma.user.userCanUseManagement(
    { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
  );
  return canUseMgmt !== null;
});

module.exports = {
  validateAddUser,
  validateUpdateUser,
  userInputIsNotOfRequestingUser,
  userInputIsOfRequestingUser,
  userIsAuthorized,
  instrumentInputIsValid,
  isNone,
  isTeacher,
  isStudent,
  isParent,
  userIsSchool,
  isAdministratingUser,
};
