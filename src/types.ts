export interface Envs {
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyAccountsUrl: string;
  spotifyApiUrl: string;
  spotifyRedirectUri: string;
  spotifyScope: string;
}

export interface SpotifyPage<TItem> {
  items: TItem[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface SpotifyAccessToken {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyTrack {
  id?: string;
  name: string;
  uri: string | null;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
}

export interface SavedAlbumItem {
  album: SpotifyAlbum;
}

export type SavedAlbumsPage = SpotifyPage<SavedAlbumItem>;
export type AlbumTracksPage = SpotifyPage<SpotifyTrack>;

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  public: boolean | null;
}

export interface AuthorizationCodeResponse {
  code: string;
}

export interface ApiErrorResponse {
  message: string;
}

export interface UserInput {
  username: string;
  playlistName: string;
  playlistDescription: string;
  isPublic: boolean;
  splitTracks: number;
}
