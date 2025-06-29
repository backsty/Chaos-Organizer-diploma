import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.post('/validate_mes', async (ctx) => {
  const { body } = ctx.request;
  ctx.response.body = {
    success: true,
    data: server.db.filterMessages(body),
  }
});

export default router;