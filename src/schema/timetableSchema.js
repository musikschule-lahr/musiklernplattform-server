const { gql } = require('apollo-server-express');

const typeDefs = gql`
scalar Time

type Timetable{
    idTimetable: Int!
    days: [Day!]
}

type Day{
    idDay: Int!
    day: String!
    timeslots: [Timeslot!]
}

type Timeslot{
    idTimeslot: Int!
    time: Time!
    group: Group
    user: User
}

input DayInput{
    id: Int!
}
input TimeslotInput{
    id: Int!
}

input DayTimeInput{
    day: DayInput!
    time: Time!
}

type Query{
    getTimetable: Timetable @auth
}

type Mutation{
    addTimeslotUser(where: DayTimeInput!, user: UserInput!): Timeslot! @auth
    addTimeslotGroup(where: DayTimeInput!, group: GroupInput!): Timeslot! @auth
    updateTimeslotTime(where: TimeslotInput!, to: DayTimeInput!): Timeslot! @auth
    # Datum oder User/Group ändern
    updateTimeslotUser(where: TimeslotInput!, to: DayTimeInput, target: UserInput!): Timeslot! @auth
    updateTimeslotGroup(where: TimeslotInput!, to: DayTimeInput, target: GroupInput!): Timeslot! @auth
    removeTimeslot(where: TimeslotInput!): Timeslot! @auth
}

`;

module.exports = typeDefs;
