import { DataTypes, UUIDV4 } from "sequelize";

export default (sequelize) => {
  const UserRole = sequelize.define("UserRole", {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      get() {
        const raw = this.getDataValue("createdAt");
        return raw ? new Date(raw).toLocaleString() : null;
      }
    },
    updatedAt: {
      type: DataTypes.DATE,
      get() {
        const raw = this.getDataValue("updatedAt");
        return raw ? new Date(raw).toLocaleString() : null;
      }
    }
  }, {
    tableName: 'user_role',
    timestamps: true
  });

  return UserRole;
};