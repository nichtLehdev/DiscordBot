type TW_User = {
  id: number;
  displayName: string;
  username: string;
  profilePicture: string;
  trainDistance: number;
  trainDuration: number;
  points: number;
  twitterUrl: null | string;
  mastodonUrl: null | string;
  privateProfile: boolean;
  preventIndex: boolean;
  likes_enabled: boolean;
  role: number;
  home: null | string;
  language: string;
  defaultStatusVisibility: number;
};
