import { RowDataPacket } from "mysql2";

export type User = {
  id: number;
  dc_id: string | null;
  display_name: string;
  name: string;
  access_token: string;
  refresh_token: string;
  valid_until: Date;
  webhook_secret: string;
  webhook_id: number;
  webhook_url: string;
};

export type Server = {
  id: number;
  server_id: string;
  channel_id: string;
};

export type UserServerRelation = {
  id: number;
  user_id: string;
  server_id: string;
  send: boolean;
  unlisted: boolean;
  followers: boolean;
  private: boolean;
};

export type UserRow = RowDataPacket & User;
export type ServerRow = RowDataPacket & Server;
export type UserServerRelationRow = RowDataPacket & UserServerRelation;
