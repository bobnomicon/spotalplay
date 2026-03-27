import type { Album, AlbumItem, Playlist, Track, TrackItem } from './types';
import { getUserInput } from './input';
import { login, getAccessToken } from './auth';
import { getAlbums, getAlbumTracks } from './albums';
import { createPlaylist, addTracksToPlaylist } from './playlists';

const start = async () => {
  // Get required information from user
  const { username, playlistName, playlistDescription, isPublic, splitTracks } = await getUserInput();

  // Request user authorization from Spotify
  const authorizationCode = await login();
  if (!authorizationCode) {
    console.log('Failed to obtain authorization code. Exiting.');
    return;
  }

  // Get Spotify access token
  const accessToken = await getAccessToken(authorizationCode);
  if (!accessToken?.access_token) {
    console.log('Failed to obtain access token. Exiting.');
    return;
  }

  // Get user's albums
  let offset = 0;
  let limit = 50;
  let totalAlbums = 0;
  const albums: AlbumItem[] = [];

  let albumData = await getAlbums(accessToken.access_token, offset, limit);
  albumData?.items?.forEach((album) => albums.push({
    id: album.album.id,
    name: album.album.name
  }));
  console.log('Total Albums:', albumData?.total);

  // Update offset and totalAlbums
  offset += albumData?.items?.length;
  totalAlbums = albumData?.total - albumData?.items?.length;

  // Continue fetching albums until all are retrieved
  while (totalAlbums > 0) {
    console.log('Offset:', offset, 'Albums Left:', totalAlbums);
    albumData = await getAlbums(accessToken.access_token, offset, limit) as Album;
    albumData?.items?.forEach((album) => albums.push({
      id: album.album.id,
      name: album.album.name
    }));

    // Update offset and totalAlbums for the next iteration
    offset += albumData?.items?.length;
    totalAlbums -= albumData?.items?.length;
  }

  console.log(`Total albums retrieved: ${albums.length}`);

  // Get tracks for each album
  let tracks: TrackItem[] = [];
  for (const album of albums) {
    // Get tracks for the current album
    let offset = 0;
    let limit = 50;
    let totalTracks = 0;

    let trackData = await getAlbumTracks(accessToken.access_token, album.id, offset, limit);
    trackData?.items?.forEach((track) => tracks.push({
      name: track.name,
      uri: track.uri
    }));
    console.log(`Total tracks for album ${album.name}: ${trackData?.total}`);

    // Update offset and totalTracks for the next iteration
    offset += trackData?.items?.length;
    totalTracks = trackData?.total - trackData?.items?.length;

    // Continue fetching tracks until all are retrieved
    while (totalTracks > 0) {
      console.log(`Offset: ${offset}, Tracks Left: ${totalTracks}`);
      trackData = await getAlbumTracks(accessToken.access_token, album.id, offset, limit);
      trackData?.items?.forEach((track) => tracks.push({
        name: track.name,
        uri: track.uri
      }));

      // Update offset and totalTracks for the next iteration
      offset += trackData?.items?.length;
      totalTracks -= trackData?.items?.length;
    }
  }

  // Remove tracks that have invalid URIs
  tracks = tracks.filter(track => {
    if (track.uri && track.uri.startsWith('spotify:track:')) {
      return true;
    }
    return false;
  });

  // Add all tracks to playlist (max 100 per request, max 11000 tracks per playlist)
  let totalPlaylists = Math.ceil(tracks.length / splitTracks);
  let currentPlaylist = 1;
  let tracksOffset = 0;
  let requestLimit = 100;
  let totalTracks = splitTracks > tracks.length ? tracks.length : splitTracks;

  while (totalPlaylists > 0) {
    // Create a new playlist
    const currentPlaylistName = playlistName + (totalPlaylists > 1 ? ` ${currentPlaylist}` : '');

    const playlist = await createPlaylist(accessToken.access_token, username, currentPlaylistName, playlistDescription, isPublic);
    if (playlist?.id) {
      // Add tracks to the newly created playlist in batches of 100
      let tracksToAdd = tracks.map(track => track.uri).slice(tracksOffset, tracksOffset + requestLimit);
      let playlistOffset = 0;

      while (totalTracks > 0) {
        console.log(`Adding ${tracksToAdd.length} tracks to playlist '${playlist.name}': Offset: ${playlistOffset}, Tracks Left: ${totalTracks}`);
        await addTracksToPlaylist(accessToken.access_token, playlist.id, tracksToAdd);

        // Update offsets and totalTracks for the next iteration
        tracksOffset += requestLimit;
        totalTracks -= requestLimit;
        tracksToAdd = tracks.map(track => track.uri).slice(tracksOffset, tracksOffset + requestLimit);
        playlistOffset += requestLimit;
      }

      console.log(`All tracks added to playlist '${playlist.name}' successfully.`);
    }

    // Update for the next playlist
    totalPlaylists--;
    currentPlaylist++;
    if (totalPlaylists > 0) {
      totalTracks = splitTracks > tracks.length - tracksOffset ? tracks.length - tracksOffset : splitTracks;
    }
  }

  console.log('All done!');
};

// Run the app on execution
start();
