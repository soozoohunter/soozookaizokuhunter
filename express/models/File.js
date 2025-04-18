'use strict';

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    filename: { type: DataTypes.STRING, allowNull: false },
    fingerprint: { type: DataTypes.STRING(64) },
    ipfs_hash: { type: DataTypes.TEXT },
    cloud_url: { type: DataTypes.TEXT },
    dmca_flag: { type: DataTypes.BOOLEAN, defaultValue: false },
    tx_hash: { type: DataTypes.STRING(66) },
    uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'files',
    timestamps: false
  });

  File.associate = models => {
    File.belongsTo(models.User, { as: 'owner', foreignKey: 'user_id' });
  };

  return File;
};
