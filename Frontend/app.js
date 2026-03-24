const REDIRECT_URI = "https://d2ez74nu99mzlf.cloudfront.net"; 
const COGNITO_DOMAIN = "ap-south-1lb9cexihr.auth.ap-south-1.amazoncognito.com";
const COGNITO_CLIENT_ID = "29g4gnh2142vbf25b63qqon9mo";
let channel = "open-channel";
let employeeId = "";
let jwtToken = "";
let socket;
let retryAttempt = 0;
let unreadCounts = {};
const ANNOUNCEMENT_API_URL = "https://k35rf4mxb3wulnwbotwr5plzde0boygy.lambda-url.ap-south-1.on.aws/"; 
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
    if (employeeId === "admin" || employeeId === "hr_manager") {
      document.getElementById("hr-panel").style.display = "block";
    }
    console.log("Login successful! User:", employeeId);
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
    + jwtToken + "&channel=" + channel + "&employeeId=" + employeeId 
  );
  socket.onopen = () => {
    retryAttempt = 0;
    document.getElementById("status").innerText = "Connected";
    socket.send(JSON.stringify({
      action: "sendMessage",
      payload: { type: "getHistory", channelId: channel }
    }));
  };
  socket.onmessage = (event) => {
    try {
      let response = JSON.parse(event.data);
      console.log("received:", response);
      if (response.type === "chatMessage") {
        const msgChannel = response.data.channelId;
        if (msgChannel === channel) {
            displayMessage(response.data.sender, response.data.content);
        } else {
            unreadCounts[msgChannel] = (unreadCounts[msgChannel] || 0) + 1;
            const badge = document.getElementById("badge-" + msgChannel);
            if (badge) {
                badge.innerText = unreadCounts[msgChannel];
                badge.style.display = "inline-block";
            }
        }
      }
      else if (response.type === "chatHistory") {
        response.data.forEach(msg => {
          displayMessage(msg.sender, msg.content);
        });
      } 
      else if (response.type === "hr_announcement") {
        displayAnnouncement(response);
      }
    } catch (e) {
      console.error("Error parsing message:", e);
    }
  }
  socket.onclose = () => {
    document.getElementById("status").innerText = "Disconnected";
    let timeout = Math.pow(2, retryAttempt) * 3000;
    if (timeout > 30000) timeout = 30000;
    console.log(`Reconnecting in ${timeout/1000} seconds...`);
    setTimeout(connect, timeout);
    retryAttempt++;
  };
}
function sendMessage() {
  const input = document.getElementById("msg");
  const message = input.value;
  if (!message) return 
  socket.send(JSON.stringify({
    action: "sendMessage",
    payload: { channelId: channel, content: message, sender: employeeId }
  }));
  displayMessage(employeeId, message);
  input.value = "";
}
async function sendAnnouncement() {
  const text = document.getElementById("announcementText").value;
  const priority = document.getElementById("priority").value;
  if (!text) return;
  try {
      const response = await fetch(ANNOUNCEMENT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              announcement: text,
              priority: priority,
              sender_id: employeeId
          })
      });
      if (response.ok) {
          alert("Broadcast sent via SNS!");
          document.getElementById("announcementText").value = "";
      } else {
          alert("Failed to send broadcast.");
      }
  } catch (err) {
      console.error("Broadcast error:", err);
  }
}
/* DISPLAY MESSAGE */
function displayMessage(sender, message) {
  const messagesDiv = document.getElementById("messages");
  const msgDiv = document.createElement("div");
  if (sender === employeeId) {
    msgDiv.className = "message my-message";
    msgDiv.innerHTML = message;
  } else {
    msgDiv.className = "message other-message";
    msgDiv.innerHTML = `<strong>${sender}</strong><br>${message}`;
  } 
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
/* DISPLAY ANNOUNCEMENT */
function displayAnnouncement(data) {
  const messagesDiv = document.getElementById("messages");
  const div = document.createElement("div");
  const priority = data.priority || "normal";
  const text = data.announcement || "No message";
  div.className = "announcement " + priority;
  div.innerHTML = `${text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
/* SWITCH CHANNEL */
function switchChannel(newChannel) {
  channel = newChannel;
  document.getElementById("channel-title").innerText = "# " + channel;
  document.getElementById("messages").innerHTML = "";
  unreadCounts[channel] = 0;
  const badge = document.getElementById("badge-" + channel);
  if (badge) {
      badge.style.display = "none";
      badge.innerText = "0";
  }
  if (socket) socket.close();
}
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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("msg").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});
login();