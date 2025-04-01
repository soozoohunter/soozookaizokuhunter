module.exports = (sequelize, DataTypes)=>{
  const PlatformAccount = sequelize.define('PlatformAccount',{
    userId: { type: DataTypes.INTEGER, allowNull: false },
    platform: DataTypes.STRING,   // 'tiktok', 'shopee', ...
    accountId: DataTypes.STRING
  },{
    tableName: 'platform_accounts'
  });
  return PlatformAccount;
};
