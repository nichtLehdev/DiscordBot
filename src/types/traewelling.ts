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

type TW_Station = {
  id: number;
  name: string;
  rilIdentifier: string;
  evaIdentifier: number;
  arrival: string;
  arrivalPlanned: string;
  arrivalReal: string;
  arrivalPlatformPlanned: string;
  arrivalPlatformReal: string;
  departure: string;
  departurePlanned: string;
  departureReal: string;
  departurePlatformPlanned: string;
  departurePlatformReal: string;
  platform: string;
  isArrivalDelayed: boolean;
  isDepartureDelayed: boolean;
  cancelled: boolean;
};

type TW_Event = {
  id: number;
  name: string;
  slug: string;
  hashtag: string;
  host: string;
  url: string;
  begin: string;
  end: string;
  station: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    ibnr: number;
    rilIdentifier: string;
  };
};

type TW_Status = {
  id: number;
  body: string;
  user: number;
  username: string;
  preventIndex: boolean;
  business: number;
  visibility: number;
  likes: number;
  liked: boolean;
  isLikable: boolean;
  createdAt: string;
  profilePicture: string;
  train: {
    trip: number;
    hafasId: string;
    category: string;
    number: string;
    journeyNumber: number;
    lineName: string;
    distance: number;
    points: number;
    duration: number;
    origin: TW_Station;
    destination: TW_Station;
    operator: {
      identifier: string;
      name: string;
    };
  };
  event: Event | null;
};

type TW_Notification = {
  id: string;
  type: string;
  leadFormatted: string;
  lead: string;
  noticeFormatted: string;
  notice: string;
  link: string;
  data: {
    like: {
      id: number;
    };
    status: {
      id: number;
    };
    trip: {
      origin: {
        id: number;
        ibnr: number;
        name: string;
      };
      destination: {
        id: number;
        ibnr: number;
        name: string;
      };
      plannedDeparture: string;
      plannedArrival: string;
      lineName: string;
    };
    liker: {
      id: number;
      username: string;
      name: string;
    };
  };
  readAt: string;
  createdAt: string;
  createdAtForHumans: string;
};
