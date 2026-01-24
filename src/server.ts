import envs from './envs';

const url = new URL(envs.spotifyRedirectUri);

/**
 * Authorization code stored for retrieval
 */
let authorizationCode = '';

const server = Bun.serve({
  hostname: url.hostname,
  port: url.port ? parseInt(url.port) : 80,

  routes: {
    '/code': {
      GET: () => {
        if (!authorizationCode) {
          return Response.json({
            message: 'Authorization code not yet available.'
          }, { status: 404 });
        }

        // Clear the code after sending it
        const code = authorizationCode;
        authorizationCode = '';

        return Response.json({ code });
      }
    },

    '/callback': {
      GET: req => {
        if (req.url.includes('error=')) {
          const error = req.url.split('error=')[1] ?? '';
          return new Response(`Error during authorization: ${error}`, { status: 400 });
        }

        // Get the code from the URL and store it, clear it after retrieval or timeout
        authorizationCode = req.url.split('code=')[1] ?? '';
        setTimeout(() => {
          authorizationCode = '';
        }, 2 * 60 * 1000); // Clear after 2 minutes

        return new Response('Authorization code received. You can now close this window.');
      }
    }
  }
});

console.log(`Server running at http://${server.hostname}:${server.port}`);
