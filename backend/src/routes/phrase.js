import { faker } from '@faker-js/faker';
import Router from 'koa-router';

const router = new Router();

faker.locale = 'ru';

router.get('/phrase', async (ctx) => {
  ctx.response.body = {
    success: true,
    data: faker.hacker.phrase(),
  }
});

export default router;