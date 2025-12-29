import { Hono } from 'hono';

const app = new Hono();

let code = '';

app.get('/code', (c) => {
  return c.json({ code });    
});

app.get('/callback', (c) => {
  if (c.req.query('error')) {
    c.status(400);
    return c.text(`Error during authorization: ${c.req.query('error')}`);
  }

  code = c.req.query('code') ?? '';
  return c.text('Authorization code received. You can now close this window.');
});

export default app;
