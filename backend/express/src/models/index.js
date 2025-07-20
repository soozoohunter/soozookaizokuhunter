exports.sequelize = {
    sync: () => Promise.resolve()
};

exports.File = {
    create: async (data) => ({ id: 1, ...data })
};
