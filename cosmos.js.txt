const server = window.location.origin;
const socket = io(server);

let username = "";
let pfp = "";

document.getElementById("login").style.display = "block";

function register() {
  fetch(server + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    })
  }).then(r => r.json()).then(d => {
    alert(d.success ? "Registered" : d.error);
  });
}

function login() {
  fetch(server + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    })
  }).then(r => r.json()).then(d => {
    if (d.error) return alert(d.error);

    username = d.username;
    pfp = d.pfp;

    document.getElementById("name").innerText = username;
    document.getElementById("pfp").src = server + pfp;

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "block";
  });
}

function uploadPfp() {
  const file = document.getElementById("pfpUpload").files[0];
  const form = new FormData();
  form.append("pfp", file);
  form.append("username", username);

  fetch(server + "/uploadPfp", {
    method: "POST",
    body: form
  }).then(r => r.json()).then(d => {
    pfp = d.pfp;
    document.getElementById("pfp").src = server + pfp;
  });
}

function sendMessage() {
  const text = document.getElementById("msgBox").value;
  if (!text) return;

  const msg = {
    username,
    pfp,
    text,
    timestamp: Date.now()
  };

  socket.emit("sendMessage", msg);
  document.getElementById("msgBox").value = "";
}

socket.on("loadMessages", (msgs) => {
  msgs.forEach(addMessage);
});

socket.on("newMessage", (msg) => {
  addMessage(msg);
});

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<img src="${server + msg.pfp}"><b>${msg.username}</b>: ${msg.text}`;
  document.getElementById("messages").appendChild(div);
}
