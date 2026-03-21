const REDIRECT_URI = "https://d2ez74nu99mzlf.cloudfront.net"; 
const COGNITO_DOMAIN = "ap-south-1lb9cexihr.auth.ap-south-1.amazoncognito.com";
const COGNITO_CLIENT_ID = "29g4gnh2142vbf25b63qqon9mo";
let channel = "engineering";
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
    const loginUrl = `https://${COGNITO_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = loginUrl;
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