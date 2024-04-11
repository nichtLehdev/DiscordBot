import { saveUserToDatabase } from "../database";

export async function oauthCallback(req: any, res: any) {
  if (!req.query.code) {
    res.send("Error: No code found in query string");
    return;
  }
  // get the code from the query string
  const code = req.query.code;

  const formData = new URLSearchParams();
  formData.append("grant_type", "authorization_code");
  formData.append("code", code as string);
  formData.append("client_id", process.env.TW_CLIENT_ID!);
  formData.append("client_secret", process.env.TW_CLIENT_SECRET!);
  formData.append("redirect_uri", process.env.TW_REDIRECT_URI!);
  formData.append("trwl_webhook_url", process.env.TW_WEBHOOK_URL!);
  formData.append(
    "trwl_webhook_events",
    "checkin_create,checkin_update,checkin_delete,notification"
  );

  const response = await fetch(process.env.TW_OAUTH_TOKEN!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const json = await response.json();

  if (!json) {
    res.send("Error: No JSON response from OAuth2 server");
    return;
  }

  const access_token = json.access_token;
  const refresh_token = json.refresh_token;
  const expires_in = json.expires_in;

  if (!access_token || !refresh_token || !expires_in) {
    res.send("Error: Missing access token, refresh token or expires in");
    return;
  }

  console.log(json);

  const userResponse = await fetch(process.env.TW_API_URL + "/auth/user", {
    headers: {
      Authorization: "Bearer " + access_token,
      Accept: "application/json",
    },
  });

  const userJson = await userResponse.json();

  if (!userJson) {
    res.send("Error: No JSON response from user endpoint");
    return;
  }

  console.log(userJson);

  const user = userJson.data;

  if (user.id === undefined) {
    res.send("Error: No user ID found in response");
    return;
  }

  const dbUser: User = {
    id: user.id,
    dc_id: null,
    display_name: user.display_name,
    name: user.name,
    access_token: access_token,
    refresh_token: refresh_token,
    valid_until: new Date(Date.now() + expires_in * 1000),
    webhook_secret: "",
    webhook_id: 0,
    webhook_url: process.env.TW_WEBHOOK_URL!,
  };

  await saveUserToDatabase(dbUser);

  res.send(
    "User registered successfully! Please copy this message and send it to the bot: " +
      user.id
  );
}
