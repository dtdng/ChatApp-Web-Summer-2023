import React, { useContext, useEffect, useRef,useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { socket } from "../socket";

// let call_againn;
const Message = ({ message, call_again }) => {
  // call_againn = call_again
  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);
  const [type, setType] = useState(null);
  const ref = useRef();
  
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    // console.log("TYPE: ", message?.img.split('/')[0])
    // setType()
    if(typeof message.type === 'string'){
      setType(message.type.split('/')[0]) 
    }
  }, [message]);

  const handleSelect = async () => {
    const roomID = data.chatId
    const host = currentUser.displayName
    const client_name = data.user.displayName
    socket.emit("calling", 
      {
        receiverUserID: data.user.uid,
        senderID: currentUser.uid,
        roomID: roomID,
      })
    
    socket.on("turn_window_call", ()=>{
      // console.log("turn_window_call")
      const redirectURL = `http://localhost:3006/sfu/${roomID}/${host}`;
      window.open(`${redirectURL}`, '_blank','width=800,height=600');
    })
  };


  return (
    <div
      ref={ref}
      className={`message ${message.senderId === currentUser.uid && "owner"}`}
    >
      <div className="messageInfo">
      </div>
      <div className="messageContent">
        <p
          data-toggle="tooltip"
          data-placement="top"
          title={message.date.toDate().toUTCString()}
        >
          {message.text}
          {call_again==="call_again" ? <button id="call_again" onClick={handleSelect}>Goi lai</button> : null}
        </p>
        
        {message.img && type==="image"?<img src={message.img} alt="" />: null}

        {message.img && type==="video"?
        <iframe width="300" height="200" src={message.img} frameBorder="0" allowFullScreen></iframe>
        : null}
        {message.img && type==="audio"?
        <audio controls src={message.img}></audio>
        : null}
        {message.img && type!=="image" && type!=="video" && type!=="audio"?
        <a href={message.img} download = 'filename' target="_blank">
        <p>File {message.name}</p>
        </a>
        : null}
      </div>
    </div>
  );
};

export default Message;
