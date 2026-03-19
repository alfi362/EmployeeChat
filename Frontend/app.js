const employeeId = prompt("Enter your employee ID");
const channel = "engineering";

let socket;

function connect() {

  socket = new WebSocket(
    "wss://xdqsbghjq4.execute-api.ap-south-1.amazonaws.com/dev?employee_id=" 
    + employeeId + 
    "&channel=" + channel
  );

  socket.onopen = () => {
    console.log("✅ Connected to WebSocket");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    displayMessage(data.sender, data.message);
  };

  socket.onclose = () => {
    console.log("❌ Disconnected... reconnecting in 3s");
    setTimeout(connect, 3000);
  };

  socket.onerror = (err) => {
    console.error("⚠️ WebSocket error:", err);
  };
}

function sendMessage() {

  const input = document.getElementById("msg");
  const message = input.value;

  if (!message) return;

  socket.send(JSON.stringify({
    action: "sendMessage",
    sender: employeeId,
    channel: channel,
    message: message
  }));

  input.value = "";
}

function displayMessage(sender, message) {

  const messagesDiv = document.getElementById("messages");

  const msgDiv = document.createElement("div");
  msgDiv.className = "message";

  msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;

  messagesDiv.appendChild(msgDiv);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

connect();
