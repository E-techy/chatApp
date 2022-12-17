const express = require('express');
const upload =require('express-fileupload')
const fs=require("fs")
const app=express();
app.use(upload())
const server=require('http').createServer(app);
const io=require("socket.io")(server,{cors:{origin:"*"},maxHttpBufferSize: 1e8, pingTimeout: 60000})

// Creating the signup method for the user;
app.use(signUp);
app.use(logger);
app.set("view engine","ejs");
app.use(express.static("public"))


// implementation for the Chat app using socket io.
app.get("/",(req,res)=>{
    res.render('chat')
})

//all the implementations for the user signup
app.post("/login",(req,res)=>{
    if (req.files){
    var file=req.files.file;
    var file2=req.files.file2;
    var filename2=file2.name;
    var filename=file.name
    file.mv('./uploads/photos/'+Date.now()+filename,(err)=>{
      if (err) {
        console.log("the error is" +err )
       res.send("error in uploading data")
      }else{
        console.log("one user has uploaded the file.");
        res.send("File Uploaded Successfully")
      }
    })
  
    file2.mv('./uploads/videos/'+Date.now()+filename2,(err)=>{
     if(err)console.log(err);
    })
  }
  })
  
  app.get("/signup",(req,res)=>{
   if (req.query.new_username==undefined) {
    res.render("signup")
    console.log("Someone has connected to the user id creation page");
   } 
  
  })
  
  app.get("/login",(req,res)=>{
   res.render("login",{text:"aman"})
   console.log("Someone wants to log into his account.");
  
  })
  
  
  function logger(req,res,next) {
   if (req.originalUrl=="/login?username="+req.query.username+"&password="+req.query.password && req.query.username!= undefined && 
        req.query.password!= undefined) {
  
    var checkUserPassword=false;
    var checkUser="There is no user id with this name: "+req.query.username;
    //validating username with password
    var path="./"+req.query.username+".json" 
    try {
      const file=fs.readFileSync(path,"utf-8")
      const json=JSON.parse(file)
      if (json.password==req.query.password) {
        checkUserPassword=true;
      }
    } catch (error) {
      checkUser="Not found"
    }
     if (checkUserPassword==true) {
    res.render("signedUpChat",{username:req.query.username})
    console.log(req.query.username+" has connected to our platform");
    return;
   }
   else if(checkUserPassword==false){
     if (checkUser=="Not found") {
      res.send(checkUser+" any user with this name.")
      return;
     }
    res.render("error",{pass: req.query.password,user: req.query.username})
    console.log("someone has tried to access "+req.query.username +" acccount.");
    return;
   }
   }
   next();
  }
  
  function signUp(req,res,next) {
    if (req.originalUrl!="/?new_username=&new_password=" && req.query.new_username!= undefined && req.query.new_password != undefined) {
     
      const userData={
        username: req.query.new_username,
        password : req.query.new_password
      }
      const json=JSON.stringify(userData);
      const path=req.query.new_username+".json"
      fs.writeFileSync(path,json)
      res.render("newUserCongrats",{username:req.query.new_username});
      console.log("A new user "+req.query.new_username+" has signed up to our platform.");
    }
    next();
  }


// implementation for the Chat app using socket io.
app.get("/",(req,res)=>{
    res.render('chat')
})

server.listen(3000,()=>{
    console.log("Server running at port 3000");
})

var numberOfUsers=0
io.on("connection",(socket)=>{
    numberOfUsers+=1;
    console.log(socket.id);
    //Sending number of active users
    io.emit("userCount",numberOfUsers)
    // Sending users that a new user has joined
    socket.broadcast.emit("newUserJoined",socket.id);

    // Sending publicly received message to all users.
    socket.on("publicMessage",(message,user)=>{
      var username=socket.id;
       if (user!=undefined) {
           username=user;
       }
        console.log(username+" : "+message);
        socket.broadcast.emit("publicMessage",message,username);
    })
    // Room joining request from user
    socket.on("roomJoiningRequest",(roomId,user)=>{
      var username=socket.id;
      if (user!=undefined) {
        username=user;
       }
        console.log(username+" has joined the room : "+roomId);
        socket.join(roomId);
    })
    // Sending private messages to a specific user using his socket id
    socket.on("privateMessageToServer",(message,roomId,user)=>{
      var username=socket.id;
      if (user!=undefined) {
         username=user
       }
        console.log(username+" ,has sent the message: "+message+" in the room: "+roomId);
        io.in(roomId).emit('privateMessageToUser',message,username);
    })
 

    //Receiving public image file from user
    socket.on('image', async (image,socketId) => {
      // image is an array of bytes
      const buffer = Buffer.from(image);
      console.log("Image received");
      // Sending public image file to user
      io.emit('image', buffer.toString('base64'),socketId);
    });

    //Receiving private image file from user
    socket.on('privateImage', async (image,socketId,roomId) => {
      // image is an array of bytes
      const buffer = Buffer.from(image);
      console.log("Image received");
      //Sending Private image file to the users in the received roomId. 
      io.in(roomId).emit('image', buffer.toString('base64'),socketId);
    });
    //handling the disconnect
    socket.on("disconnect",()=>{
        numberOfUsers-=1;
        var left="left"
        console.log(socket.id+" has disconnected.");
        socket.broadcast.emit("publicMessage","This user is disconnected from the Chat.",socket.id);
        socket.broadcast.emit("newUserJoined",socket.id,left);
        socket.broadcast.emit("userCount",numberOfUsers)
    })

   
})