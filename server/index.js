// backend/server.js

const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

app.use(cors());
const server = http.createServer(app);
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/chatapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

// Room Schema
const roomSchema = new mongoose.Schema({
    name: String,
});

const Room = mongoose.model("Room", roomSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
        index: true
    },
    author: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    }
});

const Message = mongoose.model('Message', messageSchema);

// API route to check if a room exists
app.get("/api/rooms/:name", async (req, res) => {
    try {
        const roomName = req.params.name;
        const room = await Room.findOne({ name: roomName });
        
        if (room) {
            return res.status(200).json({ exists: true });
        } else {
            return res.status(200).json({ exists: false });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error checking room existence' });
    }
});

// API route to get room messages
app.get("/api/messages/:room", async (req, res) => {
    try {
        const { room } = req.params;
        const messages = await Message.find({ room }).sort({ time: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// Socket connection for creating/joining rooms and messaging
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Handle room creation
    socket.on("create_room", async (roomName) => {
        try {
            let room = await Room.findOne({ name: roomName });

            if (!room) {
                room = new Room({ name: roomName });
                await room.save();
                console.log(`Room created: ${roomName}`);
            } else {
                socket.emit("error", "Room already exists. Please join the room instead.");
                return;
            }

            socket.join(roomName);
            console.log(`User with ID: ${socket.id} created and joined room: ${roomName}`);
        } catch (error) {
            console.error("Error creating room:", error);
            socket.emit("error", "An error occurred while trying to create the room.");
        }
    });

    // Handle room joining
    socket.on("join_room", async (roomName) => {
        try {
            let room = await Room.findOne({ name: roomName });

            if (room) {
                socket.join(roomName);
                console.log(`User with ID: ${socket.id} joined room: ${roomName}`);
            } else {
                socket.emit("error", "Room does not exist. Please create a new room.");
            }
        } catch (error) {
            console.error("Error joining room:", error);
            socket.emit("error", "An error occurred while trying to join the room.");
        }
    });

    // Handle sending messages
    socket.on("send_message", async (data) => {
        try {
            const message = new Message({
                room: data.room,
                author: data.author,
                message: data.message,
                time: data.time
            });
            await message.save();
            
            socket.to(data.room).emit("receive_message", data);
            console.log("Message stored and sent:", data);
        } catch (error) {
            console.error("Error storing message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});

server.listen(3001, () => {
    console.log("SERVER RUNNING");
});
