import { onSnapshot } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import Message from "./Message";
import { socket } from "../socket";
import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { v4 as uuid } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const { data } = useContext(ChatContext);
  const { currentUser } = useContext(AuthContext);

  const printMessage = (sendText, roomID) => {
    console.log("updateee");
    const text = "";
    updateDoc(doc(db, "chats", roomID), {
      messages: arrayUnion({
        id: uuid(),
        text: sendText,
        senderId: currentUser.uid,
        senderUsername: currentUser.displayName,
        senderAvatar: currentUser.photoURL,
        date: Timestamp.now(),
        call_again: "call_again",
      }),
    });

    updateDoc(doc(db, "userChats", currentUser.uid), {
      [data.chatId + ".lastMessage"]: {
        text,
      },
      [data.chatId + ".date"]: serverTimestamp(),
    });

    // updateDoc(doc(db, "userChats", data.user.uid), {
    // [data.chatId + ".lastMessage"]: {
    //   text,
    // },
    // [data.chatId + ".date"]: serverTimestamp(),
    // });
  };

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", data.chatId), (doc) => {
      if (doc.exists()) {
        for (var i = 1; i < doc.data().messages; i++) {
          if (
            doc.data().messages[i].senderId ===
            doc.data().messages[i - 1].senderId
          ) {
            console.log("yes");
          }
        }
      }

      doc.exists() && setMessages(doc.data().messages);
      // console.log(doc.data());
    });

    socket.on("missed_call", ({ state, roomID }) => {
      // console.log("missed_call")
      if (state === "decline" || state === "cancel") {
        if (roomID === data.chatId) {
          printMessage("You missed a call", roomID);
        }
      }
    });

    socket.on("printMsgEnded", ({ roomID }) => {
      // if(roomID===data.chatId){
      printMessage("The call ended", roomID);
      // }
    });

    return () => {
      unSub();
    };
  }, [data.chatId]);

  return (
    <div className="messages">
      {messages.map((m) => (
        <Message
          message={m}
          key={m.id}
          call_again={m.call_again ? m.call_again : null}
        />
      ))}
    </div>
  );
};

export default Messages;
