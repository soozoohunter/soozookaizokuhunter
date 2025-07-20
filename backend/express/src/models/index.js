exports.sequelize = {
    async transaction() {
        return {
            commit: async () => {},
            rollback: async () => {}
        };
    },
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

exports.Scan = {
    create: async (data) => ({ id: 1, ...data })
};

exports.User = {
    findOne: async ({ where }) => null,
    findByPk: async (id) => ({ id, real_name: 'User', email: 'user@example.com' })
};
