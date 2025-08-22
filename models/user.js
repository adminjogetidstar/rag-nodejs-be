import { DataTypes, UUIDV4 } from "sequelize";

export default (sequelize) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    emailHash: {
      type: DataTypes.STRING,
      allowNull: false
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
    tableName: 'user',
    timestamps: true
  });

  return User;
};