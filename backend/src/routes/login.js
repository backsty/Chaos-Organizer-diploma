import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.post('/login', async (ctx) => {
  if (server.db.checkUser(ctx.request.body)) {
    ctx.response.body = {
      success: true,
      data: {
        user: server.db.getUser(ctx.request.body),
        users: server.db.users,
        groups: server.db.groups,
      }
    }
  } else {
    ctx.response.body = {
      success: false,
      data: "Пользователь не найден"
    }
  }
});

export default router;