module.exports = (sequelize, DataTypes) => {
  const ScanTask = sequelize.define('ScanTask', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Files',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    result_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: 'ScanTasks',
    timestamps: true,
  });

  ScanTask.associate = models => {
    ScanTask.belongsTo(models.File, { foreignKey: 'file_id' });
  };

  return ScanTask;
};
