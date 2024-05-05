import { getConnection } from ".";
import { CheckinRow } from "../types/database";

export async function addCheckin(status: TW_Status) {
  const connection = await getConnection();
  const query = "INSERT INTO traewelling_checkins VALUES (?,?,?,?,?,?,?,?,?,?)";

  await connection.execute(query, [
    status.id,
    status.user,
    status.train.origin.id,
    status.train.destination.id,
    status.train.origin.rilIdentifier,
    status.train.destination.rilIdentifier,
    `${status.train.category} ${status.train.number}`,
    status.train.duration,
    status.train.distance,
    0,
  ]);
  await connection.end();
}

export async function checkCheckinInDb(id: number) {
  const connection = await getConnection();
  const [rows] = await connection.execute<CheckinRow[]>(
    "SELECT * FROM traewelling_checkin_server_relations WHERE id = ?",
    id
  );
  await connection.end();
  return rows.length > 0 ? rows[0] : false;
}

export async function addCheckinRelation(
  statusId: number,
  serverId: string,
  msgId: string
) {
  const connection = await getConnection();
  await connection.execute(
    "INSERT INTO traewelling_checkin_server_relations (checkin_id, server_id, message_id) VALUES (?,?,?)",
    [statusId, serverId, msgId]
  );
  await connection.end();
}
