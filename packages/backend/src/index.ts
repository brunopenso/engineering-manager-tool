import Fastify from 'fastify';

const app = Fastify({ logger: true });
const PORT = Number(process.env.PORT ?? 3001);

app.get('/healthcheck', async () => {
  return { status: 'ok' };
});

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Backend running on http://localhost:${PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
