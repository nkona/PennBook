/* Some initialization boilerplate. Also, we include the code from
   routes/routes.js, so we can have access to the routes. Note that
   we get back the object that is defined at the end of routes.js,
   and that we use the fields of that object (e.g., routes.get_main)
   to access the routes. */

var express = require('express');
var routes = require('./routes/routes.js');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

http.listen(3000, function(){
	console.log('listening on *:3000');
});

app.io = io;
app.use(express.bodyParser());
app.use(express.logger("default"));

app.use(express.cookieParser());
app.use(express.session({secret: "issahttp://localhost:8080/ secret"}));
app.use(express.static(__dirname + "/public",{maxAge:1}));
//app.use(express.static(__dirname + "/public",{maxAge:1}));

app.get('/getcurruser', routes.get_curr_user);

//LOGIN PAGE
app.get('/', routes.get_login);
app.post('/checklogin', routes.post_check_login);

//SIGNUP PAGE
app.get('/signup', routes.get_signup);
app.post('/createaccount', routes.post_create_account);

//PROFILE PAGE
app.get('/profile', routes.get_profilepage);
app.get('/friendprofile/:email', routes.get_friendprofilepage);
app.get('/nonfriendprofile/:email', routes.get_nonfriendprofilepage);

app.get('/profileinfo/:email', routes.get_profileinfo);
app.get('/friendprofileinfo/:email', routes.get_friendprofileinfo);
app.get('/getname', routes.get_name);

app.post('/updatename', routes.post_updatename);
app.post('/updateaffiliation', routes.post_updateaff);
app.post('/updatebirthday', routes.post_updatebday);
app.post('/updateinterests', routes.post_updateinterests);
app.post('/addinterest', routes.post_addinterest);
app.post('/delinterest', routes.post_delinterest);
app.post('/updateactivestatus', routes.post_activestatus);

app.post('/getownpublicmsgs', routes.get_ownpubmessages);
app.post('/getpublicmsgs/:email', routes.get_pubmessages);
app.post('/sendpublicmsg/:email', routes. post_pubmessage);

// FRIENDS
app.get('/getallusers', routes.get_allusers);  // used to distinguish non-friends
app.get('/getownfriends', routes.get_ownfriends);
app.get('/getfriends/:id', routes.get_friends);
app.post('/addfriend', routes.post_addfriend);
app.post('/deletefriend', routes.post_deletefriend);

//HOME
app.get('/home', routes.get_home);
app.get('/homeposts', routes.get_homefeed);	//for initial load
app.post('/homerefresh', routes.post_refresh);	//post val = last updated time
app.post('/homecomments', routes.post_getcomments); //post val = postID
app.get('/getactivefriends', routes.get_activefriends);
app.post('/updatestatus', routes.post_status);
app.post('/addcomment', routes.post_comment); 	

app.get('/getsuggestions/:term', routes.get_suggestions);

//GROUPS
app.get('/getgroups', routes.get_getGroups);
app.get('/getgroupinfo:id', routes.get_groupInfo);
app.get('/getgroupname:id', routes.get_groupName);
app.get('/getchatusers:id', routes.get_chatUsers);
app.post('/creategroup', routes.post_createGroup);
app.post('/deletechat', routes.post_deleteChat);
app.post('/renamegroup', routes.post_renameGroup);
app.post('/leavegroup', routes.post_leaveGroup);

//CHAT
app.get('/chat', routes.get_chatHome);
app.get('/getcurrroom', routes.get_currRoom);
app.get('/activechat:id', routes.get_activeChat);
app.post('/uploadchat', routes.post_chatMessage);
app.get('/downloadchats', routes.get_pastChats);
app.post('/sendinvites', routes.post_sendInvites);
app.post('/getinvites', routes.post_getInvites);

//VISUALIZER
app.get('/friendvisualization', routes.get_visualizerpage);
app.get('/getvisualizedfriends', routes.get_visualizedFriends);
app.get('/getvisualizedaffiliates/:friendid', routes.get_visualizedAffiliates);
		
app.get('/logout', routes.get_logout);


/* Run the server */

console.log('Author: G12');
app.listen(8080);
//app.listen(80);
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
