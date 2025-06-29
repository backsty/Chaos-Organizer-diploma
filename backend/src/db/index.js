import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as server from '../server.js';

export default class DataBase {
  constructor() {
    this.users = [
      {
        id: '22c355f8-b537-4e82-b267-1af2940d0fde',
        avatar: 'demo_avatar.png',
        login: 'demo',
        online: false,
        password: 'demo',
        dialogues: [],
        created: '14:59 16.12.2021',
      },
    ];
    this.clients = new Map();
    this.groups = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        active: true,
        avatar: 'svoi.jpg',
        name: 'Общий чат',
        messages: [
          {
            time: DataBase.getDate(),
            mesID: uuidv4(),
            message: 'message 1',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
          },
          {
            time: DataBase.getDate(),
            mesID: uuidv4(),
            message: 'message 2',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
          },
          {
            time: DataBase.getDate(),
            mesID: uuidv4(),
            message: 'message 3 😀 😃 😄',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
          },
          {
            time: DataBase.getDate(),
            mesID: uuidv4(),
            message: 'message 4 😂😂😂',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
          },
          {
            time: DataBase.getDate(),
            mesID: '09f14c6b-d6f0-4f7c-a9e0-29b596b6a759',
            message: 'message 5',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
          },
          {
            time: DataBase.getDate(),
            mesID: uuidv4(),
            message: 'message 6 https://www.google.com/',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
          },
          {
            time: DataBase.getDate(),
            mesID: uuidv4(),
            message: 'message 7 https://www.google.com/',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
          },
          {
            time: '17:12 14.01.2022',
            mesID: 'd337259b-b6b3-4b01-be2d-5e0035a53111',
            message: '',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
            file: {
              type: 'video/mp4',
              name: 'a20b42b9-d32e-46ed-8c39-a981fcc58e3f.mp4'
            }
          },
          {
            time: '17:17 14.01.2022',
            mesID: '5c8202ec-09af-41b3-9a4e-875f89f07a26',
            message: '',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
            file: {
              type: 'audio/mpeg',
              name: '7e21749c-23e7-40d4-8ccc-976caa773f19.mp3'
            }
          },
          {
            time: '17:29 14.01.2022',
            mesID: 'c9426414-e579-4ee0-a796-a47489e5a600',
            message: '',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
            file: {
              type: 'audio/webm;codecs=opus',
              name: 'dca14845-f9eb-4f55-8708-bfc692ffef85'
            }
          },
          {
            time: '17:38 14.01.2022',
            mesID: '2a072aea-796b-4ea0-a4e9-9d6d47cbdb81',
            message: '',
            encryption: false,
            userName: 'demo',
            userID: '22c355f8-b537-4e82-b267-1af2940d0fde',
            file: {
              type: 'image/jpeg',
              name: '194508cb-de8d-40f9-b064-e88709dde509.jpg'
            }
          },
        ],
      },
    ]

    this.chunkLength = 10;
    this.fileName = null;
    this.emoji = `😀 😁 😂 🤣 😃 😄 😅 😆 😉 😊 😋 😎 😍 😘 🥰 😗 😜 😙 😚 🙂 🤗 🤩 🤔 🤨 😐 😑 😶 🙄 😏 😣 😥 😮 🤐 😯 😪 😫 😴 😌 😛 😝 🤤 😒 😓 😔 😕 🙃 🤑 😲 ☹️ 🙁 😖 😞 😟 😤 😢 😭 😦 😧 😨 😩 🤯 😬 😰 😱 🥵 🥶 😳 🤪 😵 😡 😠 🤬 😷 🤒 🤕 🤢 🤮 🤧 😇 🤠 🤡 🥳 🥴 🥺 🤥 🤫 🤭 🧐 🤓 😈 👹 👺 💀 👻 👽 🤖 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾 👋 🤚 🖐 ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦵 🦿 🦶 👣 👂 🦻 👃 🫀 🫁 🧠 🦷 🦴 👀 👁 👅 👄 💋 🩸`.split(' ');
  }

  getMesPassword(dialog, dialogID, mesID) {
    const { messages } = this.getDialog(dialogID, dialog);
    if (messages.some((mes) => mes.mesID === mesID)) {
      return messages.find((mes) => mes.mesID === mesID).password;
    }
  }

  checkLink(value) {
    if (value.match(/https?:\/\/[^\s]+/gm) !== null) {
      return value.match(/https?:\/\/[^\s]+/gm) !== null;
    }
  }

  filterMessages(data) {
    if (data.dialog === 'group') {
      const { messages } = this.getDialog(data.dialogID, data.dialog);
      return messages
        .filter((mes) => typeof mes.message !== 'object')
        .filter((mes) => mes.message.match(data.value));
    }
  }

  getAttachments(dialog, dialogID) {
    if (dialog === 'group') {
      const { messages } = this.getDialog(dialogID, dialog);
      const fileMes = messages.filter((mes) => mes.file);
      const links = messages
        .filter((mes) => typeof mes.message !== 'object')
        .filter((mes) => this.checkLink(mes.message));
      const images = fileMes
        .filter((mes) => mes.file && mes.file.type && mes.file.type.startsWith('image'))
        .map((mes) => mes.file.name);
      const video = fileMes
        .filter((mes) => mes.file && mes.file.type && mes.file.type.startsWith('video'))
        .map((mes) => mes.file.name);
      const voice = fileMes
        .filter((mes) => mes.file && mes.file.type === 'audio/webm;codecs=opus')
        .map((mes) => mes.file.name);
      const audio = fileMes
        .filter((mes) => mes.file && mes.file.type && mes.file.type.startsWith('audio') && mes.file.type !== 'audio/webm;codecs=opus')
        .map((mes) => mes.file.name);
      return { images, video, voice, audio, links };
    }
  }

  setOnlineStatus(id) {
    this.users.find((user) => user.id === id).online = true;
  }

  setOflineStatus(id) {
    this.users.find((user) => user.id === id).online = false;
  }

  addUser(data, avatar = null) {
    this.users.push({
      id: uuidv4(),
      avatar: avatar,
      login: data.login,
      online: false,
      password: data.password,
      dialogues: [],
      created: DataBase.getDate(),
    });
  }

  getLatestMessages(dialog, dialogID) {
    if (dialog === 'group') {
      const group = this.getDialog(dialogID, dialog);
      return group.messages.slice(group.messages.length - this.chunkLength, group.messages.length);
    }
  }

  splitData(array) {
    const splicedArr = [];
    for (let i = 0; i <= array.length - 1; i += 1) {
      splicedArr.push(array[i]);
    }
    const splitArr = [];
    while (splicedArr.length) {
      splitArr.push(splicedArr.splice(splicedArr.length - this.chunkLength, splicedArr.length));
    }
    return splitArr;
  }

  addTextMessage(userID, dialog, dialogID, message, encryption, password) {
    const user = this.users.find((user) => user.id === userID);
    const messageObj = {
      time: DataBase.getDate(),
      mesID: uuidv4(),
      message,
      userName: user.login,
      userID,
      encryption,
      password,
    }
    if (dialog === 'group') {
      const group = this.groups.find((group) => group.id === dialogID);
      group.messages.push(messageObj);
    }
    if (dialog === 'personal') {
      if (user.dialogues.some((dialog) => dialog.id === dialogID)) {
        user.dialogues.find((dialog) => dialog.id === dialogID).messages.push(messageObj);
      } else {
        this.addDialog(user.dialogues, user.id);
        user.dialogues.find((dialog) => dialog.id === dialogID).messages.push(messageObj);
      }
    }
  }

  addDialog(dialogues, userID) {
    const dialog = {
      id: userID,
      messages: [],
    }
    dialogues.push(dialog);
  }

  addFileMessage(file, data) {
    if (data.dialog === 'group') {
      const group = this.getDialog(data.dialogID, data.dialog);
      const user = this.findUser(data.user);
      const dataEncrypt = JSON.parse(data.encryption)
      const messageObj = {
        time: DataBase.getDate(),
        mesID: uuidv4(),
        message: data.description,
        userName: user.login,
        userID: user.id,
        encryption: dataEncrypt.encrypt,
        password: data.password,
        file: {
          type: file.type || file.mimetype,
          name: this.fileName,
          originalName: file.originalFilename || file.name,
        }
      }
      group.messages.push(messageObj);
    }
  }

  getDialog(dialogID, dialog) {
    if (dialog === 'group') {
      return this.groups.find((group) => group.id === dialogID);
    }
  }

  saveFile(data) {
    const fileName = data.originalFilename || data.name;
    if (!data || !fileName) {
      throw new Error('Некорректный файл: отсутствует имя файла');
    }

    const id = uuidv4();
    let extension = '';
    if (fileName.lastIndexOf('.') !== -1) {
      extension = fileName.slice(fileName.lastIndexOf('.'));
    } else if (data.mimetype && data.mimetype.includes('/')) {
      // Если расширения нет, пробуем взять из mimetype
      const extFromMime = data.mimetype.split('/')[1];
      extension = '.' + extFromMime;
    }
    this.fileName = id + extension;

    const publicDir = server.public || (server.default && server.default.public);
    if (!publicDir) throw new Error('Папка public не определена!');

    const destPath = path.join(publicDir, this.fileName);

    if (!fs.existsSync(data.filepath)) {
      throw new Error('Временный файл не найден');
    }

    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(data.filepath);
      const writeStream = fs.createWriteStream(destPath);

      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', () => {
        fs.unlink(data.filepath, (err) => {
          if (err) console.error('Ошибка удаления временного файла:', err);
          resolve();
        });
      });

      readStream.pipe(writeStream);
    });
  }

  checkUser(data) {
    return this.users
      .some((user) => user.login === data.login
        && user.password === data.password);
  }

  findUser(id) {
    if (this.users.some((user) => user.id === id)) {
      return this.users.find((user) => user.id === id);
    }
    return false;
  }

  getUser(data) {
    return this.users
      .find((user) => user.login === data.login &&
        user.password === data.password);
  }

  static getDate() {
    const formatter = new Intl.DateTimeFormat("ru", {
      timeZone: "Europe/Moscow",
      hour: "numeric",
      minute: "numeric",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    return ((str) => {
      const temp = str.split(' ');
      const date = [temp[1], temp[0].slice(0, -1)].join(' ');
      return date;
    })(formatter.format(new Date()));
  }
}