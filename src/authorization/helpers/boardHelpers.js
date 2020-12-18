async function getBoardFromUserId(context, userId) {
  return context.dataSources.prisma.board.getUserBoard(
    { where: { userId } },
  );
}

async function getBoard(context, boardId) {
  return context.prisma.board.findOne(
    {
      where: { boardId },
      include: {
        user: true,
        group: true,
      },
    },
  );
}
async function getBoardFromLane(context, laneId) {
  return context.prisma.lane.findOne({
    where: { id: laneId },
    include: {
      board: {
        include: {
          user: true,
          group: { include: { owner: true } },
        },
      },
    },
  });
}
async function getCard(context, id) {
  return context.prisma.card.findOne(
    {
      where: { id },
      include: {
        creator: true,
      },
    },
  );
}
module.exports = {
  getBoardFromUserId,
  getBoard,
  getBoardFromLane,
  getCard,
};
