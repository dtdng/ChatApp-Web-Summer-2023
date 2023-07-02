import React from "react";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
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
import Search from "./Search";
import search from "../img/search.png";

const CreateGroupForm = (props) => {
  // const { currentUser } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [userYou, setUserYou] = useState(null);
  const [err, setErr] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { currentUser } = useContext(AuthContext);

  const handleSearch = async () => {
    const q = query(
      collection(db, "users"),
      where("displayName", "==", username)
    );

    try {
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        if (doc.data().uid == currentUser.uid) {
          setUserYou(doc.data());
        } else {
          setUser(doc.data());
        }
      });
    } catch (err) {
      setErr(true);
    }
  };

  const handleKey = (e) => {
    e.code === "Enter" && handleSearch();
  };

  const handleSelect = async () => {
    let addUser = {
      uid: user.uid,
      displayName: user.displayName,
    };
    if (selectedUsers.findIndex((x) => x.uid === user.uid) === -1)
      setSelectedUsers([...selectedUsers, addUser]);
    console.log(selectedUsers);
  };

  useEffect(() => {
    setSelectedUsers([
      ...selectedUsers,
      { uid: currentUser.uid, displayName: currentUser.displayName },
    ]);
  }, [confirm]);

  const handleSubmit = async (event) => {
    setConfirm(!confirm);
    console.log("selectedUsers", selectedUsers);
    event.preventDefault();
    const groupName = event.target[0].value;
    console.log(groupName);

    const combinedId = currentUser.uid + Timestamp.now().seconds;
    try {
      const res = await getDoc(doc(db, "chats", combinedId));
      if (!res.exists()) {
        await setDoc(doc(db, "chats", combinedId), { messages: [] });
      }

      selectedUsers.forEach(async (u) => {
        await updateDoc(doc(db, "chats", combinedId), {
          listUserInGroup: selectedUsers,
        });
        await updateDoc(doc(db, "userChats", u.uid), {
          [combinedId + ".roomId"]: combinedId,
          [combinedId + ".type"]: "Group",
          [combinedId + ".name"]: groupName,
          [combinedId + ".date"]: serverTimestamp(),
        });
      });
      await updateDoc(doc(db, "userChats", currentUser.uid), {
        [combinedId + ".roomId"]: combinedId,
        [combinedId + ".type"]: "Group",
        [combinedId + ".name"]: groupName,
        [combinedId + ".date"]: serverTimestamp(),
      });
      props.setTrigger(false);
    } catch (err) {}
  };
  return props.trigger ? (
    <div className="overlayer">
      <form className="form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Group Name"
          name="group-name"
          id=""
          required
        />
        <div className="search">
          <div className="searchForm">
            <div className="searchInput">
              <img
                src={search}
                alt=""
                onClick={handleSearch}
                className="searchIcon"
              />
              <input
                type="text"
                placeholder="Find a user"
                onKeyDown={handleKey}
                onChange={(e) => setUsername(e.target.value)}
                value={username}
              />
            </div>
          </div>
          {err && <span>User not found!</span>}
          {user && (
            <div className="searchUserChat" onClick={handleSelect}>
              <img src={user.photoURL} alt="" />
              <div className="searchUserChatInfo">
                <span>{user.displayName}</span>
              </div>
            </div>
          )}
        </div>
        {selectedUsers.map((m) => (
          <span key={m.uid} style={{ color: "black" }}>
            {m.displayName}
          </span>
        ))}
        <div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => props.setTrigger(false)}
          >
            cancel
          </button>

          <button className="btn btn-success">Create</button>
        </div>
      </form>
    </div>
  ) : (
    ""
  );
};

export default CreateGroupForm;
