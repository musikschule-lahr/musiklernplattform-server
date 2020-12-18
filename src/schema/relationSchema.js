const { gql } = require('apollo-server-express');

const typeDefs = gql`

  type UserRelation {
    idRelation: Int
    idCompound: String!
    user: User!
    userRole: String!
    relatedUser: User!
    relatedUserRole: String!
    instruments: [Instrument]
    confirmedInstruments: [Boolean]
    instrumentRelationIds: [Int]
    groupRelationIds: [Int]
    groups: [Group]
    confirmedGroups: [Boolean]
    isConfirmed: Boolean
    matrixRoomId: String
  }

  input StudentInstrumentRelationInput{
    user: UserInput!
    instrument: InstrumentInput!
  }
  input StudentGroupRelationInput{
    user: UserInput!
    group: GroupInput!
  }
  input RelationInput{
    id: Int!
  }

  type Query {
    getSingleRelation(where: RelationInput!): UserRelation @auth
    getMyConfirmedRelationsWithUser(user: UserInput!): [UserRelation] @auth
  # getMyStudents: [UserRelation!] @auth
    getMyTeachers: [UserRelation!] @auth
    getMyParents: [UserRelation!] @auth
    getMyChildren: [UserRelation!] @auth
    getStudentTeachers(where: UserInput!): [UserRelation] @auth
    getStudentParents(where: UserInput!): [UserRelation] @auth
  # getMyOffice: [UserRelation!] @auth

    getSingleTeacherFromLesson(user: UserInput!, instrument: InstrumentInput!): UserRelation @auth
    getSingleTeacherFromGroup(user: UserInput!, group: GroupInput!): UserRelation @auth
    getSingleChild(user: UserInput!): UserRelation @auth
    getSingleOffice(user: UserInput!): UserRelation @auth

    getConfirmedWithRelatedStudent(where: UserInput!): [UserRelation] @auth

  # Spezialfälle
    getMyConfirmedStudents: [UserRelation!] @auth
  # getMyConfirmedParents: [UserRelation!]
    getMyUnconfirmedStudents: [UserRelation!] @auth
    getMyUnconfirmedLessonStudents: [UserRelation!] @auth
  # getMyUnconfirmedParents: [UserRelation!]
  # getMyUnconfirmedGroupStudents(where: GroupInput): [UserRelation!]

  # Spezialfall für Matrix: getAllRelations die nur in einer bestimmten Gruppenverbindung sind
    getMyOnlyGroupRelatedStudents(group: GroupInput!): [UserRelation] @auth
  }

  type Mutation {
    confirmRelationFromUser(where: RelationInput!, time: DateTime!, room: String): Boolean! @auth
    removeRelationFromUser(where: RelationInput!): Boolean! @auth
   # confirmStudentRelations(data: [StudentInstrumentRelationInput!], time: DateTime!, room: String): Boolean! @auth
  # confirmGroupRelations(data: [StudentGroupRelationInput!]): Boolean! @auth
    confirmParentRelation(user: UserInput!, time: DateTime, room: String): Boolean! @auth
  # addStudent(user: UserInput!, instrument: InstrumentInput!): UserRelation! @auth
  # addStudentGroup(user: UserInput!, group: GroupInput!): UserRelation! @auth
    addTeacher(user: UserInput!, instrument: InstrumentInput!): UserRelation! @auth
    addTeacherTimetable: Boolean! @auth
    addTeacherGroup(user: UserInput!, group: GroupInput!): UserRelation! @auth
    addChild(user: UserInput!): UserRelation! @auth
    addOffice(user: UserInput!): UserRelation! @auth
  # addParent(user: UserInput!): UserRelation! @auth
  #  removeStudentLessonRelation(user: UserInput!, instrument: InstrumentInput!): Boolean! @auth
   # removeStudentGroupRelation(user: UserInput!, group: GroupInput!): Boolean! @auth
    removeTeacherRelation(user: UserInput!, instrument: InstrumentInput!): Boolean! @auth
    removeTeacherGroupRelation(user: UserInput!, group: GroupInput!): Boolean! @auth
    removeParentRelation(user: UserInput!): Boolean! @auth
    removeChildRelation(user: UserInput!): Boolean! @auth
    addTeachedInstruments( data: [InstrumentInput!]): User! @auth
    removeTeachedInstruments( data: [InstrumentInput!]): User! @auth
  # removeOfficeTeacherRelation(where: UserRelationInput!): UserRelation! @auth
    addMatrixRooms(user: UserInput!, room: String!): Boolean! @auth
  }

type RelationMessage {
  idRelation: Int
  idUser: Int
  userRole: String
  idRelatedUser: Int
  relatedUserRole: String
  idInstrument: Int
  idGroup: Int
  isConfirmed: Boolean!
}

type Subscription {
    relationConfirmedSubscription(where: UserInput!): RelationMessage!
    relationUnconfirmedSubscription(where: UserInput!): RelationMessage!
    relationDeletedSubscription(where: UserInput!): RelationMessage!
    relationGroupDeletedSubscription(where: GroupInput!): RelationMessage!
  }

`;

module.exports = typeDefs;
