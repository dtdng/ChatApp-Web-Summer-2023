import React, { useContext, useState } from "react";
import addGroup from "../img/conversation.png";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import CreateGroupForm from "./CreateGroup";

const GroupChat = () => {
  const { currentUser } = useContext(AuthContext);
  const [buttonPopup, setButtonPopup] = useState(false);
  const handleClick = async () => {
    setButtonPopup(true);
    // const combinedId = currentUser.uid + Timestamp.now().seconds;
    // try {
    //   const res = await getDoc(doc(db, "chats", combinedId));
    //   if (!res.exists()) {
    //     await setDoc(doc(db, "chats", combinedId), { messages: [] });
    //   }
    //   await updateDoc(doc(db, "userChats", currentUser.uid), {
    //     // [combinedId + ".userInfo"]: {
    //     //   uid: user.uid,
    //     //   displayName: user.displayName,
    //     //   photoURL: user.photoURL,
    //     // },
    //     [combinedId + ".roomId"]: combinedId,
    //     [combinedId + ".type"]: "Group",
    //     [combinedId + ".name"]: "Group Created by " + currentUser.displayName,
    //     [combinedId + ".date"]: serverTimestamp(),
    //   });
    // } catch (err) {}
  };
  return (
    <div>
      <img
        className="addGroupBtn"
        src={addGroup}
        alt=""
        srcset=""
        onClick={handleClick}
      />
      <CreateGroupForm
        trigger={buttonPopup}
        setTrigger={setButtonPopup}
      ></CreateGroupForm>
    </div>
    // </div>
  );
};

export default GroupChat;
