import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.post('/login', async ctx => {
  const { login, password } = ctx.request.body;

  // Проверяем наличие пользователя
  if (server.db.checkUser({ login, password })) {
    const user = server.db.getUser({ login, password });

    // Сохраняем userID в httpOnly cookie на 7 дней
    ctx.cookies.set('userID', user.id, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      sameSite: 'lax',
      path: '/', // важно для всех роутов
    });

    // Ставим online-статус
    server.db.setOnlineStatus(user.id);

    ctx.response.body = {
      success: true,
      data: {
        user,
        users: server.db.users,
        groups: server.db.groups,
      },
    };
  } else {
    ctx.status = 401;
    ctx.response.body = {
      success: false,
      data: 'Пользователь не найден',
    };
  }
});

export default router;
