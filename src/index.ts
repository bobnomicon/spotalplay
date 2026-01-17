import type { Album, AlbumItem, Playlist, Track, TrackItem } from './types';
import readline from 'node:readline/promises';
import { login, getAccessToken } from './auth';
import { getAlbums, getAlbumTracks } from './albums';
import { createPlaylist, addTracksToPlaylist } from './playlists';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getUserInput = async (question: string, valueName: string) => {
  const answer = await rl.question(question);
  if (!answer.trim()) {
    console.log('\n\x1b[31m%s\x1b[0m', `${valueName.charAt(0).toUpperCase() + valueName.slice(1)} cannot be empty`);
    return getUserInput(question, valueName);
  }
  return answer.trim();
};

const start = async () => {
  // Get required information from user
  const username = await getUserInput('Enter your Spotify username: ', 'username');
  const playlistName = await getUserInput('Enter the name for the new playlist: ', 'playlist name');
  const playlistDescription = await getUserInput('Enter the description for the new playlist: ', 'playlist description');
  const isPublic = await getUserInput('Should the playlist be public? (yes/no): ', 'public status');
  let splitTracks = await getUserInput('Should the tracks exceed the maximum number of tracks per playlist (11000) and need to be split into separate playlists, number of tracks per playlist (must be between 1 and 11000): ', 'number of tracks');
  if (splitTracks < 1 || splitTracks > 11000) {
    // Double-check that the number of tracks is within the allowed range, otherwise default to 11000
    console.log('\n\x1b[33m%s\x1b[0m', 'Number of tracks out of range. Defaulting to 11000.');
    splitTracks = 11000;
  }
  rl.close();

  // Request user authorization from Spotify
  const authorizationCode = await login();
  if (authorizationCode) {
    // Get Spotify access token
    let accessToken = await getAccessToken(authorizationCode);

    if (accessToken?.access_token) {
      // Get user's albums
      let offset = 0;
      let limit = 50;
      let totalAlbums = 0;
      let albums: AlbumItem[] = [];

      let albumData: Album[] = await getAlbums(accessToken.access_token, offset, limit);
      albumData?.items?.forEach((album: { album: AlbumItem }) => albums.push({
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
        albumData = await getAlbums(accessToken.access_token, offset, limit);
        albumData?.items?.forEach((album: { album: AlbumItem }) => albums.push({
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

        let trackData: Track[] = await getAlbumTracks(accessToken.access_token, album.id, offset, limit);
        trackData?.items?.forEach((track: TrackItem) => tracks.push({
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
          trackData?.items?.forEach((track: TrackItem) => tracks.push({
            name: track.name,
            uri: track.uri
          }));

          // Update offset and totalTracks for the next iteration
          offset += trackData?.items?.length;
          totalTracks -= trackData?.items?.length;
        }
      }

      // TODO: Refactor to handle splitting tracks into multiple playlists if they exceed 11000

      // Create a new playlist
      const playlist: Playlist = await createPlaylist(accessToken.access_token, username, playlistName, playlistDescription, isPublic);
      if (playlist?.id) {
        // Add all tracks to playlist (max 100 per request, max 11000 tracks per playlist)
        let offset = 0;
        let limit = 100;
        let totalTracks = tracks.length;

        // Remove tracks that have invalid URIs
        tracks = tracks.filter(track => {
          if (track.uri && track.uri.startsWith('spotify:track:')) {
            return true;
          }
          return false;
        });

        let tracksToAdd = tracks.map(track => track.uri).slice(offset, offset + limit);

        while (totalTracks > 0) {
          console.log(`Adding ${tracksToAdd.length} tracks to playlist '${playlist.name}': Offset: ${offset}, Tracks Left: ${totalTracks}`);
          await addTracksToPlaylist(accessToken.access_token, playlist.id, tracksToAdd);
          offset += limit;
          totalTracks -= limit;
          tracksToAdd = tracks.map(track => track.uri).slice(offset, offset + limit);
        }

        console.log(`All tracks added to playlist '${playlist.name}' successfully.`);
      }
    }
  }
};

// Run the app on execution
start();
