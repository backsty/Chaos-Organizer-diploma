import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.post('/register', async ctx => {
  const { login, password } = ctx.request.body;

  // Проверка на существующего пользователя
  if (server.db.users.some(user => user.login === login)) {
    ctx.status = 409;
    ctx.response.body = {
      success: false,
      data: 'Пользователь с таким логином уже существует',
    };
    return;
  }

  // Сохраняем аватар, если он есть
  if (ctx.request.files && ctx.request.files.avatar) {
    const { avatar } = ctx.request.files;
    await server.db.saveFile(avatar);
    server.db.addUser(ctx.request.body, server.db.fileName);
  } else {
    server.db.addUser(ctx.request.body);
  }

  // Получаем только что созданного пользователя
  const user = server.db.users.find(u => u.login === login && u.password === password);

  if (!user) {
    ctx.status = 500;
    ctx.response.body = {
      success: false,
      data: 'Ошибка при создании пользователя',
    };
    return;
  }

  // Сохраняем userID в httpOnly cookie на 7 дней
  ctx.cookies.set('userID', user.id, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    sameSite: 'lax',
    path: '/', // важно для всех роутов
  });

  ctx.response.body = {
    success: true,
    data: {
      user,
      users: server.db.users,
      groups: server.db.groups,
    },
  };
});

export default router;
