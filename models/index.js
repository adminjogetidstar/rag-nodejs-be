import { Sequelize } from "sequelize";
import dotenv from "dotenv";

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
});

export default sequelize;