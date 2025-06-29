import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.post('/register', async (ctx) => {
  if (ctx.request.files.avatar) {
    const { avatar } = ctx.request.files;
    await server.db.saveFile(avatar);
    server.db.addUser(ctx.request.body, server.db.fileName);
  } else {
    server.db.addUser(ctx.request.body);
  }
  ctx.response.body = {
    success: true,
    data: {
      user: server.db.getUser(ctx.request.body),
      users: server.db.users,
      groups: server.db.groups,
    }
  }
});

export default router;