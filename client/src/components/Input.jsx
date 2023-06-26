import React, { useContext, useState } from "react";
import addreaction from "../img/add_reaction.png";
import send from "../img/send.png";
import addImg from "../img/imagesmode.png";
// import ImageCompressor from "image-compressor";
// import Compressor from "compressorjs";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
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
import { socket } from "../socket";

const Input = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);

  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const handleFileChange = (event) => {
    setImg(event.target.files[0]);
  };

  const handleSend = async () => {
    let sendText = text.trim();
    setText("");
    // let sendText = text;
    if (!img && sendText == "") {
      return;
    }
    if (data.user.uid == null) {
      return;
    }
    if (img) {
      // let compressedImage = compressImage(img);
      const storageRef = ref(storage, uuid());

      const uploadTask = uploadBytesResumable(storageRef, img);
      setImg(null);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Handle upload progress here
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.log(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            await updateDoc(doc(db, "chats", data.chatId), {
              messages: arrayUnion({
                id: uuid(),
                text: sendText,
                senderId: currentUser.uid,
                date: Timestamp.now(),
                img: downloadURL,
              }),
            });
          });
        }
      );
    } else {
      await updateDoc(doc(db, "chats", data.chatId), {
        messages: arrayUnion({
          id: uuid(),
          text: "miss call",
          senderId: currentUser.uid,
          date: Timestamp.now(),
        }),
      });
    }

    await updateDoc(doc(db, "userChats", currentUser.uid), {
      [data.chatId + ".lastMessage"]: {
        text,
      },
      [data.chatId + ".date"]: serverTimestamp(),
    });

    await updateDoc(doc(db, "userChats", data.user.uid), {
      [data.chatId + ".lastMessage"]: {
        text,
      },
      [data.chatId + ".date"]: serverTimestamp(),
    });

    socket.emit("sendMessage", {
      receiverUserID: data.user.uid,
      senderID: currentUser.uid,
    });

    setText("");
    setImg(null);
  };

  return (
    <div className="input">
      <img src={send} alt="" onClick={handleSend} data-toggle="tooltip"
          data-placement="top"
          title="Send" className="sendContent" />
      <input
        type="text"
        placeholder="Type something..."
        onChange={(e) => setText(e.target.value)}
        value={text}
        onKeyDown={handleKeyPress}
      />
      <div className="send">
        <img src={addreaction} alt="" />
        <input
          type="file"
          style={{ display: "none" }}
          id="file"
          onChange={handleFileChange}
          accept="image/*"
        />
        <label htmlFor="file">
          <img src={addImg} data-toggle="tooltip"
          data-placement="top"
          title="Upload Image"  alt="" />
        </label>
      </div>
    </div>
  );
};

export default Input;