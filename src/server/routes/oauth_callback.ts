import { checkTwUserInDatabase, saveUserToDatabase } from "../database";

export async function oauthCallback(req: any, res: any) {
  if (!req.query.code) {
    res.status(400).send("Error: No code found in query string");
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

  if (!response) {
    res.status(400).send("Error: No response from OAuth2 server");
    return;
  }

  const json = await response.json();

  if (!json) {
    res
      .status(response.status)
      .send("Error: No JSON response from OAuth2 server");
    return;
  }

  const access_token = json.access_token;
  const refresh_token = json.refresh_token;
  const expires_in = json.expires_in;
  const webhook = json.webhook as {
    id: number;
    url: string;
    secret: string;
  };

  if (!access_token || !refresh_token || !expires_in) {
    res
      .status(response.status)
      .send("Error: Missing access token, refresh token or expires in");
    return;
  }
  const userResponse = await fetch(process.env.TW_API_URL + "/auth/user", {
    headers: {
      Authorization: "Bearer " + access_token,
      Accept: "application/json",
    },
  });

  const userJson = await userResponse.json();

  if (!userJson) {
    res.status(400).send("Error: No JSON response from user endpoint");
    return;
  }

  const user = userJson.data;

  if (user.id === undefined) {
    res.status(400).send("Error: No user ID found in response");
    return;
  }

  // check if user is already in the database
  const userExists = await checkTwUserInDatabase(user.id);

  if (userExists) {
    res
      .status(403)
      .send(
        "Looks like you're already registered! Please contact an admin if you need help.\nA new API Token and Webhook have been granted by Traewelling. Please revoke these in the Traewelling settings."
      );
  }

  const dbUser: User = {
    id: user.id,
    dc_id: null,
    display_name: user.displayName,
    name: user.username,
    access_token: access_token,
    refresh_token: refresh_token,
    valid_until: new Date(Date.now() + expires_in * 1000),
    webhook_secret: webhook.secret,
    webhook_id: webhook.id,
    webhook_url: webhook.url,
  };

  await saveUserToDatabase(dbUser);

  res
    .status(200)
    .send(
      "User registered successfully! Please copy this number and send it to the bot: " +
        user.id
    );
}
