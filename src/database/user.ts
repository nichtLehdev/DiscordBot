import mysql, { RowDataPacket } from "mysql2/promise";
import { getConnection } from ".";
import { UserRow, User } from "../types/database";

// Adjust according to your schema

export async function saveUserToDatabase(user: User): Promise<void> {
  const connection = await getConnection();
  console.log("Trying to save user to database...");
  const [userDb] = await connection.execute<UserRow[]>(
    "SELECT * FROM traewelling_users WHERE id = ?",
    [user.id]
  );
  if (userDb.length > 0) {
    console.log("User already exists in database. Aborting...");
    return;
  }
  await connection.execute(
    "INSERT INTO traewelling_users (id, display_name, name, access_token, refresh_token, valid_until, webhook_secret, webhook_id, webhook_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      user.id,
      user.display_name,
      user.name,
      user.access_token,
      user.refresh_token,
      user.valid_until,
      user.webhook_secret,
      user.webhook_id,
      user.webhook_url,
    ]
  );
  await connection.end();
}

export async function checkDiscordUserInDatabase(
  userId: string
): Promise<boolean | UserRow> {
  const connection = await getConnection();
  const [rows] = await connection.execute<UserRow[]>(
    "SELECT * FROM traewelling_users WHERE dc_id = ?",
    [userId]
  );
  await connection.end();
  return rows.length > 0 ? rows[0] : false;
}

export async function checkTwUserInDatabase(
  userId: number
): Promise<boolean | UserRow> {
  const connection = await getConnection();
  const [rows] = await connection.execute<UserRow[]>(
    "SELECT * FROM traewelling_users WHERE id = ?",
    [userId]
  );
  await connection.end();
  return rows.length > 0 ? rows[0] : false;
}

export async function saveDiscordIdToDatabase(
  userId: string,
  twId: number
): Promise<void> {
  const connection = await getConnection();
  await connection.execute(
    "UPDATE traewelling_users SET dc_id = ? WHERE id = ?",
    [userId, twId]
  );
  await connection.end();
}

export async function getUsers() {
  const connection = await getConnection();
  const [rows] = await connection.execute<UserRow[]>(
    "SELECT * FROM traewelling_users"
  );
  await connection.end();
  const users = rows.map((row) => {
    return {
      id: row.id,
      dc_id: row.dc_id,
      display_name: row.display_name,
    };
  });
  return users;
}

export async function getUserByDiscordId(userId: string) {
  const connection = await getConnection();
  const [rows] = await connection.execute<UserRow[]>(
    "SELECT * FROM traewelling_users WHERE dc_id = ?",
    [userId]
  );
  await connection.end();
  if (rows.length > 0) {
    const row = rows[0];
    return row;
  }
  return null;
}

export async function getUserByTraewellingId(userId: number) {
  const connection = await getConnection();
  const [rows] = await connection.execute<UserRow[]>(
    "SELECT * FROM traewelling_users WHERE id = ?",
    [userId]
  );
  await connection.end();
  if (rows.length > 0) {
    const row = rows[0];
    return row;
  }
  return null;
}
