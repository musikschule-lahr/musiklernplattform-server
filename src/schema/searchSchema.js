const { gql } = require('apollo-server-express');

const typeDefs = gql`
  enum DateFilterEnum{
    GT
    GTE
    LT
    LTE
    EQ
  }

  input DateFilter{
    value: Int!
    sorting: [DateFilterEnum!]
  }

  input ComposerFilterableInput{
    firstname: String
    lastname: String
    #yearOfBirth: DateFilter
    #yearOfDeath: DateFilter
  }
  input InterpreterFilterableInput{
    name: String
  }
  input EpochInput{
    id: Int!
  }
  input DifficultyInput{
    min: Int!
    max: Int!
  }
  input LibElementFilterableInput{
    title: String
    comment: String
    composer: ComposerFilterableInput
    difficulty: DifficultyInput
    instruments: [InstrumentInput]
    epochs: [EpochInput]
    categories: [CategoryFilterableInput]
    playerType: String
    interpreter: InterpreterFilterableInput
  }
  enum FilterEnum{
    TITLE
    COMPOSER
    INTERPRETER
    COMPOSER_FIRSTNAME
    COMPOSER_LASTNAME
    DIFFICULTYLOWER
    DIFFICULTYHIGHER
  }
  enum DirectionEnum{
    ASC
    DESC
  }
  input LibElementSortableInput{
    which: FilterEnum!
    direction: DirectionEnum!
  }

  input CategoryFilterableInput{
    id: CategoryInput!
    withImmediateChildren: Boolean # Only next level of children
    withAllChildren: Boolean # Until no more children can be found
    withimmediateParents: Boolean # with all that hve this as child
    withAllParents: Boolean # with all parents until rootline
  }


  type Query {
    filterLibElements(filter: LibElementFilterableInput!, sorting: LibElementSortableInput): [LibElement] @auth
  }

`;

module.exports = typeDefs;
