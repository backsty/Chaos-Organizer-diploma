import server from '../server.js';
import Router from 'koa-router';

const router = new Router();

router.post('/files', async (ctx) => {
  try {
    console.log('ctx.request.files:', ctx.request.files);
    const { file } = ctx.request.files || {};
    const { body } = ctx.request;
    if (!file) {
      console.error('Файл не найден в запросе:', ctx.request.files);
      ctx.status = 400;
      ctx.body = { success: false, error: 'Файл не найден' };
      return;
    }
    await server.db.saveFile(file);
    server.db.addFileMessage(file, body);
    ctx.response.body = {
      success: true,
    }
  } catch (err) {
    console.error('Ошибка при загрузке файла:', err);
    ctx.status = 500;
    ctx.body = { success: false, error: err.message };
  }
});

export default router;