const { PubSub } = require('apollo-server-express');
const { withFilter } = require('apollo-server');
const { concat } = require('ramda');

const pubsub = new PubSub();
const RELATION_NEW_UNCONFIRMED = 'RELATION_NEW_UNCONFIRMED';
const RELATION_CONFIRMED = 'RELATION_CONFIRMED';
const RELATION_DELETED = 'RELATION_DELETED';
const RELATION_GROUP_DELETED = 'RELATION_GROUP_DELETED';

const resolvers = {
  Query: {
    getSingleRelation: async (obj, args, context, info) => context
      .dataSources.prisma.relation.getSingleRelation(
        args.where,
      ),
    getMyConfirmedRelationsWithUser: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const first = await context.dataSources.prisma.relation.getConfirmedWithRelated(
        { where: { id: user.id, relatedUserId: args.user.id } },
      );
      const second = await context.dataSources.prisma.relation.getConfirmedWithRelated(
        { where: { id: args.user.id, relatedUserId: user.id } },
      );
      return first.concat(second);
    },
    getMyTeachers: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.getRelatedUsersFromRelated(
        { where: { id: user.id, mainRole: 'Teacher', relatedRole: 'Student' } },
        false,
        false,
        false,
      );
    },
    getStudentTeachers: async (obj, args, context, info) => context
      .dataSources.prisma.relation.getRelatedUsersFromRelated(
        { where: { id: args.where.id, mainRole: 'Teacher', relatedRole: 'Student' } },
        true,
        false,
        false,
      ),
    getMyParents: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const related = await context.dataSources.prisma.relation.getRelatedUsersFromRelated(
        { where: { id: user.id, mainRole: 'Parent', relatedRole: 'Student' } },
        false,
        false,
        false,
      );
      return related;
    },
    getStudentParents: async (obj, args, context, info) => context
      .dataSources.prisma.relation.getRelatedUsersFromRelated(
        { where: { id: args.where.id, mainRole: 'Parent', relatedRole: 'Student' } },
        true,
        false,
        true,
      ),
    getMyChildren: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.getRelatedUsers(
        { where: { id: user.id, ownRole: 'Parent', relatedRole: 'Student' } },
        false,
        false,
        true,
      );
    },
    getMyConfirmedStudents: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.getRelatedUsers(
        { where: { id: user.id, ownRole: 'Teacher', relatedRole: 'Student' } },
        true,
        false,
        false,
      );
    },

    getMyUnconfirmedStudents: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      return context.dataSources.prisma.relation.getRelatedUsers(
        { where: { id: user.id, ownRole: 'Teacher', relatedRole: 'Student' } },
        false,
        true,
        true,
      );
    },

    getMyUnconfirmedLessonStudents: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      const test = await context.dataSources.prisma.relation.getUnconfirmedRelatedTeacherLessons(
        { where: { id: user.id } },
      );
      return test;
    },
    getConfirmedWithRelatedStudent: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.getConfirmedWithRelated(
        {
          where: {
            id: user.id, relatedUserId: args.where.id, ownRole: 'Teacher', relatedRole: 'Student',
          },
        },
      );
    },

    // Single userrelation für QR validation
    getSingleChild: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      return context.dataSources.prisma.relation.getSingleRelationFromUser(
        {
          where: {
            myId: user.id, user: args.user, ownRole: 'Parent', relatedRole: 'Student',
          },
        },
      );
    },
    getSingleTeacherFromGroup: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.getSingleRelationFromUserRelated(
        {
          where: {
            myId: user.id, user: args.user, group: args.group, ownRole: 'Teacher', relatedRole: 'Student',
          },
        },
      );
    },
    getSingleTeacherFromLesson: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.getSingleRelationFromUserRelated(
        {
          where: {
            myId: user.id, user: args.user, instrument: args.instrument, ownRole: 'Teacher', relatedRole: 'Student',
          },
        },
      );
    },
    getSingleOffice: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      return context.dataSources.prisma.relation.getSingleRelationFromUser(
        {
          where: {
            myId: args.user.id, user, ownRole: 'Office', relatedRole: 'Teacher',
          },
        },
      );
    },
    getMyOnlyGroupRelatedStudents: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.getMyOnlyGroupRelatedStudents(
        {
          where: args,
        },
      );
    },

  },
  Mutation: {
    addTeacherGroup: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      const relation = context.dataSources.prisma.relation.addRelatedUser(
        {
          user: args.user.id,
          relatedUser: user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          group: args.group.id,
        },
      );
      pubsub.publish(RELATION_NEW_UNCONFIRMED,
        {
          user: args.user.id,
          relatedUser: user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
          group: args.group.id,
          confirmedAt: relation.confirmedAt,
        });
      return relation;
    },
    addTeacher: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.addRelatedUser(
        {
          user: args.user.id,
          relatedUser: user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          instrument: args.instrument.id,
        },
      );
      pubsub.publish(RELATION_NEW_UNCONFIRMED,
        {
          user: args.user.id,
          relatedUser: user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          instrument: args.instrument.id,
          relation: relation.id,
          confirmedAt: relation.confirmedAt,
        });
      return relation;
    },
    addChild: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.addRelatedUser(
        {
          user: user.id,
          relatedUser: args.user.id,
          userRole: 'Parent',
          relatedRole: 'Student',
        },
      );
      pubsub.publish(RELATION_NEW_UNCONFIRMED,
        {
          user: user.id,
          relatedUser: args.user.id,
          userRole: 'Parent',
          relatedRole: 'Student',
          relation: relation.id,
          confirmedAt: relation.confirmedAt,
        });
      return relation;
    },
    addOffice: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.addRelatedUser(
        {
          user: args.user.id,
          relatedUser: user.id,
          userRole: 'Office',
          relatedRole: 'Teacher',
        },
      );
      await context.dataSources.prisma.relation.confirmRelationFromUser(
        {
          where: { id: relation.id },
          time: new Date(),
        },
      );
      await context.dataSources.prisma.relation.addTeacherTimetable(
        user,
      );
      // TODO: Maybe Sub call?
      return relation;
    },
    addTeacherTimetable: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      await context.dataSources.prisma.relation.addTeacherTimetable(
        user,
      );
      return true;
    },
    /* removeStudentLessonRelation: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.removeRelation(
        {
          user: user.id,
          relatedUser: args.user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          instrument: args.instrument.id,
        },
      );

      pubsub.publish(RELATION_DELETED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
          instrument: relation.instrumentId,
          confirmedAt: relation.confirmedAt,
        });

      return true;
    },

    removeStudentGroupRelation: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.removeRelation(
        {
          user: user.id,
          relatedUser: args.user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          group: args.group.id,
        },
      );

      pubsub.publish(RELATION_DELETED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
          group: relation.groupId,
          confirmedAt: relation.confirmedAt,
        });
      pubsub.publish(RELATION_GROUP_DELETED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
          group: relation.groupId,
          confirmedAt: relation.confirmedAt,
        });
      return true;
    }, */

    removeTeacherRelation: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.removeRelation(
        {
          user: args.user.id,
          relatedUser: user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          instrument: args.instrument.id,
        },
      );
      pubsub.publish(RELATION_DELETED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
          instrument: relation.instrumentId,
          confirmedAt: relation.confirmedAt,
        });
      return true;
    },

    removeTeacherGroupRelation: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.removeRelation(
        {
          user: args.user.id,
          relatedUser: user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          group: args.group.id,
        },
      );
      pubsub.publish(RELATION_DELETED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
          group: relation.groupId,
          confirmedAt: relation.confirmedAt,
        });
      pubsub.publish(RELATION_GROUP_DELETED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
          group: relation.groupId,
          confirmedAt: relation.confirmedAt,
        });
      return true;
    },
    removeParentRelation: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.removeRelation(
        {
          user: args.user.id,
          relatedUser: user.id,
          userRole: 'Parent',
          relatedRole: 'Student',
        },
      );
      pubsub.publish(RELATION_DELETED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: 'Parent',
          relatedRole: 'Student',
          relation: relation.id,
          confirmedAt: relation.confirmedAt,
        });
      return true;
    },
    addTeachedInstruments: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.addTeachedInstruments(
        {
          user: user.id,
          data: args.data,
        },
      );
    },
    removeTeachedInstruments: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.removeTeachedInstruments(
        {
          user: user.id,
          data: args.data,
        },
      );
    },
    confirmRelationFromUser: async (obj, args, context, info) => {
      const relation = await context.dataSources.prisma.relation.confirmRelationFromUser(
        args,
      );
      pubsub.publish(RELATION_CONFIRMED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
          confirmedAt: relation.confirmedAt,
        });
      return true;
    },
    removeRelationFromUser: async (obj, args, context, info) => {
      const relation = await context.dataSources.prisma.relation.removeRelationFromUser(
        args,
      );
      pubsub.publish(RELATION_DELETED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: relation.userRole,
          relatedRole: relation.relatedUserRole,
          instrument: relation.instrumentId,
          group: relation.groupId,
          relation: relation.id,
          confirmedAt: relation.confirmedAt,
        });
      return true;
    },
    /* confirmStudentRelations: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relations = await context.dataSources.prisma.relation.confirmStudentRelations(
        {
          user: user.id,
          time: args.time,
          room: args.room,
          data: args.data,
        },
      );
      relations.forEach((relation) => {
        pubsub.publish(RELATION_CONFIRMED,
          {
            user: user.id,
            relatedUser: relation.relatedUser.id,
            userRole: 'Teacher',
            relatedRole: 'Student',
            relation: relation.id,
            confirmedAt: relation.confirmedAt,
          });
      });

      return true;
    },
*/
    confirmParentRelation: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.confirmParentRelation(
        {
          relatedUser: user.id,
          time: args.time,
          room: args.room,
          user: args.user,
        },
      );
      pubsub.publish(RELATION_CONFIRMED,
        {
          user: relation.userId,
          relatedUser: relation.relatedUserId,
          userRole: 'Parent',
          relatedRole: 'Student',
          relation: relation.id,
          confirmedAt: relation.confirmedAt,
        });
      return true;
    },
    addMatrixRooms: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      await context.dataSources.prisma.relation.addMatrixRooms(
        {
          user: user.id,
          relatedUser: args.user.id,
          rooms: args.room,
        },
      );
      await context.dataSources.prisma.relation.addMatrixRooms(
        {
          relatedUser: user.id,
          user: args.user.id,
          rooms: args.room,
        },
      );
      return true;
    },
  },
  Subscription: {
    relationConfirmedSubscription: {
      resolve: (payload, variables) => ({
        idRelation: payload.relation || payload.id || null,
        idUser: payload.user,
        userRole: payload.userRole,
        idRelatedUser: payload.relatedUser,
        relatedUserRole: payload.relatedUserRole,
        idInstrument: payload.instrument || null,
        idGroup: payload.group || null,
        isConfirmed: (payload.confirmedAt !== null),
      }),
      subscribe: withFilter(() => pubsub.asyncIterator(RELATION_CONFIRMED),
        async (payload, variables) => {
          if (variables.where.id === payload.relatedUser || variables.where.id === payload.user) {
            return true;
          }
          return false;
        }),
    },
    relationUnconfirmedSubscription: {
      resolve: (payload, variables) => ({
        idRelation: payload.relation,
        idUser: payload.user,
        userRole: payload.userRole,
        idRelatedUser: payload.relatedUser,
        relatedUserRole: payload.relatedUserRole,
        idInstrument: payload.instrument || null,
        idGroup: payload.group || null,
        isConfirmed: (payload.confirmedAt !== null),
      }),
      subscribe: withFilter(() => pubsub.asyncIterator(RELATION_NEW_UNCONFIRMED),
        async (payload, variables) => {
          if (variables.where.id === payload.relatedUser || variables.where.id === payload.user) {
            return true;
          }
          return false;
        }),
    },
    relationDeletedSubscription: {
      resolve: (payload, variables) => ({
        idRelation: payload.relation,
        idUser: payload.user,
        userRole: payload.userRole,
        idRelatedUser: payload.relatedUser,
        relatedUserRole: payload.relatedUserRole,
        idInstrument: payload.instrument || null,
        idGroup: payload.group || null,
        isConfirmed: (payload.confirmedAt !== null),
      }),
      subscribe: withFilter(() => pubsub.asyncIterator(RELATION_DELETED),
        async (payload, variables) => {
          if (variables.where.id === payload.relatedUser || variables.where.id === payload.user) {
            return true;
          }
          return false;
        }),
    },
    relationGroupDeletedSubscription: {
      resolve: (payload, variables) => ({
        idRelation: payload.relation,
        idUser: payload.user,
        userRole: payload.userRole,
        idRelatedUser: payload.relatedUser,
        relatedUserRole: payload.relatedUserRole,
        idInstrument: null,
        idGroup: payload.group || null,
        isConfirmed: (payload.confirmedAt !== null),
      }),
      subscribe: withFilter(() => pubsub.asyncIterator(RELATION_GROUP_DELETED),
        async (payload, variables) => {
          if (variables.where.id === payload.group) {
            return true;
          }
          return false;
        }),
    },
  },
  UserRelation: {
    idRelation: async (parent, args, context, info) => parent.id,
    idCompound: async (parent, args, context, info) => {
      if (parent.id) return parent.id;
      const compound = `relations-${parent.user.id}-${parent.relatedUser.id}-${parent.userRole}-${parent.relatedUserRole}`;
      return compound;
    },
    isConfirmed: async (parent, args, context, info) => (parent.confirmedAt !== null
      || parent.isConfirmed === true),
    instruments: async (parent, args, context, info) => {
      if (parent.instruments) return parent.instruments;
      if (parent.instrument) return [parent.instrument];
      return null;
    },
    groups: async (parent, args, context, info) => {
      if (parent.groups) return parent.groups;
      if (parent.group) return [parent.group];
      return null;
    },
    user: async (parent, args, context, info) => {
      if (parent.confirmedAt || parent.isConfirmed) return parent.user;
      const {
        id, firstname, lastname, username, keycloakUserId, mail, phone,
      } = parent.user;
      return {
        id, firstname, lastname, username, keycloakUserId, mail, phone,
      };
    },
    relatedUser: async (parent, args, context, info) => {
      if (parent.confirmedAt) return parent.relatedUser;
      const {
        id, firstname, lastname, username, keycloakUserId, mail, phone,
      } = parent.relatedUser;
      return {
        id, firstname, lastname, username, keycloakUserId, mail, phone,
      };
    },
  },
};

module.exports = resolvers;

// Unused Query
/*
    getMyStudents: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      return context.dataSources.prisma.relation.getRelatedUsers(
        { where: { id: user.id, ownRole: 'Teacher', relatedRole: 'Student' } },
        false,
        false,
        false,
      );
    },
    getMyConfirmedParents: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      return context.dataSources.prisma.relation.getRelatedUsersFromRelated(
        { where: { id: user.id, ownRole: 'Parent', relatedRole: 'Student' } },
        true,
        false,
        true,
      );
    },
     getMyUnconfirmedParents: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      return context.dataSources.prisma.relation.getRelatedUsersFromRelated(
        { where: { id: user.id, ownRole: 'Parent', relatedRole: 'Student' } },
        false,
        true,
        true,
      );
    },

    getMyUnconfirmedGroupStudents: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const where = {
        id: user.id, ownRole: 'Teacher', relatedRole: 'Student',
      };
      if (args.where) {
        where.group = args.where.id;
      }
      return context.dataSources.prisma.relation.getMyUnconfirmedGroupStudents(
        {
          where,
        },
      );
    },
    */

// Unused Mutation
/*
    addStudent: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      const relation = context.dataSources.prisma.relation.addRelatedUser(
        {
          user: user.id,
          relatedUser: args.user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          instrument: args.instrument.id,
        },
      );
      return relation;
    },
    addStudentGroup: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.relation.addRelatedUser(
        {
          user: user.id,
          relatedUser: args.user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          group: args.group.id,
        },
      );
    },
    addParent: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );

      const relation = context.dataSources.prisma.relation.addRelatedUser(
        {
          user: args.user.id,
          relatedUser: user.id,
          userRole: 'Parent',
          relatedRole: 'Student',
        },
      );
      return relation;
    },
    removeStudentGroupRelation: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.removeRelation(
        {
          user: user.id,
          relatedUser: args.user.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          group: args.group.id,
        },
      );
      pubsub.publish(RELATION_DELETED,
        {
          user: relation.user.id,
          relatedUser: relation.relatedUser.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
          group: args.group.id,
        });

      return true;
    },
     confirmGroupRelations: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const relation = await context.dataSources.prisma.relation.confirmGroupRelations(
        {
          user: user.id,
          data: args.data,
        },
      );
      pubsub.publish(RELATION_CONFIRMED,
        {
          user: args.user.id,
          relatedUser: relation.relatedUser.id,
          userRole: 'Teacher',
          relatedRole: 'Student',
          relation: relation.id,
        });
      return relation;
    },
    */
