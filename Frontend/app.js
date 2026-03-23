const REDIRECT_URI = "https://d2ez74nu99mzlf.cloudfront.net"; 
const COGNITO_DOMAIN = "ap-south-1lb9cexihr.auth.ap-south-1.amazoncognito.com";
const COGNITO_CLIENT_ID = "29g4gnh2142vbf25b63qqon9mo";

let channel = "open-channel";
let employeeId = "";
let jwtToken = "";
let socket;

function login() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  if (params.has('access_token')) {
    jwtToken = params.get('access_token');
    const idToken = params.get('id_token');

    if (idToken) {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      employeeId = payload['cognito:username'] || "Employee";
    }

    console.log("Login successfull! User:", employeeId);
    window.location.hash = "";
    connect();

  } else {
    const loginUrl = `https://${COGNITO_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=token&scope=email+openid+profile+aws.cognito.signin.user.admin&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = loginUrl; 
  }
}

function connect() {
  socket = new WebSocket(
    "wss://xdqsbghjq4.execute-api.ap-south-1.amazonaws.com/dev?token=" 
    + jwtToken + 
    "&channel=" + channel +
    "&employeeId=" + employeeId 
  );

  socket.onopen = () => {
    console.log("Connected to " + channel);
    document.getElementById("status").innerText = "🟢 Connected";

    socket.send(JSON.stringify({
      action: "sendMessage",
      payload:{
        type:"getHistory",
        channelId: channel
      }
    }));
  };

  socket.onmessage = (event) => {
    try {
      let response = JSON.parse(event.data);
      console.log("received:", response);

      if(response.type === "chatMessage"){
        displayMessage(response.data.sender, response.data.content);
      }

      if(response.type === "chatHistory"){
        response.data.forEach(msg =>{
          displayMessage(msg.sender, msg.content);
        });
      }

    } catch (e) {
      console.error("Error parsing message:", e);
    }
  };

  socket.onclose = () => {
    console.log("Disconnected... reconnecting in 3s");
    document.getElementById("status").innerText = "🔴 Disconnected";
    setTimeout(connect, 3000);
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
}

/* SEND MESSAGE */
function sendMessage() {
  const input = document.getElementById("msg");
  const message = input.value;

  if (!message) return;

  socket.send(JSON.stringify({
    action: "sendMessage",
    payload:{
      channelId: channel,
      content: message,
      sender: employeeId
    }
  }));

  displayMessage(employeeId, message);
  input.value = "";
}

/* DISPLAY MESSAGE */
function displayMessage(sender, message) {
  const messagesDiv = document.getElementById("messages");
  const msgDiv = document.createElement("div");

  const time = new Date().toLocaleTimeString();

  if(sender === employeeId){
    msgDiv.className = "message my-message";
    msgDiv.innerHTML = `${message}<div class="timestamp">${time}</div>`;
  } else {
    msgDiv.className = "message other-message";
    msgDiv.innerHTML = `<strong>${sender}</strong><br>${message}<div class="timestamp">${time}</div>`;
  }

  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* SWITCH CHANNEL */
function switchChannel(newChannel) {
  channel = newChannel;
  document.getElementById("header").children[0].innerText = "# " + channel;
  document.getElementById("messages").innerHTML = "";

  if (socket) socket.close();
}

/* START NEW DIRECT MESSAGE */
function startNewDM() {
  const targetEmployee = prompt("Enter the Employee ID to chat with (e.g., emp_123):");

  if (!targetEmployee || targetEmployee === employeeId) return;

  const participants = [employeeId, targetEmployee].sort();
  const dmChannelId = `dm_${participants[0]}_${participants[1]}`;

  const dmList = document.getElementById("dm-list");

  const newDmDiv = document.createElement("div");
  newDmDiv.className = "channel";
  newDmDiv.innerText = `@ ${targetEmployee}`;
  newDmDiv.onclick = () => switchChannel(dmChannelId);

  dmList.appendChild(newDmDiv);
  switchChannel(dmChannelId);
}

/* ENTER TO SEND */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("msg").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});

login();