import type { Album, AlbumItem, Playlist, Track, TrackItem } from './types';
import { login, getAccessToken } from './auth';
import { getAlbums, getAlbumTracks } from './albums';
import { createPlaylist, addTracksToPlaylist } from './playlists';

const start = async () => {
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

      // Create a new playlist
      const playlist: Playlist = await createPlaylist(accessToken.access_token, 'bobby7t9', 'Liked Albums', 'All tracks from all liked albums', false);
      if (playlist?.id) {
        // Add all tracks to playlist (max 100 per request)
        let offset = 0;
        let limit = 100;
        let totalTracks = tracks.length;

        let tracksToAdd = tracks.map(track => track.uri).slice(offset, offset + limit);

        while (totalTracks > 0) {
          console.log(`Adding tracks to playlist '${playlist.name}': Offset: ${offset}, Tracks Left: ${totalTracks}`);
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
