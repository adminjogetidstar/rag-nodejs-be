import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import User from "./user.js";
import UserRole from "./user_role.js";
import Role from "./role.js";
import File from "./file.js";
import Phone from "./phone.js";
import AuditLog from "./audit_log.js";

dotenv.config();

const POSTGRES_HOST = process.env.POSTGRES_HOST;
const POSTGRES_PORT = process.env.POSTGRES_PORT;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;
const POSTGRES_USERNAME = process.env.POSTGRES_USERNAME
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD

const sequelize = new Sequelize(POSTGRES_DATABASE, POSTGRES_USERNAME, POSTGRES_PASSWORD, {
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  dialect: "postgres",
  timezone: "+07:00",
  dialectOptions: {
    useUTC: false,
  },
  logging: false,
});

// Init models
const UserModel = User(sequelize);
const RoleModel = Role(sequelize);
const FileModel = File(sequelize);
const PhoneModel = Phone(sequelize);
const UserRoleModel = UserRole(sequelize);
const AuditLogModel = AuditLog(sequelize)

// 🔗 Relasi One-to-One via UserRole
UserModel.hasOne(UserRoleModel, { foreignKey: "userId", onDelete: "CASCADE" });
UserRoleModel.belongsTo(UserModel, { foreignKey: "userId" });

RoleModel.hasMany(UserRoleModel, { foreignKey: "roleId", onDelete: "CASCADE" });
UserRoleModel.belongsTo(RoleModel, { foreignKey: "roleId" });

export { sequelize, UserModel, RoleModel, FileModel, PhoneModel, UserRoleModel, AuditLogModel };
