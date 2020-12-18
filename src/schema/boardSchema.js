const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar DateTime

  interface Board {
    idBoard: Int!
    lanes: [Lane]!
  }

  type UserBoard implements Board {
    idBoard: Int!
    user: User!
    lanes: [Lane]!
  }

  type Lane {
    idLane: Int!
    title: String!
    #board: Board!
    laneType: String
    sorting: Int
    cards: [Card]
  }

  type Card {
    idCard: Int!
    description: String!
    createdAt: DateTime!
    creator: User!
    updatedAt: DateTime!
    lastEditor: User!
    lane: Lane
    libElements: [LibElement]
  }

  input BoardInput {
    id: Int!
  }

  input LaneInput {
    id: Int!
  }

  input CardInput {
    id: Int!
  }

  input CardLaneInput {
    card: CardInput!
    lane: LaneInput!
  }

  input CardCreateInput {
    description: String!
    libElement: LibElementInput
  }

  input CardUpdateInput {
    description: String
  }

  input CardLaneSortingInput{
    lane: LaneInput!
    sorting: Int!
  }

  type Query {
    getMyUserBoard: UserBoard! @auth
    getUserBoardFromUser(where: UserInput!): UserBoard! @auth

    #benötigt wenn direkt mit Boards alles ausgegeben werden kann? vllt für Main Board selbst?
    getBoardLanes(where: BoardInput!): [Lane] @auth #
    getMyCards: [Card] @auth
    getUserCards(where: UserInput!): [Card] @auth
    getLaneCards(where: LaneInput!): [Card] @auth
    getGroupBoard(where: GroupInput!): GroupBoard!
  }

  type Mutation {
    addUserCard(to: CardLaneSortingInput, data: CardCreateInput): Card! @auth
    addGroupCard(to: CardLaneSortingInput, data: CardCreateInput, group: GroupInput!): Card! @auth
    moveCard(where: CardLaneInput, to: CardLaneSortingInput): Card! @auth #Karte verschoben innerhalb Lane oder in andere Lane
    updateCardContent(where: CardInput, data: CardUpdateInput): Card! @auth #Inhalt der Karte verändert
    removeCard(where: CardInput): Boolean!
  }

# Ermöglicht feingranularere Updates -> so aktuell nicht im Client
enum BoardMutationList  {
  BOARD_CHANGED
  LANE_CHANGED
  CARD_CHANGED
}

type MessageType {
  type: BoardMutationList!
  changedId: Int!
}
type UserBoardSubscriptionMessage {
  messages: [MessageType!]
  user: Int!
  initiatedBy: Int!
}

  type Subscription {
    userBoardChanged(where: UserInput!): UserBoardSubscriptionMessage!
    userBoardGotExternalCard(where: UserInput!): UserBoardSubscriptionMessage!
  }
`;

module.exports = typeDefs;
