export interface Envs {
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyAccountsUrl: string;
  spotifyApiUrl: string;
  spotifyRedirectUri: string;
  spotifyScope: string;
}

export interface AccessToken {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface TrackItem {
  id: string;
  name: string;
}

export interface Track {
  href: string;
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
  items: TrackItem[]
}

export interface AlbumItem {
  id: string;
  name: string;
  tracks: Track;
}

export interface Album {
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
  items: { album: AlbumItem }[]
}
