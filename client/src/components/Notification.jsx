import React, { useContext, useState, useEffect } from "react";
import "../pages/style.css";
import { socket } from "../socket";
import { AuthContext } from "../context/AuthContext";

const Notification = ({roomID, receiverUserID, senderUserID, caller, state}) => {
  console.log("Notification")
  const { currentUser } = useContext(AuthContext);
  const [showNotification2, setShowNotification2] = useState(true);
  
  
  const acceptCalling = ()=>{
    
      socket.emit("accept_call",{
          receiverUserID: senderUserID,
          // senderID: currentUser.uid,
      })
      // emit("accept_call") de xoa notification o nguoi ben kia
      socket.emit("cancel_call",{
        receiverUserID: senderUserID,
        state: "accept", 
        roomID: roomID,
      })
      const host = currentUser.displayName
      const redirectURL = `http://localhost:3006/sfu/${roomID}/${host}/`;
      window.open(`${redirectURL}`, '_blank','width=800,height=600');
      window.addEventListener('message', (event) => {
        if (event.origin === 'http://localhost:3006') {
   
          if (event.data === 'tabClosed') {
            console.log(5)
            socket.emit("sendEndedCallMsg",{
              receiverUserID: receiverUserID,
              roomID: roomID,
            })

          }
        }
      });



      setShowNotification2(false);
    
  }

  const declineCalling = ()=>{
    
    socket.emit("cancel_call",{
      receiverUserID: senderUserID,
      state: "decline",
      roomID: roomID,
    })
    setShowNotification2(false);
  }

  const cancelCalling = () =>{
    
    socket.emit("cancel_call",{
      receiverUserID: receiverUserID,
      state: "cancel",
      roomID: roomID,
    })
    setShowNotification2(false);
  }

  if (!showNotification2) {
    return null;
  }


  return (
    <div className="notification">
      <p>{state==="waiting" ? "": caller} {state==="waiting" ? "Waiting": "is calling"}</p>
      {state ==="accepting" ? <button id="accept" onClick={() => acceptCalling()}>Accept</button> : null}
      {state ==="accepting" ? <button id="decline" onClick={() => declineCalling()}>Decline</button> : null}
      {state==="waiting" ? <button id="cancel" onClick={()=> cancelCalling()}>Cancel</button> : null}
    </div>
  );
};

export default Notification;