import "./App.css";
import io from "socket.io-client";
import { useState } from "react";
import Chat from "./Chat";

const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [action, setAction] = useState("join"); 

  const checkRoomExists = async (roomName) => {
    try {
      const response = await fetch(`http://localhost:3001/api/rooms/${roomName}`);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking room existence:", error);
      return false;
    }
  };


  const handleRoomAction = async () => {
    if (username !== "" && room !== "") {
      const roomExists = await checkRoomExists(room);

      if (action === "join") {
        if (roomExists) {
          socket.emit("join_room", { roomName: room, username });
          setShowChat(true);
        } else {
          alert("Room does not exist. Please create a new room.");
        }
      } else if (action === "create") {
        if (!roomExists) {
          socket.emit("create_room", { roomName: room, username });
          setShowChat(true);
        } else {
          alert("Room already exists. Please join the room.");
        }
      }
    }
  };

  return (
    <div className="App">
      {!showChat ? (
        <div className="joinChatContainer">
          <h3>{action === "join" ? "Join An Existing Chat" : "Create A New Chat"}</h3>

          <input
            type="text"
            placeholder="Username..."
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
          <input
            type="text"
            placeholder="Room ID..."
            onChange={(event) => {
              setRoom(event.target.value);
            }}
          />

          <div className="radio">
            <input
              type="radio"
              id="joinRoom"
              name="roomAction"
              value="join"
              checked={action === "join"}
              onChange={() => setAction("join")}
            />
            <label id="lab" htmlFor="joinRoom">Join Existing Room</label>

            <input
              type="radio"
              id="createRoom"
              name="roomAction"
              value="create"
              checked={action === "create"}
              onChange={() => setAction("create")}
            />
            <label id="lab" htmlFor="createRoom">Create New Room</label>
          </div>

          <button onClick={handleRoomAction}>
            {action === "join" ? "Join Room" : "Create Room"}
          </button>
        </div>
      ) : (
        <Chat socket={socket} username={username} room={room} />
      )}
    </div>
  );
}

export default App;
