const employeeId = prompt("Enter your employee ID");
let channel = "engineering";

let socket;

function connect() {

  socket = new WebSocket(
    "wss://xdqsbghjq4.execute-api.ap-south-1.amazonaws.com/dev?employee_id=" 
    + employeeId + 
    "&channel=" + channel
  );

  socket.onopen = () => {
    console.log("✅ Connected");
  };

  socket.onmessage = (event) => {
    try {
      let data = JSON.parse(event.data);

      // Handle case where backend wraps response
      if (data.body) {
        data = JSON.parse(data.body);
      }

      console.log("Received:", data);

      displayMessage(data.sender, data.message);

    } catch (e) {
      console.error("Error parsing message:", e);
    }
  };

  socket.onclose = () => {
    console.log("❌ Disconnected... reconnecting in 3s");
    setTimeout(connect, 3000);
  };

  socket.onerror = (err) => {
    console.error("⚠️ WebSocket error:", err);
  };
}

/* SEND MESSAGE (NO FAKE RESPONSE HERE) */
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

/* DISPLAY MESSAGE */
function displayMessage(sender, message) {

  const messagesDiv = document.getElementById("messages");

  const msgDiv = document.createElement("div");
  msgDiv.className = "message";

  msgDiv.innerHTML = `<strong>${sender}</strong><br>${message}`;

  messagesDiv.appendChild(msgDiv);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* SWITCH CHANNEL */
function switchChannel(newChannel) {

  channel = newChannel;

  document.getElementById("header").innerText = "# " + channel;

  document.getElementById("messages").innerHTML = "";

  if (socket) socket.close(); // reconnect with new channel
}

connect();
