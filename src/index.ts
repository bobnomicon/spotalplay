import type { Album, AlbumItem, Track, TrackItem } from './types';
import { login, getAccessToken } from './auth';
import { getAlbums, getAlbumTracks } from './albums';

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
      albumData?.items?.forEach((album: { album: AlbumItem }) => albums.push(album.album));
      console.log('Total Albums:', albumData?.total);
      
      // Update offset and totalAlbums
      offset += albumData?.items?.length;
      totalAlbums = albumData?.total - albumData?.items?.length;

      // Continue fetching albums until all are retrieved
      while (totalAlbums > 0) {
        console.log('Offset:', offset, 'Albums Left:', totalAlbums);
        albumData = await getAlbums(accessToken.access_token, offset, limit);
        albumData?.items?.forEach((album: { album: AlbumItem }) => albums.push(album.album));

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
          id: track.id,
          name: track.name
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
            id: track.id,
            name: track.name
          }));

          // Update offset and totalTracks for the next iteration
          offset += trackData?.items?.length;
          totalTracks -= trackData?.items?.length;
        }
      }

      // TODO: Create a new playlist

      // TODO: Add tracks to playlist
      for (const track of tracks) {
        // Add each track to the playlist
        console.log(track);
      }
    }
  }
};

// Run the app on execution
start();
