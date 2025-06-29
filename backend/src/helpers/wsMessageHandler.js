import server from '../server.js';

export default function wsMessageHandler(msg) {
  if (msg.data) {
    const { messages } = server.db.getDialog(msg.data.dialogID, msg.data.dialog);
    const { name } = server.db.getDialog(msg.data.dialogID, msg.data.dialog);
    switch (msg.type) {
      case 'ping':
        server.db.setOnlineStatus(msg.data.user);
        return JSON.stringify({
          totalMessages: messages.length,
          type: 'pong',
          users: server.db.users,
          chatName: name,
          messages: server.db.splitData(messages)[+msg.data.currentChunk],
        });
      case 'messages':
        return JSON.stringify({
          type: 'text_message',
          data: {
            totalMessages: messages.length,
            chatName: name,
            messages: server.db.getLatestMessages(msg.data.dialog, msg.data.dialogID),
          },
        });
      case 'text_message':
        server.db.addTextMessage(
          msg.data.user,
          msg.data.dialog,
          msg.data.dialogID,
          msg.data.message,
          msg.data.encryption,
          msg.data.password
        );
        return JSON.stringify({
          type: 'text_message',
          data: {
            totalMessages: messages.length,
            chatName: name,
            messages: server.db.getLatestMessages(msg.data.dialog, msg.data.dialogID),
          },
        });
      case 'more_messages':
        return JSON.stringify({
          type: 'more_messages',
          data: {
            totalMessages: messages.length,
            chatName: name,
            messages: server.db.splitData(messages)[+msg.data.currentChunk],
          },
        });
      default:
        return JSON.stringify({
          type: 'unknown',
        });
    }
  } else {
    if (msg.type === 'interval') {
      return JSON.stringify({
        type: 'interval',
      });
    }
  }
}
