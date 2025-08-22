import { DataTypes, UUIDV4 } from "sequelize";

export default (sequelize) => {
  const Role = sequelize.define("Role", {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
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
    tableName: 'role',
    timestamps: true
  });

  return Role;
};
