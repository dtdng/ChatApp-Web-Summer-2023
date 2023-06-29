import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const PORT = process.env.PORT || 3004;

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const onlineUsers = [];
const socket_list = {};
io.on("connection", (socket) => {
  console.log(socket.id);
  let currentUser = {};
  socket.on("setUp", (userID, username) => {
    console.log("hello");
    if (userID != null || username != null) {
      console.log(userID + " : " + username);
      const existingUserIndex = onlineUsers.findIndex((x) => x.uid === userID);
      if (existingUserIndex !== -1) {
        onlineUsers[existingUserIndex] = {
          socketID: socket.id,
          username,
          uid: userID,
        };
      } else {
        currentUser = {
          socketID: socket.id,
          username: username,
          uid: userID,
        };
        socket_list[socket.id] = socket;
        onlineUsers.push(currentUser);
        console.log("User added:", onlineUsers[onlineUsers.length - 1]);
      }
      console.log("Online Users:", onlineUsers);
      io.emit("onlineUsers", onlineUsers);
    }
  });

  socket.on("sendMessage", ({ receiverUserID, senderID }) => {
    console.log("message_received", receiverUserID);
    const receiverSocket = onlineUsers.find((x) => x.uid == receiverUserID);
    console.log("receiverSocket: ", receiverSocket);
  });

  socket.on(
    "calling_group",
    ({ receiverUserID, senderID, roomID, group_name }) => {
      console.log("CALL GROUP");
      const resultArray = [];
      const sender_name = onlineUsers.find((x) => x.uid === senderID).username;
      for (const uid of receiverUserID) {
        if (uid !== senderID) {
          const receiverSocket = onlineUsers.find((x) => x.uid === uid);
          console.log("receiverSocket: ", receiverSocket);
          if (receiverSocket) {
            const receiverID = receiverSocket.socketID;
            const receiverSocket2 = socket_list[receiverID];
            receiverSocket2.emit("messageNoti", {
              receiverUserID: uid,
              senderUserID: senderID,
              senderName: group_name,
              roomID: roomID,
              state: "accepting",
              type: "Group",
            });
          }
        }
      }
      socket.emit("turn_window_call", { room_ID: roomID });
    }
  );

  socket.on("calling", ({ receiverUserID, senderID, roomID }) => {
    const receiverSocket = onlineUsers.find((x) => x.uid === receiverUserID);
    const sender_name = onlineUsers.find((x) => x.uid === senderID).username;
    if (receiverSocket) {
      const receiverID = receiverSocket.socketID;
      const receiverSocket2 = socket_list[receiverID];
      receiverSocket2.emit("messageNoti", {
        receiverUserID: receiverUserID,
        senderUserID: senderID,
        senderName: sender_name,
        roomID: roomID,
        state: "accepting",
        type: "DirectMessage",
      });
      socket.emit("messageNoti", {
        receiverUserID: receiverUserID,
        senderUserID: senderID,
        senderName: sender_name,
        roomID: roomID,
        state: "waiting",
        type: "DirectMessage",
      });
    }
  });

  socket.on("accept_call", ({ receiverUserID, roomID }) => {
    const receiverSocket = onlineUsers.find((x) => x.uid === receiverUserID);
    if (receiverSocket) {
      const receiverID = receiverSocket.socketID;
      const receiverSocket2 = socket_list[receiverID];
      console.log(1111111);
      receiverSocket2.emit("turn_window_call", { room_ID: roomID });
    }
    // socket.emit("turn_window_call")
  });

  socket.on("cancel_call", ({ receiverUserID, state, roomID }) => {
    // console.log("===================================================");
    // console.log("receiverUserID: ",receiverUserID)
    // // console.log("senderID",senderID)
    // console.log("socketID: ",socket.id)
    // console.log("onlineUsers: ",onlineUsers)

    const receiverSocket = onlineUsers.find((x) => x.uid === receiverUserID);
    // console.log("receiverSocket: ",receiverSocket)
    if (receiverSocket) {
      const receiverID = receiverSocket.socketID;
      const receiverSocket2 = socket_list[receiverID];
      if (state === "cancel") {
        socket.emit("missed_call", { state: state, roomID: roomID });
      }
      if (state === "decline") {
        receiverSocket2.emit("missed_call", { state: state, roomID: roomID });
      }
      receiverSocket2.emit("turn_off_notification");
    }
  });

  socket.on("sendEndedCallMsg", ({ receiverUserID, roomID }) => {
    console.log("sendEndedCallMsg");
    const receiverSocket = onlineUsers.find((x) => x.uid === receiverUserID);
    if (receiverSocket) {
      const receiverID = receiverSocket.socketID;
      const receiverSocket2 = socket_list[receiverID];
      console.log("sendEndedCallMsg2");
      receiverSocket2.emit("printMsgEnded", { roomID: roomID });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(reason);

    const disconnectedUser = onlineUsers.find((x) => x.uid == currentUser.uid);
    if (disconnectedUser !== -1) {
      onlineUsers.splice(onlineUsers.indexOf(disconnectedUser), 1);
      for (let key in socket_list) {
        if (socket_list[key] === socket) {
          delete socket_list[key];
          break;
        }
      }
      console.log("Online Users:", onlineUsers);
      io.emit("onlineUsers", onlineUsers);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
