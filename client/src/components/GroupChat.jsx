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
