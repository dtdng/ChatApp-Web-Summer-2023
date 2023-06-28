import React, { useContext, useState } from "react";
import addreaction from "../img/add_reaction.png";
import voice_record from "../img/voice_record.png";
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
import { getDownloadURL, ref, uploadBytesResumable, uploadBytes } from "firebase/storage";
import { socket } from "../socket";

const Input = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const [isClick, setisClick] = useState(true);
  const [recordedChunks, setrecordedChunks] = useState({record: 3})
  const [mediaRecorder, setmediaRecorder] = useState({media: 3})

  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const handleFileChange = (event) => {
    console.log("Type of file",event.target.files[0])
    setImg(event.target.files[0]);
  };


  const handleRecordAudio = ()=>{
    console.log("isSclick: ", isClick)
    if(isClick===true){
      console.log("start")
      const handleSuccess = function(stream) {
        const options = {mimeType: 'audio/webm'};
        recordedChunks.record = []
        setrecordedChunks({ ...recordedChunks });
        const b = new MediaRecorder(stream, options)
        mediaRecorder.media = b
        setmediaRecorder({ ...mediaRecorder })
        console.log(mediaRecorder)
        console.log(recordedChunks)
        mediaRecorder.media.addEventListener('dataavailable', function(e) {
          if (e.data.size > 0) recordedChunks.record.push(e.data);
        });

        mediaRecorder.media.start();
      };

      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then(handleSuccess);
      setisClick(false)
    }
    else{
      console.log("stop")
      mediaRecorder.media.addEventListener('stop', function() {
        console.log("stop2")
        const blob = new Blob(recordedChunks.record,{type: 'audio/wav'})
        const name_file= 'your_voice.wav';
        console.log(blob)
        setImg(blob);
        // =============================================================================================
        // const storageRef = ref(storage, uuid());

        // const uploadTask = uploadBytesResumable(storageRef, blob);

        // uploadTask.on(
        //   "state_changed",
        //   (snapshot) => {
        //     // Handle upload progress here
        //     const progress =
        //       (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        //     console.log(`Upload is ${progress}% done`);
        //   },
        //   (error) => {
        //     console.log(error);
        //   },
        //   () => {
        //     getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
        //       console.log("downloadURL",downloadURL)

        //       await updateDoc(doc(db, "chats", data.chatId), {
        //         messages: arrayUnion({
        //           id: uuid(),
        //           text: "",
        //           senderId: currentUser.uid,
        //           date: Timestamp.now(),
        //           img: downloadURL,
        //           name: name_file,
        //           type: "audio/",
        //         }),
        //       });
        //     });
        //   }
        // );
        // =============================================================================================
      });

      mediaRecorder.media.stop();
      setisClick(true)
    }
  }

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
            console.log("downloadURL",downloadURL)
            // const xhr = new XMLHttpRequest();
            // xhr.responseType = 'blob';
            // xhr.onload = (event) => {
            //   const blob = xhr.response;
            // };
            // xhr.open('GET', downloadURL);
            // xhr.send();
            await updateDoc(doc(db, "chats", data.chatId), {
              messages: arrayUnion({
                id: uuid(),
                text: sendText,
                senderId: currentUser.uid,
                date: Timestamp.now(),
                img: downloadURL,
                name: img.type==="audio/wav"?"your_voic.wav":img.name,
                type: img.type,
              }),
            });
          });
        }
      );
    } else {
      await updateDoc(doc(db, "chats", data.chatId), {
        messages: arrayUnion({
          id: uuid(),
          text: sendText,
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
        <div class={isClick?"record_btn":"record_btn2"}>
          <img src={voice_record} alt="" onClick={handleRecordAudio}/>
        </div>
        
        
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