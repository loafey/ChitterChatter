var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

var userAmount = 0;

var roomList = [];

app.use(require("express").static("Public"));

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
} //https://stackoverflow.com/questions/5778020/check-whether-an-input-string-contains-a-number-in-javascript

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

io.on("connection", (socket) => {
    console.log("Someone connected: " + socket.client.id);
    userAmount++;

    io.emit("update user amount", userAmount, { for: "everyone" });

    socket.on("send message", (msg, roomID) => {
        if (msg != "") {
            io.to(roomID).emit("recieve message", msg, socket.client.id);
        }
    });

    socket.on("create", (interests, currentRoom, maxusers) => {
        socket.leaveAll();

        if (!isNumeric(maxusers)) {
            maxusers = 4;
        } else {
            maxusers = parseInt(maxusers);
        }

        for (var x = 0; x < roomList.length; x++) {
            if (roomList[x].room == undefined) {
                roomList.splice(x);
            }
        };

        io.of("/").in(currentRoom).clients((error, clients) => {
            if (error) throw error;

            //console.log(clients);
            if (clients.length == 0) {
                for (var x = 0; x < roomList.length; x++) {
                    if (roomList[x].room == currentRoom) {
                        roomList.splice(x);
                    }
                }
            }
        });
        var trimmedInterests = [];
        interests = interests.split(",");
        interests.forEach(interest => {
            trimmedInterests.push(interest.trim());
        });

        var interestLikelyhood = 0;
        var interestLikelyhoodFinal = [];

        for (i = 0; i < roomList.length; i++) {
            for (j = 0; j < trimmedInterests.length; j++) {
                for (x = 0; x < roomList[i].interests.length; x++) {
                    if (trimmedInterests[j] == roomList[i].interests[x]) {
                        interestLikelyhood++;
                    }
                }
            }
            interestLikelyhoodFinal.push({ room: roomList[i].room, interestLikelyhood: interestLikelyhood });
            interestLikelyhood = 0;
        }
        //console.log(interestLikelyhoodFinal);
        var mostInterestingRoom = { interestLikelyhood: 0 };

        if (interestLikelyhoodFinal.length > 0) {
            mostInterestingRoom = interestLikelyhoodFinal.reduce((prev, current) => (prev.interestLikelyhood > current.interestLikelyhood) ? prev : current);
        }
        //console.log("want to join: ");
        //console.log(mostInterestingRoom);
        if (mostInterestingRoom.interestLikelyhood > 0) {
            socket.join(mostInterestingRoom.room);
            io.to(mostInterestingRoom.room).emit("join room", mostInterestingRoom.room, interests);
            io.to(mostInterestingRoom.room).emit("recieve message", socket.client.id + " has joined the chat!");
        } else {
            var id = makeid(64);
            socket.join(id);
            io.to(id).emit("get roomid", id);
            roomList.push({ room: id, interests: trimmedInterests, maxusers: maxusers });
            io.to(id).emit("recieve message", socket.client.id + " has joined the chat!", "New user");
        }
        //socket.join(socket.client.id);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.client.id);
        userAmount--;
        io.emit("update user amount", userAmount, { for: "everyone" });
    });
});

http.listen(port, () => {
    console.log("Listening to port: " + port);
});