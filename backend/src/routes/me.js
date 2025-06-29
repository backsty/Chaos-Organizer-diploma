import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.get('/me', async (ctx) => {
  const userID = ctx.cookies.get('userID');
  if (!userID) {
    ctx.status = 401;
    ctx.response.body = { success: false, data: "Не авторизован" };
    return;
  }
  const user = server.db.findUser(userID);
  if (user) {
    ctx.response.body = {
      success: true,
      user,
      users: server.db.users,
      groups: server.db.groups,
    };
  } else {
    ctx.status = 401;
    ctx.response.body = { success: false, data: "Пользователь не найден" };
  }
});

export default router;