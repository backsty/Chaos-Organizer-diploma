import combineRouters from 'koa-combine-routers';

import loginRouter from './login.js';
import pingRouter from './ping.js';
import registerRouter from './register.js';
import filesRouter from './files.js';
import attachmentRouter from './attachments.js';
import validate_mesRouter from './validate_mes.js';
import emojiRouter from './emoji.js';
import decryptionRouter from './decryptions.js';
import phraseRouter from './phrase.js';
import meRouter from './me.js';

const router = combineRouters(
  loginRouter,
  pingRouter,
  registerRouter,
  filesRouter,
  attachmentRouter,
  validate_mesRouter,
  emojiRouter,
  decryptionRouter,
  phraseRouter,
  meRouter
);

export default router;