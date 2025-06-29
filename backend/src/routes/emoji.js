import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.get('/emoji', async ctx => {
  ctx.response.body = {
    success: true,
    data: server.db.emoji,
  };
});

export default router;
