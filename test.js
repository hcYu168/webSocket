const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const session = require("express-session");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.set("view engine","ejs");
app.use(express.static("./public"));

app.use(session({
	secret : 'chatroom',
	resave: false,
    saveUninitialized: true

}));
var allUser = [];
var onLine = [];
//var isOnline = false;
Array.prototype.removeByValue = function(val) {
  for(var i=0; i<this.length; i++) {
    if(this[i] == val) {
      this.splice(i, 1);
      break;
    }
  }
}

app.get("/",function (req, res) {
  	res.render("index");
});
app.get("/check",function(req,res){
	var yonghuming =  req.query.yonghuming;
	if(!yonghuming){
		res.send("请输入用户名");
		return;
	}
	if(allUser.indexOf(yonghuming) != -1){
		 if(onLine.indexOf(yonghuming) != -1){
		 	res.send("用户名已经被占用了");
			return;
		}else{
			onLine.push(yonghuming);
			req.session.yonghuming = yonghuming;
			//isOnline = true;
			return res.redirect("/chat");
		}
		
		
	}
	allUser.push(yonghuming);
	onLine.push(yonghuming);
	req.session.yonghuming = yonghuming;
	res.redirect("/chat");

});
app.get("/chat",function(req,res,next){
	if(!req.session.yonghuming){
		res.redirect("/");
		return;
	}
	res.render("chat",{
		"yonghuming" : req.session.yonghuming
	});
})


//监听客户端是否连接 
wss.on('connection', function (ws, req) {
	console.log("lianjie");
	console.log(allUser)
//	console.log(isOnline);
	 // if(isOnline){
	 // 	wss.broadcast(3,onLine[onLine.length-1]);

	 // }else{
	  	wss.broadcast(2,onLine[onLine.length-1]);
	 // }
	
	//ws.send("欢迎您加入聊天室");
	//获取客户端传过来的数据
	//var userStr = ""
  ws.on('message',function(jsonStr,flags){

  	//解析json数据
  	var obj = eval('('+jsonStr+')');
  	this.user = obj;
  //	userStr = this.user.name;
  	//判断是否有传内容过来
  	if(typeof this.user.content != "undefined"){
  		wss.broadcast(1,obj);
  	}
  	// 退出聊天  
   
   });
   ws.on('close', function(close) {  
  	//console.log(userStr.name);
        try{  
            wss.broadcast(0,this.user.name);
			
           }catch(e){
			  console.log(e);  
              console.log('刷新页面了');  
           }  
      });  
});
  //广播  
wss.broadcast = function broadcast(s,user) { 
	
    wss.clients.forEach(function each(client) {  
	//console.log("======"+client.toString());
            if(s == 1){  
                client.send("<font color='red'>"+user.name+"</font>"+ ":" +user.content);  
            }  
            if(s == 0){
                client.send(user+ "退出聊天室");
				onLine.removeByValue(user);    
            }
			if(s == 2){
				client.send(user+ "进入聊天室");

			} 
			/*if(s == 3){
				client.send(user+ "再次上线");
				//isOnline = false;
			}   */
        
    });  
};   
 


server.listen(3000, function listening() {
  console.log('Listening on %d', server.address().port);
});
//连接到聊天室的时候获取不到用户名session的值
//无法判断出你是否下线   
//