exports.sequelize = {
    sync: () => Promise.resolve()
};

exports.File = {
    create: async (data) => ({ id: 1, update: async ()=>{}, ...data }),
    findByPk: async (id) => ({ id, certificate_path: `/app/uploads/certificates/certificate_${id}.pdf` }),
    findOne: async ({ where }) => {
        if (where && where.fingerprint === 'existing') {
            return { id: 99 };
        }
        return null;
    }
};
