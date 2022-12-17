const socket=io('http://localhost:3000')
socket.on('connect',()=>{
    console.log("You have joined the public Chat.");
})
const user=document.getElementById("username").innerText;

//Handling userCount
socket.on("userCount",(numberOfUsers)=>{
    var noOfUsers=document.getElementById("noOfUsers")
    noOfUsers.innerText=numberOfUsers;
})

// New Users Joining message
socket.on("newUserJoined",(socketId,left)=>{
    var joiningMessage=document.getElementById("userJoining")
    var paragraph=document.createElement("p")
    if (left=="left") {
        paragraph.innerText=socketId.substring(0,5)+" has disconnected the Chat";
    }
    else{
        paragraph.innerText=socketId.substring(0,5)+" has joined the Chat";
    }
    joiningMessage.prepend(paragraph);
    joiningMessage.style.opacity="0.8"
    setTimeout(() => {
        joiningMessage.style.opacity="0.2"
    }, 3000);
})



var joinedRoom="";
// Sending message to the server
var sendButton=document.getElementById("send");
sendButton.addEventListener("click",()=>{
    var message=document.getElementById("message").value;
    if(message=="" || message==undefined){
        return;
    }
    
    // Checking whether the chat is public or private
    var chatTypePublic=document.getElementById("publicChat");
    var chatTypePrivate=document.getElementById("privateChat");
    // Sending public chat message to the server
    if (chatTypePublic.checked) {
        console.log("Sending public message...");
        socket.emit("publicMessage",message,user)
        console.log("Message sent");
        displayMessage(message,"Me")
    }
    // Sending private Chat Message to the Server

    if (chatTypePrivate.checked) {
        console.log("Sending private message...");
        socket.emit("privateMessageToServer",message,joinedRoom,user)
        console.log("Message Sent");
        displayMessage(message,"Me")
    }
    document.getElementById("message").value="";
    console.log("Me: "+message);
})

// Receiving  public message from the server
socket.on("publicMessage",(message,socketId)=>{
    var chatTypePrivate=document.getElementById("privateChat");
    if (chatTypePrivate.checked) {
        return;
    }
    console.log(socketId+": "+message);
    displayMessage(message,socketId)
    
})


// Receiving private message from server
socket.on("privateMessageToUser",(message,socketId)=>{
    var chatTypePrivate=document.getElementById("privateChat");
    if (!chatTypePrivate.checked) {
        return;
    }
    if (socketId==socket.id || socketId==user) {
        console.log("Me: "+message);
        return;
    }
    console.log(socketId+": "+message);
    displayMessage(message,socketId);
  
})


// Function to display message to the user
function displayMessage(message,socketId) {
    var messageList=document.getElementById("messageList");
    var containerDiv=document.createElement("div");
    containerDiv.className="container";
    var br=document.createElement("br");
    messageList.appendChild(br)
    var messagesDiv=document.createElement("div")
    messagesDiv.className="messages"
   
    containerDiv.appendChild(messagesDiv);
    if (socketId=="Me" || socketId==user) {
        messagesDiv.style.float="right";
    }
    var nameDiv=document.createElement("div");
    var nameParagraph=document.createElement("p")
    nameParagraph.innerText=socketId;
    nameDiv.appendChild(nameParagraph);
    messagesDiv.appendChild(nameDiv);
     
    var messageDiv=document.createElement("div");
    var messageH5=document.createElement("h5");
    messageH5.innerText=message;
    messageDiv.appendChild(messageH5);
    messagesDiv.appendChild(messageDiv);
    messageList.appendChild(containerDiv);
    console.log(messageList.scrollHeight);
    document.getElementById('messageList').scrollIntoView({ behavior: 'smooth', block: 'end' });
}

var privateChat=document.getElementById("privateChat");
privateChat.addEventListener("click",()=>{
  var roomId=prompt("Enter the room name you want to join.");
  joinedRoom=roomId;
  socket.emit("roomJoiningRequest",roomId);
  console.log("You have joined the room: "+roomId);
  
})


// Sending images to the server.
document.getElementById('file').addEventListener('change', function() {
    // Checking whether the file is an image or not
    var fileInput = document.getElementById('file');
    var filePath=fileInput.value;
    var allowedExtensions =
            /(\.jpeg|\.jpg|\.webp|\.gif|\.svg|\.png)$/i;
     
    if (!allowedExtensions.exec(filePath)) {
        alert('Invalid file type');
        fileInput.value = '';
        return ;
    } 


    //Reading the image from the input element.
    var chatTypePrivate=document.getElementById("privateChat");
    const reader = new FileReader();
    reader.onload = function() {
      const bytes = new Uint8Array(this.result);
      if (chatTypePrivate.checked) {
        socket.emit('privateImage',bytes,user,joinedRoom);
      }
      else{
      socket.emit('image', bytes,user);
      }
    };
    reader.readAsArrayBuffer(this.files[0]);
    console.log("image sent");
    document.getElementById('file').value='';
  }, false);



  //Receiving image from server.
  socket.on('image', (image,socketId) => {
    const img = new Image();
    img.src = `data:image/jpg;base64,${image}`; 
    img.width=200
    img.height=200
    
    console.log("image received");
    // displaying image in the messageList;
    displayImage(img,socketId);

});



// Function to display image to user by taking an image and socketId as parameters

function displayImage(image,socketId) {
    var messageList=document.getElementById("messageList");
    var containerDiv=document.createElement("div");
    containerDiv.className="container";
    var br=document.createElement("br");
    messageList.appendChild(br)
    var messagesDiv=document.createElement("div")
    messagesDiv.className="messages"
   
    containerDiv.appendChild(messagesDiv);
   
    var nameDiv=document.createElement("div");
    var nameParagraph=document.createElement("p")
    if (socketId==socket.id || socketId==user) {
        socketId="Me"
        messagesDiv.style.float="right";
    }
    nameParagraph.innerText=socketId;
    nameDiv.appendChild(nameParagraph);
    messagesDiv.appendChild(nameDiv);
     
    var messageDiv=document.createElement("div");
    messageDiv.appendChild(image);
    messagesDiv.appendChild(messageDiv);
    messageList.appendChild(containerDiv);
    console.log(messageList.scrollHeight);
    document.getElementById('messageList').scrollIntoView({ behavior: 'smooth', block: 'end' });
}