import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

function Chat({ socket, username, room }) {
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
  
    
    useEffect(() => {
        
        const fetchMessages = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/messages/${room}`);
                if (response.ok) {
                    const messages = await response.json();
                    setMessageList(messages); 
                    console.log("Message history loaded:", messages);
                } else {
                    console.error("Failed to fetch messages");
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        if (room) {
            fetchMessages();
        }
    }, [room]); 

    const sendMessage = async () => {
      if (currentMessage !== "") {
        const messageData = {
          room: room,
          author: username,
          message: currentMessage,
          time:
            new Date(Date.now()).getHours() +
            ":" +
            new Date(Date.now()).getMinutes(),
        };
  
 
        await socket.emit("send_message", messageData);
  
        
        setMessageList((list) => [...list, messageData]);
        setCurrentMessage("");
        console.log("Message sent:", messageData);
      }
    };
  
    useEffect(() => {
     
      
      
      const receiveMessage = (data) => {
        console.log("Message received:", data);
        setMessageList((list) => [...list, data]);
      };
  
      
      socket.on("receive_message", receiveMessage);
      console.log("Socket listener added for 'receive_message'");
  
      
      return () => {
        socket.off("receive_message", receiveMessage);
        console.log("Socket listener removed for 'receive_message'");
      };
    }, [socket]);

    return (
        <div className="chat-window">
            <div className="chat-header">
                <p>Live Chat</p>
            </div>
            <div className="chat-body">
                <ScrollToBottom className="message-container">
                    {messageList.map((messageContent) => {
                        return (
                            <div
                                className="message"
                                id={username === messageContent.author ? "you" : "other"}
                            >
                                <div>
                                    <div className="message-content">
                                        <p>{messageContent.message}</p>
                                    </div>
                                    <div className="message-meta">
                                        <p id="time">{messageContent.time}</p>
                                        <p id="author">{messageContent.author}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </ScrollToBottom>
            </div>
            <div className="chat-footer">
                <input
                    type="text"
                    value={currentMessage}
                    placeholder="Hey..."
                    onChange={(event) => {
                        setCurrentMessage(event.target.value);
                    }}
                    onKeyPress={(event) => {
                        event.key === "Enter" && sendMessage();
                    }}
                />
                <button onClick={sendMessage}>&#9658;</button>
            </div>
        </div>
    );
}

export default Chat;