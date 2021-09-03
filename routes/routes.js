var db = require('../models/database.js');
var SHA256 = require("crypto-js/sha256");

var getCurrUser = function(req, res) {
	var email = req.session.email;
	console.log(email);
	db.getCurrUser(email, function(data, err) {
		if (err) {
			console.log(err);
		} else {
			res.send(JSON.stringify(data));
		}
	})
}

//------------------------------- LOGIN -----------------------------//
var getLogin = function(req, res) {
	res.render('login.ejs', {message:null});
};
	
// req.body.email and req.body.password will be passed in from signup.ejs
var postCheckLogin = function(req, res) {
	var email = req.body.emailInput;
	var password = req.body.passwordInput;
	password = SHA256(password).toString();
	
	db.getUser(email, function(data, err) {
		if (err) {
			res.render('login.ejs', {message: err});
		// inputs not all filled in 
		} else if (email == "" || password == "") {
			res.render('login.ejs', {message: "Please fill out all input fields"});
		// found user
		} else if (data) {
			// passwords match, save session and redirect
			if (data.password == password) {
				req.session.email = email;
				db.getName(email, function(name,err){
					if (name!=null) {
						req.session.fullname = name;
					}
					res.redirect('/home');
				});
			// passwords do not match
			} else {
				res.render('login.ejs', {message: "Incorrect password for this user"});
			}
		// user does not exist
		} else {
			res.render('login.ejs', {message: "The user you entered does not exist. Please create an account!"});
		}
	});
}

var postActiveStatus = function(req, res) {
	var user = req.body.email;
	var newstatus = req.body.status;
	db.updateActiveStatus(user, newstatus, function(data, err) {
		if (err) {
			res.send(err);
		} else {
			console.log("updated " + user + "'s active status");
			res.send(data);
		}
	});
}


//------------------------------- SIGNUP -----------------------------//
var getSignup = function(req, res) {
	res.render('signup.ejs', {message: null});
};

var postCreateAccount = function(req, res) {
	var email = req.body.emailInput;
	var password = req.body.passwordInput;
	var fullname = req.body.fullnameInput;
	
	db.getUser(email, function(data, err) {
		if (err) {
			res.render('signup.ejs', {message: err});
		// inputs not all filled in
		} else if (email == "" || password == "" || fullname == "") {
			res.render('signup.ejs', {message: "Please fill out all input fields"});
		// user already exists
		} else if (data) {
			res.render('signup.ejs', {message: "User already exists"});
		// user does not exist
		} else {
			var hashedPassword = SHA256(password).toString();
			
			db.addUser(email, hashedPassword, fullname, function(data, err) {
				if (err) {
					console.log("error creating account");
					console.log(err);
				} else {
					req.session.email = email;
					req.session.fullname = fullname;
					console.log(data);
					res.redirect('/');
				}
			});
		}
	});
};

//------------------------------- PROFILE -----------------------------//
var getProfilePage = function(req, res) {
	if (req.session.email == null) {
		res.redirect('/');
	}
	res.render('profile.ejs', {message: null});
};

var getFriendProfilePage = function(req, res) {
	console.log("getting friend profile page");
	var targetFriend = req.params.email.substring(1);
	if (targetFriend == null) {
		res.redirect('/');
	}
	res.render('friendprofile.ejs', {message: null, targetFriend: targetFriend});
}

var getNonFriendProfilePage = function(req, res) {
	console.log("getting nonfriend's profile page");
	var targetUser = req.params.email.substring(1);
	if (targetUser == null) {
		res.redirect('/');
	}
	res.render('nonfriendprofile.ejs', {message: null, targetUser: targetUser});
}

//GET A USER'S PROFILE INFO 
var getProfile = function(req, res) {
	var profileSelected = req.session.email; // might be someone else's profile
	db.getProfile(profileSelected, function(p,err) {
		if (p!=null) {
//			console.log(p);
			res.send(JSON.stringify(p));	//send name, in ejs have to JSON.parse.
		} else {
			res.send(err);	//send err
		}
	});
}

var getFriendProfile = function(req, res) {
	var targetFriend = req.params.email.substring(1);
	db.getProfile(targetFriend, function(profile, err) {
		if (profile != null) {
			res.send(JSON.stringify(profile));
		} else {
			res.send(err);
		}
	});
}
	
//GET USER FULL NAME
var getName = function(req, res) {
	var user = req.session.email; //assuming session cookie has been set to user email
	db.getName(user, function(name,err){
		if (name!=null) {
			res.send(JSON.stringify(name));	//send name, in ejs have to JSON.parse. if not, send JSON.parse
		} else {
			res.send(err);	//send err
		}
	});
}

//.....profile attribute update routes......//

var postName = function(req, res) {
	var user = req.session.email;
	var newName = req.body.name;

	console.log(user);
	console.log("newName is " + newName);
	
	db.updateName(user, newName, function(data, err) {	//update Users.name
		if (!newName) {
			res.send(JSON.stringify('empty'));
		} else if (data!=null) {
			var post = newName + ' updated name!';	//create post value 
			
			console.log('Creating update name posts');
			db.postNewPost (user, post, function(data,err){	//add Post entries
				if (data!=null) {
					console.log('Added to Posts');
					console.log(post);
					res.send(post);	 
				} else {
					res.send(err); 
				}
			});
			//res.send('success');
		} else if (err) {
			res.send(err);
		}
	});
};

var postAffiliation = function(req, res) {
	var user = req.session.email;
	var newA = req.body.affiliation;
	db.updateAffiliation(user, newA, function(data, err) {
		if (data!=null) {
			db.getName(user, function(name, err) {	//get user full name
				var fullname = name;
				var post = fullname + ' updated affiliation to ' + newA; //create post value
				
				console.log('Creating update affiliation posts');
				db.postNewPost (user, post, function(data,err){	//add Post entries
					if (data!=null) {
						console.log(post);
						res.send(post);	 
					} else {
						res.send(err); 
					}
				});
			});
		} else  {
			res.send(err);
		}
	});
}

var postBday = function(req, res) {
	var user = req.session.email;
	var newBday = req.body.birthday;
	db.updateBday(user, newBday, function(data, err) {
		if (data!=null) {
			db.getName(user, function(name, err) {	//get user full name
				var fullname = name;
				var post = fullname + ' updated birthday to ' + newBday; //create post value
				
				console.log('Creating update bday posts');
				db.postNewPost (user, post, function(data,err){	//add Post entries
					if (data!=null) {
						console.log(post);
						res.send(post);	 
					} else {
						res.send(err); 
					}
				});
			});
		} else  {
			res.send(err);
		}
	});
}

//db.updateBday('lydiama8@gmail.com', '6/14/2000');

var postInterests = function(req, res) {
	var user = req.session.email;
	var newinterests = req.body.interests;
	db.updateInterests(user, newinterests, function(data, err) {
		if (data!=null) {
			db.getName(user, function(name, err) {	//get user full name
				var fullname = name;
				var post = fullname + ' updated interests to ' + newinterests; //create post value
				
				console.log('Creating update interests posts');
				db.postNewPost (user, post, function(data,err){	//add Post entries
					if (data!=null) {
						console.log(post);
						res.send(post);	 
					} else {
						res.send(err); 
					}
				});
			});
		} else  {
			res.send(err);
		}
	});
}

var postAddInterest = function(req, res) {
	var user = req.session.email;
	var newI = req.body.interest;
	db.addInterest(user, newI, function(data, err) {
		if (data!=null) {
			db.getName(user, function(name, err) {	//get user full name
				var fullname = name;
				var post = fullname + ' added ' + newI + ' as an interest'; //create post value
				
				console.log('Creating update interest posts');
				db.postNewPost (user, post, function(data,err){	//add Post entries
					if (data!=null) {
						console.log(post);
						res.send(post);	 
					} else {
						res.send(err); 
					}
				});
			});
		} else  {
			res.send(err);
		}
	});
}

var postDelInterest = function(req, res) {
	var user = req.session.email;
	var del = req.body.interest;
	db.delInterest(user, del, function(data, err) {
		if (data!=null) {
			db.getName(user, function(name, err) {	//get user full name
				var fullname = name;
				var post = fullname + ' is no longer interested in ' + del; //create post value
				
				console.log('Creating update interest posts');
				db.postNewPost (user, post, function(data,err){	//add Post entries
					if (data!=null) {
						console.log(post);
						res.send(post);	 
					} else {
						res.send(err); 
					}
				});
			});
		} else  {
			res.send(err);
		}
	});
}

var getOwnPubMsgs = function(req,res) {
	var email = req.session.email;	
	var time = req.body.time;	//initial load set to 0, refresh set to last saved time val 
	
	console.log("email: " + email);
	console.log("time: " + time);
	
	db.getPubMsgs (email, time, function(data,err) {
		if (err) {
			res.send(err);
		} else {
			res.send(JSON.stringify(data));	//[] if no comments 
		}
	});
}


//DISPLAY PUB MSGS ON USER PROFILE 
//will return [] if none exist
//for initial load of profile and for displaying friend profiles, set time = 0 in req.body
//returns oldest --> newest 
var getPubMsgs = function(req,res) {
	var email = req.params.email.substring(1);	
	var time = req.body.time;	//initial load set to 0, refresh set to last saved time val 
	
	console.log("email: " + email);
	console.log("time: " + time);
	
	db.getPubMsgs (email, time, function(data,err) {
		if (err) {
			res.send(err);
		} else {
			res.send(JSON.stringify(data));	//[] if no comments 
		}
	});
}

var sendPubMsg = function(req,res) {
	var email = req.session.email;	//creator (logged in user)
	var fullname = req.session.fullname;	//creator name
	var friend = req.params.email.substring(1);	//receiver
	var content = req.body.message;
	
	var message = fullname + " says: " + content;
	db.sendPubMsg(email, friend, fullname, message, function(data,err) {
		if (err) {
			res.send(err);
		} else {
			res.send(message);
		}
	});
} 

//GET OWN LIST OF FRIENDS
var getOwnFriendList = function(req, res) {
	var user = req.session.email;
	db.getFriends(user, function(friends,err){
		if (friends!=null) {
			res.send(JSON.stringify(friends));	//send name, in ejs have to JSON.parse.
		} else {
			res.send(err);	//send err
		}
	});
}

//GET FRIEND's LIST OF FRIENDS
var getFriendList = function(req, res) {
	var user = req.params.id.substring(1); 
	db.getFriends(user, function(friends,err){
		if (friends!=null) {
			res.send(JSON.stringify(friends));	//send name, in ejs have to JSON.parse.
		} else {
			res.send(err);	//send err
		}
	});
}

var getAllUsers = function(req, res) {
	var user = req.session.email;
	
}

//ADD FRIEND (update Relations and Posts)
var addFriend = function(req,res) {
	var user = req.session.email; //adder
	var friend = req.body.friend;
	
	db.addFriend(user,friend,function(data,err){
		if (err) {
			res.send(err);
		} else if (data == 'Already friends'){
			res.send(data);
		} else {	//data.results == 'success'
			console.log('Added to Relations. Adding friendship post to Posts');
			db.getName(user, function(n, err) {	//get user full name
				var userFullName = n;
				db.getName(friend, function(n2, err) {	//get friend full name
					var friendFullName = n2;
					var post = userFullName + ' added ' + friendFullName + ' as a friend <3'; //create post val
					db.postNewPost (user, post, function(data,err){
						if (data!=null) {
							console.log('Added to Posts');
							console.log(post);
							res.send(post);	 
						} else {
							res.send(err); 
						}
					});
				});
			});
		}
	});
} 

//DELETE FRIEND (update Relations, no need to make Post)
var deleteFriend = function(req,res) {
	var user = req.session.email; 
	var friend = req.body.friend;
	db.deleteFriend(user,friend,function(data,err){
		if (err) {
			res.send(err);
		} else {
			res.send('Success');
		}
	});
}


//------------------------------- HOMEPAGE -----------------------------//
var getHome = function(req, res) {
	if (req.session.email == null) {
		res.redirect('/');
	}
	res.render('home.ejs', {message: null});	 
};

var getHomeFeed = function(req, res) {
	if (req.session.email == null) {
		res.redirect('/');
	}
	var user = req.session.email;
	db.getAllPosts(user, function(posts,err) {
		if (posts!=null) {
			res.send(JSON.stringify(posts));	//in ejs have to JSON.parse.
		} else {
			res.send(err);	//send err
		}
	});
}

//@ JY, time param = last saved time of settimer call (not the current) and then after calling the POST, save the current time to the timestamp variable
//@ JY, func will return ALL posts since 'time', inc those made by the user. assuming we will instantly display 
//posts the user makes instantly, ignore the posts in which creator = email (no duplicate posts)

var postRefreshPosts = function(req,res) {
	if (req.session.email == null) {
		res.redirect('/');
	}
	var user = req.session.email;
	var time = req.body.time;	//@JY, send in POST body as 'time'
	//will return all Posts after 'time'
	db.getRefresh(user, time, function(posts,err) {
		if (posts!=null) {
			res.send(JSON.stringify(posts));	//[] if no new posts
		} else {
			res.send(err); 
		}
	});
}

//call once for each post returned in getHomeFeed/postRefreshPosts []
//will return [] if no comments exist for postid
//returns oldest --> newest 
var postGetComments = function(req,res) {
	var postid = req.body.postid;
	var time = req.body.time;	//initial load set to 0, refresh set to last saved time val 
	db.getComments(postid, time, function(comments,err) {
		if (err) {
			res.send(err);
		} else {
			res.send(JSON.stringify(comments));	//[] if no comments 
		}
	});
}

//returns list of [name + email objects] of active users
var getActiveFriends = function(req,res) {
	if (req.session.email == null) {
		res.redirect('/');
	}
	var user = req.session.email;
	db.getActiveFriends (user, function(friends,err) {
		if (err) {
			res.send(err); 
		} else if (friends!=null){
			console.log(friends);
			res.send(JSON.stringify(friends));	 
		} else {
			res.send('None');	// 'none' if no friends online 
		}
	});
}

var postStatus = function(req,res) {
	var email = req.session.email;
	var status = req.body.status;
	var fullname = req.session.fullname; 
	
	var post = fullname + ' updated status: ' + status; //create post value
	db.postNewPost (email, post, function(data,err){
		if (data!=null) {
			res.send(post);	 
		} else {
			res.send(err); 
		}
	});
}

var postComment = function(req,res) {
	var creator = req.session.email;
	var fullname = req.session.fullname; 
	var postid = req.body.postID;	 
	var content = req.body.comment; 	 
	
	var comment = fullname + ' commented: ' + content;
	console.log(comment);	 
	db.addComment(postid, comment, creator, function(data, err) {
		if (data != null) {
			res.send(comment);
		} else {	 
			console.log('sending error message');
			console.log(err);
			res.send(err); 
		}
	}); 
}

//SEARCH BAR SUGGESTIONS: returns [{email: __, name: ____}]
var getSuggestions = function(req,res) {
	var term = req.params.term.substring(1);
	
	db.getSuggestions(term, function(data,err) {
 		if (err) {
 			res.send(err);
 		} else {
 			res.send(JSON.stringify(data));
 		}
 	});
}

//------------------------------- GROUPS -----------------------------//

//GET A USER'S GROUPS
var getGroups = function(req,res) {
	var user = req.session.email;  
	db.getGroups(user, function(groups,err){
		if (groups!=null) {
			res.send(JSON.stringify(groups));	//send name, in ejs have to JSON.parse.
		} else {
			res.send(err);	//send err
		}
	});
}

//GET GROUP INFO
var getGroupInfo = function(req, res) {
	var groupId = req.params.id.substring(1);  
	db.getGroupInfo(groupId, function(info,err){
		if (info!=null) {
			res.send(JSON.stringify(info));	//send all group data
		} else {
			res.send(err);	//send err
		}
	});
}

//GET A GROUP'S NAME
var getGroupName = function(req, res) {
	var groupId = req.params.id.substring(1);  
	db.getGroupName(groupId, function(name,err){
		if (name!=null) {
			var info = {
				groupID: groupId,
				groupName: name
			}
			res.send(JSON.stringify(info));	//groupID back to be paired with name
		} else {
			res.send(err);	//send err
		}
	});
}

//GET ALL USERS IN A CHAT GROUP
var getChatUsers = function(req, res) {
	var groupId = req.params.id.substring(1);  
	db.getChatUsers(groupId, function(users,err){
		if (users!=null) {
			var info = {
				groupID: groupId,
				chatUsers: users
			}
			res.send(JSON.stringify(info));	//groupID back to be paired with users
		} else {
			res.send(err);	//send err
		}
	});
}

//CREATE GROUP
var createGroup = function(req,res) {
	var user = req.session.email; //adder
	var friend = req.body.friend;
	var list = [user, friend];
	
	db.createGroup(list, function(data,err) {
		if (err) {
			res.send(err);
		} else if (data == 'Already have a group'){
			res.send(data);
		} else {	//data.results == 'success'
			console.log('Created private chat group');
			res.send(data);	
		}
	});
}

//DELETE GROUP
var deleteChat = function(req,res) {
	var user = req.session.email; 
	var friend = req.body.friend;
	var list = [];
	db.getCommonGroups(user,friend,function(data,err) {
		if (err) {
			res.send(err);
		} else {
			list = data
			db.deleteChat(list,function(info,error) {
				if (err) {
					res.send(err);
				} else {
					res.send('Success');
				}
			});
		}
	});
}

var renameGroup = function(req,res) {
	var groupId = req.body.groupId;  
	var newName = req.body.newName;
	db.renameGroup(groupId, newName, function(data,err){
		if (err) {
			console.log("Error: " + err);
		}
		res.render('chat.ejs', {message: null});
	});
}

var leaveGroup = function(req,res) {
	var groupId = req.body.groupId;  
	var user = req.session.email;
	db.leaveGroup(user, groupId, function(data,err){
		if (err) {
			console.log("Error: " + err);
		}
		res.render('chat.ejs', {message: null});
	});
}

//------------------------------- CHATS -----------------------------//

var getChats = function(req, res) {
	if (req.session.email == null) {
		res.redirect('/');
	}
	res.render('chat.ejs', {message: null});
}

var getCurrRoom = function(req, res) {
	console.log(req.session.room);
	if(req.session.room != null) {
		res.send(req.session.room);
	}
	else {
		res.send("");
	}
}

var loadChat = function(req, res) {
	var groupID = req.params.id.substring(1);
	console.log("loading chat of ID: " + groupID);
	req.session.room = groupID;
	
	if(req.app.io.sockets._events == undefined) {
		req.app.io.of('/'+groupID).removeAllListeners('connection');
		req.app.io.of('/'+groupID).on('connection', function(socket) {
			socket.on('chat message', function(msg) {
				req.app.io.of('/'+groupID).emit('chat message', msg);
			});
		});
	}
	res.render('activechat.ejs', {message: null});
}

var uploadChat = function(req, res) {
	var groupID = req.body.groupID;
	var user = req.body.user;
	var msg = req.body.content;
	db.uploadChat(groupID, user, msg, function(data, err) {
		if (err) {
			console.log("Could not upload chat: "+err);
			res.send("Error: "+err);	
		} else {
			res.send(data);	
		}
	});
}

var downloadChats = function(req, res) {
	var groupID = req.session.room;
	db.downloadChats(groupID, function(chats,err) {
		if (chats!=null) {
			res.send(JSON.stringify(chats));	//in ejs have to JSON.parse.
		} else {
			console.log("Error downloading chats "+err);
			res.send(null);	//send null to signify no chats
		}
	});
}

var sendInvites = function(req, res) {
	var groupID = req.session.room;
	var user = req.session.email;
	db.sendInvites(groupID, user, function(data,err) {
		if (err) {
			res.send(err);
		}
		else {
			res.send(data);
		}
	});
}

var getInvites = function(req,res) {
	if (req.session.email == null) {
		res.redirect('/');
	}
	var user = req.session.email;
	var time = req.body.time;	 
 	db.getNotifs(user, time, function(n,err) {
		if (n!=null) {
			res.send(JSON.stringify(n));	//[] if no new posts
		} else {
			res.send(err); 
		}
	});
}

//------------------------------- VISUALIZER  -----------------------------//
var visualizerPage = function(req,res) {
	if (req.session.email == null) {
		res.redirect('/');
	}
	res.render('friendvisualizer.ejs');
};

var visualizeFriends = function(req,res) {
	var email = req.session.email;
	var fullname = req.session.fullname;
	console.log(email + ' name ' + fullname)
	console.log('GETTING VISUALIZED FRIENDS');
	db.getVisualizedFriends(email,fullname,function(json, err) {
		if (err) {
			console.log(err);
			res.send("Error: "+err);
		} else if (json!=null){
			console.log('Sending visualizer friend JSON obj');
			res.send(JSON.stringify(json));
		} else {
			console.log('null');
			res.send(null);	//no friends
		}
	});
}

var getAffiliates = function(req,res) {
	var friendID = req.params.friendid.substring(1);
	var email = req.session.email;
	var fullname = req.session.fullname;
	
	db.getAffiliates(email, fullname, friendID, function(json,err) {
		if (err) {
			console.log(err);
			res.send("Error: "+err);
		} else if (json!=null){
			console.log('Sending visualizer friend affiliate obj');
			res.send(JSON.stringify(json));
		} else {
			console.log('null');
			res.send(null);	//friend has no friends or user has not updated aff
		}
	});
}

var getLogout = function(req, res) {
	req.session.destroy();
	res.redirect('login.ejs', {message: null});
}
	
var routes = { 
	get_curr_user: getCurrUser,
		
	get_login: getLogin,
	post_check_login: postCheckLogin,
	
	get_signup: getSignup,
	post_create_account: postCreateAccount,
	
	get_profilepage: getProfilePage,
	get_friendprofilepage: getFriendProfilePage,
	get_nonfriendprofilepage: getNonFriendProfilePage,
	get_profileinfo: getProfile,
	get_friendprofileinfo: getFriendProfile,
	get_name: getName,
	
	post_updatename: postName,
	post_updateaff: postAffiliation,
	post_updatebday: postBday,
	post_updateinterests: postInterests,
	post_addinterest: postAddInterest,
	post_delinterest: postDelInterest,
	post_activestatus: postActiveStatus,
	
	get_ownpubmessages: getOwnPubMsgs,
	get_pubmessages: getPubMsgs,
	post_pubmessage: sendPubMsg,
	
	get_allusers: getAllUsers,
	get_ownfriends: getOwnFriendList,
	get_friends: getFriendList,
	post_addfriend: addFriend,
	post_deletefriend: deleteFriend,
	
	get_home: getHome,
	get_homefeed: getHomeFeed,
	post_refresh: postRefreshPosts,
	get_activefriends: getActiveFriends,
	post_getcomments: postGetComments,
	post_status: postStatus,
	post_comment: postComment,
	get_suggestions: getSuggestions,
	
	get_getGroups: getGroups,
	get_groupInfo: getGroupInfo,
	get_groupName: getGroupName,
	get_chatUsers: getChatUsers,
	post_createGroup: createGroup,
	post_deleteChat: deleteChat,
	post_renameGroup: renameGroup,
	post_leaveGroup: leaveGroup,
	
	get_chatHome: getChats,
	get_currRoom: getCurrRoom,
	get_activeChat: loadChat,
	post_chatMessage: uploadChat,
	get_pastChats: downloadChats,
	post_sendInvites: sendInvites,
	post_getInvites: getInvites,
	
	get_visualizerpage: visualizerPage,
	get_visualizedFriends: visualizeFriends,
	get_visualizedAffiliates: getAffiliates,
	
	get_logout: getLogout
};

module.exports = routes;
