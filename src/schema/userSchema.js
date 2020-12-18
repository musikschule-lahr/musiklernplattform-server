const { gql } = require('apollo-server-express');

const typeDefs = gql`
scalar Date

  type User {
    idUser: Int!
    firstname: String!
    lastname: String!
    username: String!
    birthyear: Int
    mail: String
    phone: String
    instruments: [Instrument]
    teachedInstruments: [Instrument]
    board: UserBoard!
    createdCards: [Card]
    updatedCards: [Card]
    matrixUserId: String
    isActive: Boolean!
    updatedAt: DateTime
    lastLogin: DateTime
    createdAt: DateTime
    relatedTo: [UserRelation]
    relatedBy: [UserRelation]
    groups: [Group]
    matrixUserName: String
  }

  type School {
    idSchool: Int!
    name: String!
    address: String
    zip: String
    city: String
  }

  type Instrument{
    idInstrument: Int!
    name: String!
    icon: String
    instrumentGroup: String
  }

  input UserInput {
    id: Int!
  }

  input InstrumentInput {
    id: Int!
  }

  # Erstmaliges Anlegen von Admin, anderweitiges von Keycloak aus: wird direkt aus Token gelesen, siehe Mutation
  input UserCreateByAdminInput {
    firstname: String!
    lastname: String!
    mail: String!
  }

# Nachdem in Keycloak angelegt wurde
  input UserCreateDataInput {
    firstname: String!
    lastname: String!
    username: String!
    mail: String! # Im Client vorauswahl aus Keycloak, aber Änderung muss möglich sein -> Mail Änderung in unserer DB? Wir Keycloak?
    phone: String
    birthyear: Int!
    instruments: [InstrumentInput]
  }

  input UserUpdateDataInput {
    firstname: String
    lastname: String
    username: String
    mail: String
    phone: String
    birthyear: Int
    instruments: [InstrumentInput]
  }

  type Query {
    getUser: User! @auth #Hiermit kann man prüfen ob alles vorhanden ist
    getUserFromId(where: UserInput!): User! @auth
    getSchoolByUserId(where: UserInput!): School!
    getAllUsers: [User] @auth #admin only @auth
    getInstruments: [Instrument]
    getInstrumentFromId(where: InstrumentInput!): Instrument!
    userCanUseManagement: Boolean! @auth
  }
  type Mutation {
    addUserByAdmin(data: UserCreateByAdminInput!): User! @auth #admin only
    addRegisteredUser(data: UserCreateDataInput!): User! @auth #init with keycloak info
    updateRegisteredUser(data: UserUpdateDataInput!): User! @auth
  }

  type Subscription {
    userChanged(where: UserInput!): User!
  }
`;

module.exports = typeDefs;
