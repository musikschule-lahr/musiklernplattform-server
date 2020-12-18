const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Group{
    idGroup: Int!
    name: String!
    owner: User!
    relations: [UserRelation]
    board: Board
    matrixRoomId: String
  }

  type GroupBoard implements Board {
    idBoard: Int!
    group: Group!
    lanes: [Lane]!
  }

  input GroupInput{
      id: Int!
  }

  input GroupAddInput{
        name: String!
  }

  input GroupUpdateInput{
        name: String
  }

  type Query {
    getGroupsOfOwner: [Group] @auth
    getGroupsOfUser: [Group] @auth
    getGroup(where: GroupInput!) : Group @auth
  }

  type Mutation {
    addGroup(data: GroupAddInput!): Group! @auth
    removeGroup(where: GroupInput!) : Int @auth
    addGroupMatrixRoom(where: GroupInput!, room: String!): Boolean! @auth
    updateGroupUsers(where: GroupInput!, addusers: [UserInput], removeusers: [UserInput], time: DateTime): Group @auth #Problem: Await until all changes are synced -> cannot query group after changes
  }
`;

module.exports = typeDefs;
