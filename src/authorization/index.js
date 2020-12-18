const {
  shield, and, or, deny, allow,
} = require('graphql-shield');
const rules = require('./rules');

// Add Rules, Validations + Permissions to specific Resolvers, https://github.com/maticzav/graphql-shield
const permissions = shield({
  Query: {
    getUserFromId: allow, // or(rules.userInputIsOfRequestingUser, and(rules.userIsAuthorized, rules.hasConfirmedRelationAsUser), rules.doesntAskPrivateData),
    getUserBoardFromUser: allow, // or(rules.userInputIsOfRequestingUser, rules.userBoardIsAuthorized),
    getUserCards: or(rules.userInputIsOfRequestingUser, rules.userCardIsAuthorized),
    getBoardLanes: or(rules.boardInputIsOfRequestingUser, rules.userBoardIsAuthorized),
    getLaneCards: or(rules.laneInputIsOfRequestingUser, rules.userLaneIsAuthorized),
    getGroupBoard: or(rules.groupInputIsOfAdministeringUser,
      rules.groupBoardIsAuthorized),
    // getGroup: rules.groupInputIsOfAdministeringUser,
    getSingleRelation: or(rules.canConfirmRelation, rules.relationInputIsOfRequestingUser),
    getStudentTeachers: or(rules.userInputIsOfRequestingUser,
      and(rules.userIsAuthorized, rules.hasConfirmedRelationAsUser)),
    getStudentParents: or(rules.userInputIsOfRequestingUser,
      and(rules.userIsAuthorized, rules.hasConfirmedRelationAsUser)),
    // getSingleTeacherFromLesson(user: UserInput!, instrument: InstrumentInput!):UserRelation @auth
    // getSingleTeacherFromGroup(user: UserInput!, group: GroupInput!): UserRelation @auth
    getConfirmedWithRelatedStudent: or(rules.userInputIsOfRequestingUser,
      and(rules.userIsAuthorized, rules.hasConfirmedRelationAsUser)),

  },
  Mutation: {
    addUserByAdmin: rules.isAdministratingUser,
    addUserCard: and(rules.validateAddCard, or(rules.cardLaneSortingInputIsOfRequestingUser,
      rules.addUserCardIsAuthorized)),
    addGroupCard: and(rules.validateAddCard, or(rules.cardLaneSortingInputIsOfRequestingUser,
      rules.addGroupCardIsAuthorized)),
    moveCard: and(rules.cardLaneSortingInputIsOfRequestingUser,
      rules.cardLaneInputIsOfRequestingUser),
    updateCardContent: rules.userCardInputIsOfRequestingUser,
    removeCard: rules.userCardInputIsOfRequestingUser,
    addRegisteredUser: and(rules.validateAddUser, rules.instrumentInputIsValid),
    updateRegisteredUser: and(rules.validateUpdateUser, rules.instrumentInputIsValid),

    addTimeslotUser: and(
      rules.dayTimeInputIsOfAdministeringUser,
      rules.timetableUserInputIsRelatedUser,
    ),
    addTimeslotGroup: and(
      rules.dayTimeInputIsOfAdministeringUser,
      rules.timetableGroupInputIsOfAdministeringUser,
    ),
    updateTimeslotTime: rules.timeslotInputIsOfAdministeringUser,
    updateTimeslotUser: rules.timeslotInputIsOfAdministeringUser,
    updateTimeslotGroup: rules.timeslotInputIsOfAdministeringUser,
    removeTimeslot: rules.timeslotInputIsOfAdministeringUser,

    addGroup: rules.isTeacher,
    removeGroup: rules.groupInputIsOfAdministeringUser,
    addGroupMatrixRoom: rules.groupInputIsOfAdministeringUser,
    updateGroupUsers: rules.groupInputIsOfAdministeringUser,
    addTeacher: or(rules.isNone, rules.isStudent),
    addTeacherTimetable: rules.isTeacher,
    addTeacherGroup: or(rules.isNone, rules.isStudent),
    addChild: or(rules.isNone, rules.isParent),
    addOffice: and(rules.userIsSchool, rules.isNone),
    confirmRelationFromUser: rules.canConfirmRelation,
    removeRelationFromUser: rules.relationInputIsOfRequestingUser,
    confirmParentRelation: rules.isStudent,
    addTeachedInstruments: rules.isTeacher,
    removeTeachedInstruments: rules.isTeacher,

    addComposer: rules.isAdministratingUser,
    updateComposer: rules.isAdministratingUser,
    removeComposer: rules.isAdministratingUser,
    addInterpreter: rules.isAdministratingUser,
    updateInterpreter: rules.isAdministratingUser,
    removeInterpreter: rules.isAdministratingUser,
    addEpoch: rules.isAdministratingUser,
    updateEpoch: rules.isAdministratingUser,
    removeEpoch: rules.isAdministratingUser,
    addTrack: rules.isAdministratingUser,
    updateTrack: rules.isAdministratingUser,
    removeTrackFile: rules.isAdministratingUser,
    removeCoverFile: rules.isAdministratingUser,
    removeTrack: rules.isAdministratingUser,
    addLibElement: rules.isAdministratingUser,
    updateLibElement: rules.isAdministratingUser,
    addCategory: rules.isAdministratingUser,
    updateCategory: rules.isAdministratingUser,
    removeCategory: rules.isAdministratingUser,
    addInstrument: rules.isAdministratingUser,
    updateInstrument: rules.isAdministratingUser,
    removeInstrument: rules.isAdministratingUser,
    addInstrumentation: rules.isAdministratingUser,
    updateInstrumentation: rules.isAdministratingUser,
    removeInstrumentation: rules.isAdministratingUser,
  },
  Subscription: {
    userBoardGotExternalCard: rules.userInputIsOfRequestingUser,
  },
  User: {
    createdCards: or(rules.userInputIsOfRequestingUser, rules.userBoardIsAuthorized),
    updatedCards: or(rules.userInputIsOfRequestingUser, rules.userBoardIsAuthorized),
  },
},
// TODO: Change Fallbackrule to deny
{ allowExternalErrors: true, fallbackRule: allow /* deny */ });

module.exports = permissions;
