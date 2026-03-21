const COGNITO_CLIENT_ID ="29g4gnh2142vbf25b63qqon9mo"
let channel = "engineering";
let socket;
async function login() {
  const username = prompt("Enter your Cognito Username:");
  const password = prompt("Enter your Password:");

  if (!username || !password) {
    alert("Username and password are required!");
    return;
  }
  try {
    const response = await fetch('https://cognito-idp.ap-south-1.amazonaws.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
      },
      body: JSON.stringify({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password
        }
      })
    });
    const data = await response.json();

    if (data.AuthenticationResult) {
      jwtToken = data.AuthenticationResult.AccessToken;
      employeeId = username;
      console.log("✅ Login successful!");
      connect(); // Start the WebSocket connection
    } else {
      alert("Login failed: " + (data.message || "Invalid credentials"));
    }
  } catch (error) {
    console.error("Auth error:", error);
    alert("Could not connect to Cognito.");
  }
}
function connect() {
  socket = new WebSocket(
    "wss://xdqsbghjq4.execute-api.ap-south-1.amazonaws.com/dev?token=" 
    + jwtToken + 
    "&channel=" + channel
  );
  socket.onopen = () => {
    console.log("Connected to " + channel);
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
      console.log("recived:",response)
      // Handle case where backend wraps response
      if(response.type ==="chatMessage"){
        displayMessage(response.data.sender,response.data.content)
      }
      if(response.type === "chatHistory"){
        response.data.forEach(msg =>{
          displayMessage(msg.sender,msg.content);
        });
      }
    } catch (e) {
      console.error("Error parsing message:", e);
    }
  };
  socket.onclose = () => {
    console.log("Disconnected... reconnecting in 3s");
    setTimeout(connect, 3000);
  };

  socket.onerror = (err) => {
    console.error(" WebSocket error:", err);
  };
}
/* SEND MESSAGE (NO FAKE RESPONSE HERE) */
function sendMessage() {
  const input = document.getElementById("msg");
  const message = input.value;
  if (!message) return;
  socket.send(JSON.stringify({
    action: "sendMessage",
    payload:{
      channelId:channel,
      content:message,
      sender:employeeId
    }
  }));
  displayMessage(employeeId,message)
  input.value = "";
}
/* DISPLAY MESSAGE */
function displayMessage(sender, message) {
  const messagesDiv = document.getElementById("messages");
  const msgDiv = document.createElement("div");
  if(sender ===employeeId){
    msgDiv.className="message my-message";
    msgDiv.innerHTML = `${message}`;
  }
  else{
    msgDiv.className = "message other-message";
    msgDiv.innerHTML = `<strong>${sender}</strong><br>${message}`;
  }
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
login();