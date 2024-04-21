import { RowDataPacket } from "mysql2/promise";
import { getConnection } from ".";
import { ServerRow, UserServerRelationRow } from "../types/database";

export async function checkServerInDatabase(
  serverId: string
): Promise<boolean | ServerRow> {
  if (!serverId || serverId === "") {
    return false;
  }
  const connection = await getConnection();
  const [rows] = await connection.execute<ServerRow[]>(
    "SELECT * FROM traewelling_discord_servers WHERE server_id = ?",
    [serverId]
  );
  await connection.end();
  return rows.length > 0 ? rows[0] : false;
}

export async function addServerToDatabase(
  serverId: string,
  channelId: string
): Promise<void> {
  if (!serverId || serverId === "" || !channelId || channelId === "") {
    throw new Error("Invalid server or channel ID");
  }

  if (await checkServerInDatabase(serverId)) {
    return;
  }

  const connection = await getConnection();
  await connection.execute(
    "INSERT INTO traewelling_discord_servers (server_id, channel_id) VALUES (?, ?)",
    [serverId, channelId]
  );
  await connection.end();
}

export async function checkRelationInDatabase(
  userId: string,
  serverId: string
): Promise<boolean | UserServerRelationRow> {
  if (!userId || userId === "" || !serverId || serverId === "") {
    return false;
  }
  const connection = await getConnection();
  const [rows] = await connection.execute<UserServerRelationRow[]>(
    "SELECT * FROM traewelling_user_server_relations WHERE user_id = ? AND server_id = ?",
    [userId, serverId]
  );
  await connection.end();
  return rows.length > 0 ? rows[0] : false;
}

async function checkRelationInDatabaseById(
  id: number
): Promise<boolean | UserServerRelationRow> {
  if (!id) {
    return false;
  }
  const connection = await getConnection();
  const [rows] = await connection.execute<UserServerRelationRow[]>(
    "SELECT * FROM traewelling_user_server_relations WHERE id = ?",
    [id]
  );
  await connection.end();
  return rows.length > 0 ? rows[0] : false;
}

export async function createRelationInDatabase(
  userId: string,
  serverId: string,
  perms: {
    send: boolean;
    unlisted: boolean;
    followers: boolean;
    private: boolean;
  }
): Promise<void> {
  if (!userId || userId === "" || !serverId || serverId === "") {
    throw new Error("Invalid user or server ID");
  }

  if (await checkRelationInDatabase(userId, serverId)) {
    return;
  }

  const connection = await getConnection();

  await connection.execute(
    "INSERT INTO traewelling_user_server_relations (user_id, server_id, send, unlisted, followers, private) VALUES (?, ?, ?, ?, ?, ?)",
    [
      userId,
      serverId,
      perms.send,
      perms.unlisted,
      perms.followers,
      perms.private,
    ]
  );

  await connection.end();
}

export async function updateRelationInDatabase(
  id: number,
  perms: {
    send: boolean;
    unlisted: boolean;
    followers: boolean;
    pvt: boolean;
  }
): Promise<void> {
  const relationship = await checkRelationInDatabaseById(id);
  if (typeof relationship === "boolean") {
    throw new Error("Relationship does not exist");
  }

  const connection = await getConnection();
  await connection.execute(
    "UPDATE traewelling_user_server_relations SET send = ?, unlisted = ?, followers = ?, private = ? WHERE id = ?",
    [perms.send, perms.unlisted, perms.followers, perms.pvt, id]
  );

  await connection.end();
}
