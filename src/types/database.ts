type User = {
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
