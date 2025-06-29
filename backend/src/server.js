import http from 'http';
import Koa from 'koa';
import koaBody from 'koa-body';
import WS from 'ws';
import cors from '@koa/cors';
import koaStatic from 'koa-static';
import path from 'path';
import router from './routes/index.js';
// import { v4 as uuidv4 } from 'uuid';
import DataBase from './db/index.js';
import wsMessageHandler from './helpers/wsMessageHandler.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Koa();
const publicDir = path.join(__dirname, '/public');

app.use(koaStatic(publicDir));

const db = new DataBase();

// Обработчик тела запроса
app.use(
  koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
    formidable: { multiples: false },
  })
);

// Исправленный CORS
app.use(
  cors({
    origin: ctx => {
      const allowed = [
        'http://localhost:5173',
        'http://localhost:3001',
        'https://backsty.github.io',
      ];
      if (allowed.includes(ctx.request.header.origin)) {
        return ctx.request.header.origin;
      }
      return '';
    },
    credentials: true,
  })
);

// Обработчик роутеров
app.use(router());

// Создание серверов
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

wsServer.on('connection', ws => {
  const sendingToAll = data => {
    for (let client of db.clients.keys()) {
      if (client.readyState === WS.OPEN) {
        client.send(data);
      }
    }
  };

  ws.on('message', async msg => {
    const decoder = new TextDecoder('utf-8');
    const data = await JSON.parse(decoder.decode(msg));
    if (data.type === 'ping') {
      db.clients.set(ws, data.data.user);
    }
    const result = wsMessageHandler(data);
    if (data.type === 'more_messages') {
      if (ws.readyState === 1) {
        ws.send(result);
      }
    } else {
      sendingToAll(result);
    }
  });

  ws.on('close', () => {
    db.setOflineStatus(db.clients.get(ws));
    db.clients.delete(ws);
    const data = JSON.stringify({
      type: 'logout',
      users: db.users,
    });
    sendingToAll(data);
  });

  ws.on('error', err => {
    console.info('Error: ', err);
  });
});

// Прослушивание порта
const port = process.env.PORT || 3001;
server.listen(port);
console.info(`the server is started on port ${port}`);

export default {
  db,
  public: publicDir,
};
