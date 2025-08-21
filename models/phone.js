import { DataTypes, UUIDV4 } from "sequelize";
import sequelize from "./index.js";

const Phone = sequelize.define("Phone", {
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
  number : {
    type: DataTypes.STRING,
    allowNull: false,
  },
  number_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active",
  }
}, {
  tableName: 'phone',
  timestamps: true
});

export default Phone;