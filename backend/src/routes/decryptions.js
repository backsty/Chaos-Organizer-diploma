import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.post('/decryption', async (ctx) => {
  const { body } = ctx.request;
  ctx.response.body = {
    success: true,
    data: server.db.getMesPassword(body.dialog, body.dialogID, body.mesID),
  }
});

export default router;