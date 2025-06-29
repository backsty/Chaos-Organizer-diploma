import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

// Поиск сообщений (POST)
router.post('/validate_mes', async ctx => {
  const { body } = ctx.request;

  // Проверяем наличие обязательных полей
  if (!body || !body.value || !body.dialog || !body.dialogID) {
    ctx.status = 400;
    ctx.response.body = {
      success: false,
      data: 'Некорректные данные запроса',
    };
    return;
  }

  // Поиск сообщений (групповые и личные чаты)
  const result = server.db.filterMessages(body);

  ctx.response.body = {
    success: true,
    data: result || [],
  };
});

// GET-запросы не поддерживаются для поиска сообщений
router.get('/validate_mes', async ctx => {
  ctx.status = 405;
  ctx.response.body = { success: false, data: 'Используйте POST-запрос' };
});

export default router;
