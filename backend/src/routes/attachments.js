import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.post('/attachments', async ctx => {
  const { body } = ctx.request;
  ctx.response.body = {
    success: true,
    data: server.db.getAttachments(body.dialog, body.dialogID),
  };
});

export default router;
