import { DataTypes, UUIDV4 } from "sequelize";
import sequelize from "./index.js";

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
  }
}, {
  tableName: 'file',
  timestamps: true
});

export default File;