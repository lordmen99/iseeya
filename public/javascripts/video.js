const socket = io("/");
const videoGrid = document.getElementById("video-grid");

const myPeer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3002"
});

// my video, mute my own audio
const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = {};

navigator.mediaDevices.getUserMedia({
    video: true, audio: true
}).then(stream => {
    // add my stream to element 
    addVideoStream(myVideo, stream);

    // on call to peers
    myPeer.on("call", call => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    // on new user enter room send my stream to them
    socket.on("user-connected", user_id => {
        console.log(user_id);
        connectToNewUser(user_id, stream);
    }); 
});

myPeer.on("open", id => {
    socket.emit("join-room", ROOM_ID, id);
});

socket.on("user-disconnected", user_id => {
    if(peers[user_id]) peers[user_id].close();
});

// connect to new user
connectToNewUser = (user_id, stream) => {
    // call new user
    const call = myPeer.call(user_id, stream);
    const video = document.createElement("video");

    // on receiving stream
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    });

    // when call is closed
    call.on("close", () => {
        video.remove();
    });

    // add to peers
    peers[user_id] = call;
}

// add video stream to video element
addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });

    // add element to grid
    videoGrid.append(video);
}
