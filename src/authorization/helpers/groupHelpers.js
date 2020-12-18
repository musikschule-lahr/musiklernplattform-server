async function getGroup(context, id) {
  return context.prisma.group.findOne(
    {
      where: { id },
      include: { owner: true },
    },
  );
}
module.exports = {
  getGroup,
};
