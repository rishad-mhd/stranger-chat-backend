const { Types } = require("mongoose");
const { Server } = require("socket.io");

/**
 * @typedef {Map<string,string>} UserMap
 * @typedef {Map<string,UserMap[]>} ChatMap
 * @typedef {import("socket.io").Server & { users: UserMap,
 *  chats:ChatMap,
 *  getUser: getUserFunction,
 * sendMessage: SendMessageFunction,
 *  joinChat:joinChatFunction ,
 * leaveChat:LeaveChatFunction,
 * getUnpairedUsers:GetUnpairedUsersFunction
 * sendConnectionRequest:SendConnectionRequestFunction
 * }} SocketIOServer
 */

/** @type {SocketIOServer} */
const io = new Server({ cors: "*" });

io.users = new Map();
io.chats = new Map();

/**
 * @typedef {function(string): string|undefined} getUserFunction - The function to get a user from the users map.
 */
io.getUser = function (userId) {
  return io.users.get(userId);
};

/**
 * Adds a user to the chat map.
 * @typedef {{chatId:string, userId:string, socketId:string}} joinChatParams
 * @typedef {(params: joinChatParams) => void} joinChatFunction
 */
io.joinChat = ({ chatId, userId, socketId }) => {
  let chat = io.chats.get(chatId);
  if (!chat) {
    chat = [];
    io.chats.set(chatId, chat);
  }
  const userMap = chat.find((entry) => entry.has(userId));
  if (userMap) {
    userMap.set(userId, socketId);
  } else {
    const newUserMap = new Map();
    newUserMap.set(userId, socketId);
    chat.push(newUserMap);
  }
};

/**
 * @typedef {( currentUserId: string) => {unpairedUsers:string[],usersHasChat:Map<string,string>}} GetUnpairedUsersFunction
 */
io.getUnpairedUsers = (currentUserId) => {
  const unpairedUsers = [];
  const usersHasChat = new Map();

  // Iterate over each user in the users Map
  for (const [userId] of io.users) {
    // Skip the current user
    if (userId === currentUserId) {
      continue;
    }

    let isPaired = false;

    // Check if the user has any chat
    for (const [chatId, userMaps] of io.chats) {
      for (const userMap of userMaps) {
        if (userMap.has(userId)) {
          if (userMaps.length === 1) {
            usersHasChat.set(userId, chatId);
            break;
          }
          isPaired = true;
          break;
        }
      }
      if (isPaired) {
        break;
      }
    }

    // If the user is not paired, add to unpairedUsers
    if (!isPaired) {
      unpairedUsers.push(new Types.ObjectId(userId));
    }
  }

  return { unpairedUsers, usersHasChat };
};

/**
 * @typedef {(sender:{}, receiverId:string) => void} SendConnectionRequestFunction
 */
io.sendConnectionRequest = (sender, receiverId) => {
  const receiverSocketId = io.users.get(receiverId);

  if (receiverSocketId) {
    // Emit a 'connectionRequest' event to the receiver's socket
    io.to(receiverSocketId).emit("connectionRequest", sender);
  } else {
    // Handle error when sender or receiver socket IDs are not found
    console.log("Sender or receiver socket ID not found");
  }
};

/**
 * Removes a user from the chat map.
 * @typedef {{ chatId: string, userId?: string }} LeaveChatParams - Parameters for leaving a chat
 * @typedef {(params: LeaveChatParams) => void} LeaveChatFunction - Function for leaving a chat
 */
io.leaveChat = ({ chatId, userId }) => {
  const chat = io.chats.get(chatId);
  if (chat) {
    chat.map((item) => {
      item.forEach((socketId, user) => {
        if (userId !== user) {
          io.to(socketId).emit("onPairDisconnected", { userId });
        }
      });
    });
    // const userMapIndex = chat.findIndex((entry) => entry.has(userId));
    // if (userMapIndex !== -1) {
    //   const userMap = chat[userMapIndex];
    //   userMap.delete(userId);
    //   // if (userMap.size === 0) {
    //     chat.splice(userMapIndex, 1);
    //   // }
    //   if (chat.length === 0) {
    io.chats.delete(chatId);
    // }
    // }
  }
};

/**
 * Sends a message to a receiver.
 * @typedef {{ reciever: string, sender: string, messageId: string, text: string, createdAt: Date }} SendMessageParams
 * @typedef {{ success: boolean, error?: Error }} SendMessageResult
 * @typedef {(params: SendMessageParams) => SendMessageResult} SendMessageFunction
 */
io.sendMessage = ({
  reciever: recieverId,
  sender,
  messageId,
  text,
  createdAt,
} = {}) => {
  let reciever = io.getUser(recieverId);
  try {
    if (reciever) {
      io.to(reciever).emit("getMessage", {
        reciever: recieverId,
        sender,
        messageId,
        text,
        createdAt,
      });
      return { success: true };
    } else {
      throw new Error("Receiver not found");
    }
  } catch (e) {
    return { success: false, error: e };
  }
};

io.on("connection", function (socket) {
  socket.on("addUser", (userId) => {
    io.users.set(userId, socket.id);
  });

  // Handle joining a group
  socket.on("joinChat", (chatId, userId) => {
    socket.join(chatId);
    io.joinChat({ chatId, userId, socketId: socket.id });
  });

  // // Handle leaving a group
  socket.on("leaveChat", (chatId, userId) => {
    socket.leave(chatId);
    io.leaveChat({ chatId, userId });
  });
  socket.on("leaveUser", (userId) => {
    // io.users.forEach((socketId, userId) => {
    //   if (socket.id === socketId) {
    io.chats.forEach((chat, chatId) => {
      let chatExist = chat.some((entry) => entry.has(userId));
      if (chatExist) {
        io.leaveChat({ chatId, userId });
      }
    });
    io.users.delete(userId);
    // }
    // });
  });
  socket.on("typing", ({ to, isTyping }) => {
    io.to(to).emit("typing", { user: to, isTyping });
  });
  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("a user disconnected");
    io.users.forEach((socketId, userId) => {
      if (socket.id === socketId) {
        io.chats.forEach((chat, chatId) => {
          let chatExist = chat.some((entry) => entry.has(userId));
          if (chatExist) {
            io.leaveChat({ chatId, userId });
          }
        });
        io.users.delete(userId);
      }
    });
  });
});

module.exports = io;
