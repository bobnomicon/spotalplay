import 'dotenv/config';

const spotifyApiUrl = process.env.SPOTIFY_API_URL;
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
console.log(spotifyClientId, spotifyClientSecret);

interface AlbumItem {
  id: string;
  total_tracks: number;
  uri: string;
}

interface Album {
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: AlbumItem[]
}

const getAlbums = async () => {
  const albums: Album[] = await fetch(`${spotifyApiUrl}/me/albums`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${spotifyClientSecret}`
    }
  }).then(response => response.json());

  console.log(albums);
}

getAlbums();
