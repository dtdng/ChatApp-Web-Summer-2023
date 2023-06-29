import React, { useContext, useState, useEffect, } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "../pages/style.css";
import Cam from "../img/video_call.png";
import online from "../img/available.png";
import offline from "../img/unavailable.png";
import Messages from "./Messages";
import search from "../img/search.png";
import more from "../img/more_vert.png";
import Input from "./Input";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import Notification from "./Notification";
import { socket } from "../socket";
import groupChat from "../img/group-chat.png";
import { v4 as uuid } from "uuid";
import {
  arrayUnion,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {storage } from "../firebase";
const Chat = ({
  roomID,
  receiverUserID,
  senderUserID,
  showNotification,
  caller,
  state,
  type,
}) => {
  const { data } = useContext(ChatContext);
  console.log(showNotification);
  const { currentUser } = useContext(AuthContext);
  // const roomId = data.roomID;
  const [room, setRoom] = useState(null);
  const [listOfUsers, setlistOfUsers] = useState([]);
  
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", data.chatId), (doc) => {
      doc.exists() && setlistOfUsers(doc.data().listUserInGroup);
      
    });
    setRoom(data.chatId)
    // console.log("room: ",data.chatId);
    return () => {
      unSub();
    };
  }, [data.chatId]);


    const handleSelect = () => { 
      let roomID = data.chatId
      let host = currentUser.displayName
      
      if(data.type === "DirectMessage"){
        socket.emit("calling", 
        {
          receiverUserID: data.user.uid,
          senderID: currentUser.uid,
          roomID: room,
        })
      
      }
      if(data.type === "Group"){
        socket.emit("calling_group", 
        {
          receiverUserID: listOfUsers.map(user => user.uid),
          senderID: currentUser.uid,
          roomID: room,
          group_name: "Group " + data.user
        })

        updateDoc(doc(db, "chats", data.chatId), {
          messages: arrayUnion({
            id: uuid(),
            text: "Group Video Call is on",
            senderId: currentUser.uid,
            senderUsername: currentUser.displayName,
            senderAvatar: currentUser.photoURL,
            date: Timestamp.now(),
            call_again: "join",
          }),
        });
    
        const text=""
        updateDoc(doc(db, "userChats", currentUser.uid), {
        [data.chatId + ".lastMessage"]: {
          text,
        },
        [data.chatId + ".date"]: serverTimestamp(),
        });
      }
      socket.on("turn_window_call", ({room_ID})=>{
        console.log("data.chatID", room_ID)
        const redirectURL = `http://localhost:3006/sfu/${room_ID}/${host}/`;
        window.open(`${redirectURL}`, '_blank','width=800,height=600');
        
        const handleMsgEvent = (event) => {
          if (event.origin === 'http://localhost:3006') {
            if (event.data === 'tabClosed') {
              // Tab is closed
              console.log(4)
              socket.emit("sendEndedCallMsg",{
                receiverUserID: currentUser.uid,
                roomID: room_ID,
              })
            }
          }
        }
        window.addEventListener('message', handleMsgEvent);
        })

    // ============================================================================
    }

  return (
    <div className="chat">
      {showNotification ? (
        <Notification
          roomID={roomID}
          receiverUserID={receiverUserID}
          senderUserID={senderUserID}
          caller={caller}
          state={state}
          type={type}
        />
      ) : null}
      <div className="chatInfoBox">
        {data.type && (
          <div class="chatInfo">
            <div className="receiverInfo">
              {data.type === "DirectMessage" ? (
                <img src={data.user?.photoURL} alt="" />
              ) : (
                <img src={groupChat} alt="" />
              )}
              {data.type === "DirectMessage" ? (
                <span>{data.user?.displayName}</span>
              ) : (
                <span>{data.user}</span>
              )}
            </div>
            <div className="chatIcons">
              {!showNotification ? (
                <img
                  className="chatIcon"
                  src={Cam}
                  alt=""
                  data-toggle="tooltip"
                  data-placement="top"
                  title="Call Video"
                  onClick={handleSelect}
                />
              ) : null}
              {/* <img className="chatIcon" src={search} alt="" /> */}

              {!showNotification ? (
                <img className="chatIcon" src={more} alt="" />
              ) : null}
              {/* <img src="" alt="" /> */}
            </div>
          </div>
        )}
      </div>

      <Messages />
      <Input />
    </div>
  );
};

export default Chat;
