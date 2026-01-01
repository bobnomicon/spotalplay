# spotalplay

Uses the Spotify Web API to add all tracks from all of user's liked albums to a playlist. See the [Spotify Web API documentation](https://developer.spotify.com/documentation/web-api) for how to create an app and obtain the necessary credentials to add to your `.env` file (required environment variables can be found in the `.env.example` file).

> **Note:** the maximum number of tracks that can be added to a playlist is currently 11,000, so you may need to split your tracks across multiple playlists if you have more than 11,000 tracks.

To install dependencies:

```bash
bun install
```

Startup the server (used for authorization callback):

```bash
bun run server
```

Then in a separate terminal, run the application:

```bash
bun run start
```

This project was created using `bun init` in bun v1.3.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
