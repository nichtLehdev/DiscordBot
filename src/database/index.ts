import mysql2 from "mysql2/promise";
import "dotenv/config";

export async function getConnection() {
  const connection = await mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
  });

  return connection;
}
