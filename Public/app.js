var socket = io();
var sendChatButton = document.getElementById("chat-send-button");
var roomID = "";
var chatText = document.getElementById("chat-text");

sendChatButton.addEventListener("click", () => {
    if (document.getElementById("chat-text").value != "") {
        socket.emit("send message", document.getElementById("chat-text").value, roomID);
        document.getElementById("chat-text").value = "";
    }
});
var ev = document.createEvent("Event");
chatText.addEventListener('keypress', (ev) => {
    if (ev.keyCode === 13 || ev.which === 13) {
        if (document.getElementById("chat-text").value != "") {
            socket.emit("send message", document.getElementById("chat-text").value, roomID);
            document.getElementById("chat-text").value = "";
        }
    }
});

var chatContainer = document.getElementById("chat-container");

socket.on("recieve message", (msg, sender) => {
    var chatMessage = document.createElement("div");
    chatMessage.classList.add("chat-message-one")
    chatMessage.innerHTML = "<font color=lightgray>" + sender + ": </font>" + msg;
    chatContainer.appendChild(chatMessage);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
});

var connectedUsersNumbers = document.getElementById("connected-users-numbers");
socket.on("update user amount", (userAmount) => {
    connectedUsersNumbers.innerHTML = userAmount;
});

socket.on("join room", (roomId, interests) => {
    document.getElementById("roomid").innerHTML = "Room ID: " + roomId.slice(0, 5);
    roomID = roomId;
});

socket.on("get roomid", (roomId) => {
    roomID = roomId;
    document.getElementById("roomid").innerHTML = "Room ID: " + roomId.slice(0, 5);
});

var createRoomButton = document.getElementById("create-room-button");
var interestTextInput = document.getElementById("interests-text-input");
var maxUsersInput = document.getElementById("max-users-input");

createRoomButton.addEventListener("click", () => {
    var interests = interestTextInput.value;
    socket.emit("create", interests, roomID, maxUsersInput.value);
    document.getElementById("chat-container").innerHTML = "";
    document.getElementById("chat-text").value = "";
    document.getElementById("chitterchatter-info").parentElement.removeChild(document.getElementById("chitterchatter-info"));
});

