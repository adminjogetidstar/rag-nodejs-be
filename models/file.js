import { DataTypes, UUIDV4 } from "sequelize";

export default (sequelize) => {
  const File = sequelize.define("File", {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filepath: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    indexed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'file',
    timestamps: true
  });

  return File;
};