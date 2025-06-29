import Router from 'koa-router';

const router = new Router();

router.get('/', async (ctx) => {
  ctx.response.body = 'Сервер в порядке';
});

export default router;