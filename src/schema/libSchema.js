const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type LibElement{
    idLibElement: Int!
    productionNo: String!
    createdAt: DateTime!
    updatedAt: DateTime
    author: User
    metaData: MetaData!
    categories: [Category]
    instruments: [Instrument]
    playerPath: String
    playerType: String!
    tracks: [Track!]
  }

  type Composer {
    idComposer: Int!
    firstname: String
    lastname:  String
    yearOfBirth: String
    yearOfDeath: String
  }

  type Interpreter {
    idInterpreter: Int!
    name: String
  }

  type Epoch {
    idEpoch: Int!
    code: String!
    description: String!
  }

  type Track {
    idTrack: Int!
    title: String
    isVideo: Boolean!
    filePath: String
    sorting: Int
  }

  type Instrumentation{
    idInstrumentation: Int!
    name: String
  }

  type MetaData {
    idMetaData: Int!
    title: String!
    shortTitle: String
    comment: String
    composer: Composer
    interpreter: Interpreter
    epoch: Epoch
    movement: String
    difficultyMin: Int
    difficultyMax: Int
    coverImagePath: String
    tuning: Int
    yearOfRecording: Int
    instrumentation: Instrumentation
   # ageRange: AgeRange
   # isInYouthTalent: Boolean
   # key: Key
  }

  type Category {
    idCategory: Int!
    name: String
    parent: Category
    children: [Category]
  }

  input LibElementInput{
    id: Int!
  }

  input LibElementPathInput{
    pathId: String!
  }

  input LibElementCreateInput{
    playerType: String!
    productionNo: String!
    metadata: MetaDataCreateInput!
    instruments: [InstrumentInput]
    categories: [CategoryInput]
  }

  input LibElementUpdateInput{
    playerType: String
    productionNo: String
    metadata: MetaDataUpdateInput
    instruments: [InstrumentInput]
    categories: [CategoryInput]
  }
  input CategoryInput{
    id: Int!
  }
  input ComposerInput{
    id: Int!
  }
  input EpochInput{
    id: Int!
  }
  input InterpreterInput{
    id: Int!
  }
  input InstrumentationInput{
    id: Int!
  }
  input ComposerCreateInput{
    firstname: String!
    lastname: String!
    yearOfBirth: Int
    yearOfDeath: Int
  }
  input ComposerUpdateInput{
    firstname: String
    lastname: String
    yearOfBirth: Int
    yearOfDeath: Int
  }
  input InterpreterCreateInput{
    name: String!
  }
  input InterpreterUpdateInput{
    name: String
  }
  input EpochCreateInput{
    code: String!
    description: String!
  }
  input EpochUpdateInput{
    code: String
    description: String
  }
  input InstrumentationCreateInput{
    name: String!
  }
  input InstrumentationUpdateInput{
    name: String
  }
  input InstrumentCreateInput{
    name: String!
    icon: String
    instrumentGroup: String
  }
  input InstrumentUpdateInput{
    name: String
    icon: String
    instrumentGroup: String
  }
  input MetaDataCreateInput{
    title: String!
    shortTitle: String!
    composer: ComposerInput
    interpreter: InterpreterInput
    instrumentation: InstrumentationInput
    epoch: EpochInput!
    comment: String
    movement: String
    difficultyMin: Int
    difficultyMax: Int
    coverPath: String
    tuning: Int
    yearOfRecording: Int
  }

  input MetaDataUpdateInput{
    title: String
    shortTitle: String
    composer: ComposerInput
    interpreter: InterpreterInput
    instrumentation: InstrumentationInput
    epoch: EpochInput
    comment: String
    movement: String
    difficultyMin: Int
    difficultyMax: Int
    coverImagePath: String
    tuning: Int
    yearOfRecording: Int
  }

  input CategoryCreateInput{
    name: String!
    parent: CategoryInput
    children: [CategoryInput]
  }

  input CategoryUpdateInput{
    name: String
    parent: CategoryInput
    children: [CategoryInput]
  }

  input TrackInput {
    id: Int!
  }
  input TrackCreateInput {
    title: String!
    isVideo: Boolean!
    sorting: Int
  }
  input TrackUpdateInput {
    title: String
    filePath: String
    sorting: Int
  }

  type Query {
    getComposer(where: ComposerInput!): Composer! @auth
    getComposers: [Composer!] @auth
    getInterpreters: [Interpreter!] @auth
    getLibElement(where: LibElementInput!): LibElement! @auth
    getLibElementFromPath(where: LibElementPathInput!): LibElement! @auth
    getCategory(where: CategoryInput!): Category @auth
    getCategories: [Category!] @auth
    getEpochs: [Epoch!] @auth
    getInstrumentations: [Instrumentation!] @auth
   }

  type Mutation {
    addComposer(data: ComposerCreateInput!): Composer! @auth
    updateComposer(where: ComposerInput!, data: ComposerUpdateInput!): Composer! @auth
    removeComposer(where: ComposerInput!): Boolean! @auth
    addInterpreter(data: InterpreterCreateInput!): Interpreter! @auth
    updateInterpreter(where: InterpreterInput!, data: InterpreterUpdateInput!): Interpreter! @auth
    removeInterpreter(where: InterpreterInput!): Boolean! @auth
    addEpoch(data: EpochCreateInput!): Epoch! @auth
    updateEpoch(where: EpochInput!, data: EpochUpdateInput!): Epoch! @auth
    removeEpoch(where: EpochInput!): Boolean! @auth
    addInstrumentation(data: InstrumentationCreateInput!): Instrumentation! @auth
    updateInstrumentation(where: InstrumentationInput!, data: InstrumentationUpdateInput!): Instrumentation! @auth
    removeInstrumentation(where: InstrumentationInput!): Boolean! @auth
    addTrack(libElement: LibElementInput!, data: TrackCreateInput!): Track @auth
    updateTrack(where: TrackInput!, data: TrackUpdateInput!): Track @auth
    removeTrackFile(where: TrackInput!): Track! @auth
    removeCoverFile(where: LibElementInput!): Boolean @auth
    removeTrack(where: TrackInput!): Boolean @auth
    addLibElement(data: LibElementCreateInput!): LibElement! @auth
    updateLibElement(where: LibElementInput!,data: LibElementUpdateInput!): LibElement! @auth
    addCategory(data: CategoryCreateInput!): Category! @auth
    updateCategory(where: CategoryInput!, data: CategoryUpdateInput!): Category! @auth
    removeCategory(where: CategoryInput!): Boolean! @auth
    addInstrument(data: InstrumentCreateInput!): Instrument! @auth
    updateInstrument(where: InstrumentInput!, data: InstrumentUpdateInput!): Instrument! @auth
    removeInstrument(where: InstrumentInput!): Boolean! @auth
  }
`;

module.exports = typeDefs;
