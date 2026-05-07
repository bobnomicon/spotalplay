import type { SpotifyAlbum, SpotifyTrack, SpotifyPage } from './types';
import { getUserInput } from './input';
import { getAccessToken, login } from './auth';
import { getAlbumTracks, getAlbums } from './albums';
import { addTracksToPlaylist, createPlaylist } from './playlists';

const ALBUM_PAGE_LIMIT = 50;
const TRACK_PAGE_LIMIT = 50;
const PLAYLIST_BATCH_SIZE = 100;

const collectPaginatedItems = async <TItem>(
  fetchPage: (offset: number, limit: number) => Promise<SpotifyPage<TItem>>,
  limit: number
): Promise<TItem[]> => {
  const items: TItem[] = [];
  let offset = 0;
  let total = 1;

  while (offset < total) {
    const page = await fetchPage(offset, limit);
    items.push(...page.items);
    offset += page.items.length;
    total = page.total;
  }

  return items;
};

const getSavedAlbums = async (
  spotifyAccessToken: string
): Promise<SpotifyAlbum[]> => {
  const savedAlbums = await collectPaginatedItems(
    (offset, limit) => getAlbums(spotifyAccessToken, offset, limit),
    ALBUM_PAGE_LIMIT
  );

  return savedAlbums.map(item => item.album);
};

const getAlbumTracksByAlbum = async (
  spotifyAccessToken: string,
  album: SpotifyAlbum
): Promise<SpotifyTrack[]> => {
  const tracks = await collectPaginatedItems(
    (offset, limit) =>
      getAlbumTracks(spotifyAccessToken, album.id, offset, limit),
    TRACK_PAGE_LIMIT
  );

  console.log(`Total tracks for album ${album.name}: ${tracks.length}`);
  return tracks;
};

const isValidSpotifyTrackUri = (uri: SpotifyTrack['uri']): uri is string =>
  !!uri && uri.startsWith('spotify:track:');

const createPlaylistBatches = (
  trackUris: string[],
  playlistSize: number
): string[][] => {
  const playlists: string[][] = [];

  for (
    let playlistStart = 0;
    playlistStart < trackUris.length;
    playlistStart += playlistSize
  ) {
    const playlistTracks = trackUris.slice(
      playlistStart,
      playlistStart + playlistSize
    );

    if (playlistTracks.length > 0) {
      playlists.push(playlistTracks);
    }
  }

  return playlists;
};

const addTracksInBatches = async (
  spotifyAccessToken: string,
  playlistId: string,
  trackUris: string[],
  playlistName: string
): Promise<void> => {
  for (
    let offset = 0;
    offset < trackUris.length;
    offset += PLAYLIST_BATCH_SIZE
  ) {
    const tracksToAdd = trackUris.slice(offset, offset + PLAYLIST_BATCH_SIZE);
    const tracksRemaining = Math.max(
      trackUris.length - (offset + tracksToAdd.length),
      0
    );

    console.log(
      `Adding ${tracksToAdd.length} tracks to playlist '${playlistName}': Offset: ${offset}, Tracks Left: ${tracksRemaining}`
    );

    await addTracksToPlaylist(spotifyAccessToken, playlistId, tracksToAdd);
  }
};

const start = async (): Promise<void> => {
  const { username, playlistName, playlistDescription, isPublic, splitTracks } =
    await getUserInput();

  const authorizationCode = await login();
  const accessToken = await getAccessToken(authorizationCode);

  const albums = await getSavedAlbums(accessToken.access_token);
  console.log(`Total albums retrieved: ${albums.length}`);

  const albumTracks: SpotifyTrack[] = [];
  for (const album of albums) {
    const tracks = await getAlbumTracksByAlbum(accessToken.access_token, album);
    albumTracks.push(...tracks);
  }

  const trackUris = albumTracks
    .map(track => track.uri)
    .filter(isValidSpotifyTrackUri);

  const playlistTrackGroups = createPlaylistBatches(trackUris, splitTracks);

  for (const [index, tracksForPlaylist] of playlistTrackGroups.entries()) {
    const playlistNumberSuffix =
      playlistTrackGroups.length > 1 ? ` ${index + 1}` : '';
    const currentPlaylistName = `${playlistName}${playlistNumberSuffix}`;

    const playlist = await createPlaylist(
      accessToken.access_token,
      username,
      currentPlaylistName,
      playlistDescription,
      isPublic
    );

    await addTracksInBatches(
      accessToken.access_token,
      playlist.id,
      tracksForPlaylist,
      playlist.name
    );

    console.log(
      `All tracks added to playlist '${playlist.name}' successfully.`
    );
  }

  console.log('All done!');
};

void start();
