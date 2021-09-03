'use strict';

var vogels = require('vogels'),
	util   = require('util'),
	_      = require('lodash'),
	async  = require('async'),
	Joi    = require('joi'),
	AWS    = vogels.AWS;
//vogels.AWS.config.loadFromPath('config.json');

//REDEFINE TABLE MODELS TO ACCESS AWS ONES

//Define Users Table
var Users = vogels.define('Users', {
	hashKey: 'email',
	timestamps: true,
	schema : {
		email : Joi.string().email(),
		name: Joi.string(),
		affiliation: Joi.string(),
		interests: vogels.types.stringSet(),
		birthday: Joi.date(),	 
		password: Joi.string(),
		numPosts: Joi.number(),	
		loginstatus: Joi.boolean().default(false),
		groups: vogels.types.stringSet()
	},
	tableName: 'Users'
});

//Define Pub Msgs Table
var PubMsgs = vogels.define('PubMsgs', {
	hashKey: 'email',	//friend who received public message
	rangeKey: 'createdAt',		//sort key
	timestamps: true,
	schema : {
		email : Joi.string().email(),
		poster: Joi.string().email(),
		posterName: Joi.string(),
		message: Joi.string()	
	},
	tableName: 'PubMsgs'
});

//Define Relations Table
var Relations = vogels.define('Relations', {
	hashKey: 'email',
	timestamps: true,
	schema : {
		email : Joi.string().email(),
		friends: vogels.types.stringSet()
	},
	tableName: 'Relations'
});

//Define Posts Table
var Posts = vogels.define('Posts', {
	hashKey: 'email',	
	rangeKey: 'createdAt',		
	timestamps: true,
	schema : {
		email : Joi.string().email(),
		postCreator: Joi.string().email(),
		postID: Joi.string(),	
		post: Joi.string()	 
		//*have an extra attribute for comments? maybe an array? 
	},
	tableName: 'Posts',
	indexes : [{
	    hashKey : 'postID', name : 'PostIDIndex', type : 'global'	
	  }]
});

//Define Comments Table
var Comments = vogels.define('Comments', {
	hashKey: 'postID',	 
	rangeKey: 'createdAt',		 
	timestamps: true,
	schema : {
		postID: Joi.string(),	 
		comment: Joi.string(),
		creator: Joi.string().email()
	},
	tableName: 'Comments'
});

//Define Groups Table
var Groups = vogels.define('Groups', {
	hashKey: 'groupID',	//map comment to specific post 
	timestamps: true,
	schema : {
		groupID: Joi.string(), 
		groupName: Joi.string(),
		isGroupChat: Joi.boolean(),
		chatUsers: vogels.types.stringSet()	 
	},
	tableName: 'Groups',
	indexes : [{
	    hashKey : 'groupName', name : 'GroupNameIndex', type : 'global'	//if users change their name
	  }]
});


//Define Chats Table
var Chats = vogels.define('Chats', {
	hashKey: 'groupID',	//map chat to specific group
	rangeKey: 'createdAt',		//sort key
	timestamps: true,
	schema : {
		groupID: Joi.string(), //will need to extract the group UUID from Groups
		user: Joi.string(),	//email of user who sent chat
		message: Joi.string() 
	},
	tableName: 'Chats'
});

//Define Chat Invites Table
var Invites = vogels.define('Invites', {
	hashKey: 'recipient',	//map invite to the recipient
	rangeKey: 'createdAt',		//sort key
	timestamps: true,
	schema : {
		recipient: Joi.string().email(), //email of user receiving invite
		sender: Joi.string().email(),	//email of user who sent invite
		groupID: Joi.string() 
	},
	tableName: 'Invites'
});

	var createTables = function () {
		vogels.createTables(function(err) {
			console.log('Creating tables');
			  if (err) {
			    console.log('Error creating tables: ', err);
			  } else {
			    console.log("Waiting 10s for the table to become active...");
			    setTimeout(function() {
			    	console.log('Done: can access 4 tables'); }, 10000);
			  }	
		});
	};
	
	function test () {createTables (); }
	//test();

//------------------------------- ACTUAL DB FUNCTIONS -----------------------------//
	
	var myDB_getCurrUser = function(email, callback) {
		console.log('Getting current user');
		Users.get(email, function(err, n) {
			if (err) {
				callback(null, 'Lookup error: ' + err);
			} else {
				console.log('Email obtained: ' + n.get('email'));
				callback(n.get('email'), null);
			}
		});
	}
	
	//RETURN USER NAME
	var myDB_getName = function(email, callback) {
		console.log('Getting user name');
		Users.get(email, function (err,n) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log('Name obtained: ', n.get('name'));	 
				callback(n.get('name'), null);  
			}
		});
	}
	//myDB_getName('lydiama8@gmail.com', function(n,err){}); 

//------------------------------- RELATIONS TABLE -----------------------------//
	
	//RETURN USER FRIENDS [STRING LIST] 
	var myDB_getFriends = function(email, callback) {
		console.log('Getting user friends');
		Relations.get(email, function (err,n) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log('Friend list: ', n.get('friends'));	
				callback (n.get('friends'), null);
			}
		});
	} 
	
	//Add friend to user's friend list, user to friend's friend list
	var myDB_addFriend = function(email, friend, callback) {
		console.log('DB: Adding friend: ' + friend + ' to ' + email);	  
 		
		Relations.get(email, function (err,n) {		//check if already friends
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				var friends = n.get('friends');
				console.log('Got existing friends');	
				if (friends != undefined && friends.includes(friend)) {
					console.log('DB: Already friends');	
					callback('Already friends', null);
				} else {
					Relations.update({
						  email : email,
						  friends  : {$add : friend}
						}, function (err, f) {
						  console.log('DB: Added', f.get('friends'));
						  console.log('DB: Adding friend: ' + email + ' to ' + friend);
						  Relations.update({
							  email : friend,
							  friends  : {$add : email}
							}, function (err, f2) {
							  console.log('DB: Added', f2.get('friends'));
							  callback('Success', null);
							});
						});
				}
				
 			}
		});
	} 
	
//myDB_addFriend('jenyen@seas.upenn.edu', 'test2@gmail.com', function(n,err){});


	var myDB_deleteFriend = function(email, friend, callback) {
		Relations.update({
			email : email,
			friends  : {$del : friend}
		}, function (err, f) {
			console.log('DB: Deleted ' + friend + ' from ' + email + ' list');
			console.log('DB: Deleting ' + email + ' from ' + friend + ' list');
			Relations.update({
				email : friend,
				friends  : {$del : email}
			}, function (err, f2) {
				console.log('DB: Unfriended success');
				callback('Success', null);
				});
		}); 
	}
	
//myDB_deleteFriend('jenyen@seas.upenn.edu', 'testadduser2@gmail.com', function(n,err){});
	
//------------------------------- PROFILES/USER TABLE -----------------------------//

	//RETURN USER PROFILE INFO [JSON OBJ] 
	var myDB_getProfile = function(profileEmail, callback) {
		console.log('Getting user profile info');
		Users.get(profileEmail, {AttributesToGet : ['email', 'affiliation', 'birthday', 'interests', 'name' ]}, function (err,n) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {	
				var userObj = {
					email: n.get('email'),
					affiliation: n.get('affiliation'),
					name: n.get('name'),
					interests: n.get('interests'),
					birthday: n.get('birthday')
				};
				console.log('Profile info: ', userObj);
				callback(userObj, null);   
			}
		});
	}
	
	// for simplicity, not going to implement updating email right now bc we're using that as our username
	var myDB_updateProfile = function(email, name, affiliation, interests, birthday) {
		console.log('Updating user profile');
		
		var interestElems = interests.toString().split(',');
		for (var i = 0; i < interestElems.length; i++) {
			interestElems[i] = interestElems[i].trim().replace(/\ss+/g, ' ').toString();
		}

		var updatedFields = {
			name: name,
			affiliation: affiliation,
			interests: interestElems,
			birthday: birthday
		};
		Users.update(updatedFields, {overwite: false}, function(err, profile) {
			console.log("Updated profile: ", profile.get('email'));
		});
	}
	
	var myDB_updateName = function(email, newN, callback) {
		Users.update({email: email, name: newN}, function(err, a) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log("Updated name ", a.get('name'));
				callback ("Success", null);
			}
		});
	};
	
	var myDB_updateAff = function(email, newA, callback) {
		Users.update({email: email, affiliation: newA}, function(err, a) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log("Updated affiliation", a.get('affiliation'));
				callback ("Success", null);
			}
		});
	};
	
	var myDB_updateBday = function(email, newBday, callback) {
		Users.update({email: email, birthday: newBday}, function(err, a) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log("Updated bday", a.get('birthday'));
				callback ("Success", null);
			}
		});
	}
	
	var myDB_updateInterests = function(email, newinterests, callback) {
		Users.update({email: email, interests: newinterests}, function(err, a) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log("Updated interests", a.get('interests'));
				callback ("Success", null);
			}
		});
	}

	var myDB_addInterest = function(email, newI) {
		Users.update({email: email, interests: {$add : newI}}, function(err, a) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log("Updated interests", a.get('interests'));
				callback ("Success", null);
			}
		});
	}
	
	var myDB_delInterest = function(email, del) {
		Users.update({email: email, interests: {$del : del}}, function(err, a) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log("Updated interests", a.get('interests'));
				callback ("Success", null);
			}
		});
	}
	
	var myDB_updateActiveStatus = function(email, newstatus, callback) {
		Users.update({email: email, loginstatus: newstatus}, function(err, a) {
			if (err) {
				callback(null, 'Lookup error: ' + err);
			} else {
				console.log("Updated login status ", a.get('loginstatus'));
				callback("Success", null);
			}
		});
	}
	
	var myDB_getPubMsgs = function(email,time,callback) { //if this is someone else's prof, set time = 0
		console.log('Getting user public messages'); 
		
		if (time == 0) {	//initial load for user logged in, display for friends 
		PubMsgs
			.query(email)
			.loadAll()
			.exec(function (err, resp) {
				    if(err) {
				      console.log(' - Error running query', err);
				      callback(null, err);	//12/6 fix
				    } else {
				      var data = _.pluck(resp.Items, 'attrs');
				      console.log(data);
				      callback(data,null);	//12/6 fix
				      
				      if(resp.ConsumedCapacity) {
				        console.log('----------------------------------------------------------------------');
				        console.log('Query consumed: ', resp.ConsumedCapacity);
				      }
				    }
			});
		}
		else {	//user logged in: /refresh for display on their prof 
			PubMsgs
			.query(email)
			.where('createdAt').gt(time)
			.loadAll()
			.exec(function (err, resp) {
			    if(err) {
			      console.log(' - Error running query', err);
			      callback(null, err); 
			    } else {
			      var data = _.pluck(resp.Items, 'attrs');
			      console.log(data);
			      callback(data,null);	 
			      
			      if(resp.ConsumedCapacity) {
			        console.log('----------------------------------------------------------------------');
			        console.log('Query consumed: ', resp.ConsumedCapacity);
			      }
			    }
		});
		}
	} 
	
	var myDB_sendPubMsg = function (userEmail, friend, userName, message, callback) {
		var newmsg = {
			email : friend,	//param friend email
			poster : userEmail,
			posterName: userName,
			message: message
		};
		PubMsgs.create(newmsg, function(err,a) {
			if (err) {
				callback(null, 'Error'+err);
			} else {
				console.log('Created public message', a.get('message'));
				callback('Success', null);
			}
		});
	}
 
//------------------------------- SIGNUP/LOGIN -----------------------------//

	//RETURN USER EMAIL, PW, FULL NAME
	var myDB_getUser = function(email, callback) {
		console.log('Getting user');
		Users.get(email, function(err, user) {
			if (user) {
				var curr = {
					email: user.get('email'),
					password: user.get('password'),
					fullname: user.get('name')
				}
				callback(curr, err);
			} else {
				callback(null, null);
			}
		});
	};

var myDB_addUser = function(email, password, fullname, routes_callback) {
		// as discussed, put in empty values for other fields
		var userObj = {
			email: email,
			password: password,
			name: fullname,
			affiliation: "Please update affiliation",
			interests: [],
			birthday: 0,
			numPosts: 0,
			loginstatus: false,
			groups: [],
		};
		
		Users.create(userObj, {overwrite: false}, function(err, data) {
			if (err) {
				routes_callback(null, "Lookup error: " + err);
			} else {
				console.log("added " + email);
				Relations.create({
					email : email,
					friends: []
				}, function (err, f2) {
					console.log('Added empty entry to Relations table', f2.get('friends'));
					routes_callback(userObj, err);
				});
			}
		});
	};
	
//myDB_addUser('test@gmail.com', 'test', 'A', function(n,err){});
//myDB_addUser('test2@gmail.com', 'test', 'Ab', function(n,err){});


	//------------------------------- HOME FEED/POSTS AND COMMENTS TABLE -----------------------------//

//RETURN ALL POSTS IN A LIST (oldest to most recent)
	var myDB_getAllPosts = function(email, callback) {
		console.log('Getting posts');
		var posts;
		Posts.query(email)
			.loadAll()
			.exec(function (err, resp) {
				    if(err) {
				      console.log(' - Error running query', err);
				      callback(null, err);	 
				    } else {
				      posts = _.pluck(resp.Items, 'attrs'); 
 				      callback(posts,null);	 
				      
				      if(resp.ConsumedCapacity) {
				        console.log('----------------------------------------------------------------------');
				        console.log('Query consumed: ', resp.ConsumedCapacity);
				      }
				    }
			})
	}; 
//	myDB_getAllPosts('lydiama@gmail.com',function(n,err){});
	
//RETURN UPDATED POST DATA (UPON REFRESH)
	//time param = last saved time of settimer call. @JY, POST the last saved time (not the current) and then after calling the POST, save the current time to the timestamp variable
	//time param '2019-12-06T07:06:31.529Z' format pls 
	var myDB_refreshedPosts = function(email,time,callback) {
		console.log('Getting refreshed data');
		Posts
			.query(email)
			.where('createdAt').gt(time)	//time param should be X sec B4 current time, so check for any entries that were made since the last updated time (gte = greater than)
			.loadAll()
			.exec(function (err, resp) {
			    if(err) {
				      console.log(' - Error running query', err);
				      callback(null, err);	 
				    } else {
				      var posts = _.pluck(resp.Items, 'attrs');
				      console.log(posts);
				      callback(posts,null);	 
				      
				      if(resp.ConsumedCapacity) {
				        console.log('----------------------------------------------------------------------');
				        console.log('Query consumed: ', resp.ConsumedCapacity);
				      }
				    }
			});
	} //myDB_refreshedPosts('test@gmail.com','2019-12-06T07:06:31.529Z', function(n,err){});
	
//returns oldest --> newest 
	var myDB_getComments = function(postid,time,callback) {
		console.log('Getting post comments'); 
		
		if (time == 0) {	//initial load
		Comments
			.query(postid)
			.loadAll()
			.exec(function (err, resp) {
				    if(err) {
				      console.log(msg + ' - Error running query', err);
				      callback(null, err);	//12/6 fix
				    } else {
				      var comments = _.pluck(resp.Items, 'attrs');
				      console.log(comments);
				      callback(comments,null);	//12/6 fix
				      
				      if(resp.ConsumedCapacity) {
				        console.log('----------------------------------------------------------------------');
				        console.log('Query consumed: ', resp.ConsumedCapacity);
				      }
				    }
			});
		}
		else {	//refreshed comments
			Comments
			.query(postid)
			.where('createdAt').gt(time)
			.loadAll()
			.exec(function (err, resp) {
			    if(err) {
			      console.log(msg + ' - Error running query', err);
			      callback(null, err);	//12/6 fix
			    } else {
			      var comments = _.pluck(resp.Items, 'attrs');
			      console.log(comments);
			      callback(comments,null);	 
			      
			      if(resp.ConsumedCapacity) {
			        console.log('----------------------------------------------------------------------');
			        console.log('Query consumed: ', resp.ConsumedCapacity);
			      }
			    }
		});
		}
	} 
	//myDB_getComments('lydiama8@gmail.com1', '2019-12-01T18:52:56.276Z', function(n,err){});
	
	var myDB_getActiveFriends = function(email, callback) {
		Relations.get(email, function (err,n) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else if (n!=null) {
				var friends = [];
				var active = [];
				console.log('Friend list: ', n.get('friends'));
				friends = n.get('friends');
	 			  async.forEach(friends, function (f, xcallback) {		//for each rest name, look up val
	 				 Users.get(f, function(err, user) {
	 					console.log(user.get('loginstatus'));
	 					if (user.get('loginstatus') == true) {
	 							var activefriend = {
	 								name: user.get('name'),
	 								email: user.get('email')
	 							};
	 							//console.log(activefriend);
	 							active.push(activefriend);
	 							xcallback();
	 					} else {
	 						xcallback();
	 					}
	 				});
	 			  }, function() {
	 				  console.log("Active users: " + JSON.stringify(active));
	 				  callback(active,null);
	 			  });		  
			} else {
				callback(null,null);
			}
		});	
	}
	
	var myDB_postNewPost = function(email, status, callback) {
		Users.update({email: email, numPosts: {$add : 1}}, function(err, a) {	//1 ++numPosts, create new postid
			if (err) {
				callback (null, 'Error: ' +err);
			} else {
				console.log("DB: Updated User.numPosts", a.get('numPosts'));
				
				Relations.get(email, function (err,n) {	//2 get creator's list of friends
					if (err) {
						callback (null, 'Error: ' +err);
					} else if (n.get('friends')!=undefined) {
						var friends = n.get('friends');	//array of creator friends
						friends.push(email);	//include creator in array
						async.forEach(friends, function (f, xcallback) {	//3 new post entry for each of creator's friends
							var newPost = {
								email: f,
								postCreator: email,
								postID: email + a.get('numPosts'),
								post: status
							};
							Posts.create(JSON.stringify(newPost), function (err, a) {
								if (err) {
									console.log(err);
									callback (null, 'Error: ' +err);
								}
								else {
									console.log('DB: Created post for', a.get('email'));
									xcallback();
								}
							});
						}, function() {
							console.log("DB: All posts created");
			 				callback('Success',null);
						});	//3
					}
					else {	//user has no friends
						var newPost = {
								email: email,
								postCreator: email,
								postID: email + a.get('numPosts'),
								post: status
						};
						Posts.create(JSON.stringify(newPost), function (err, a) {
							if (err) {
								console.log(err);
								callback (null, 'Error: ' +err);
							}
							else {
								console.log('Created post for', a.get('email'));
							}
						});
						callback('Success',null);
					}
				});	//2
				
			}
		});	//1 
	}
	
//myDB_postNewPost('lydiama8@gmail.com', 'test w friends again', function(n, err){});	

	var myDB_addComment = function (postid, content, email, callback) {
		var newcomment = {
			postID: postid,
			comment: content,
			creator: email
		};
		
		Comments.create(newcomment, function(err, a) {
//			if (err) {
//				callback('Error: ' + err, null);
//			} else {
				console.log('Created comment', a.get('comment'));
				callback(newcomment);
//				callback(null, newcomment);
//			}
		});
	}
	
	var myDB_getSuggestions = function(term, callback) {
		Users
			.scan()
			.where('name').beginsWith(term)
			.attributes(['email','name'])
			.loadAll()
			.exec(function (err, resp) {
			    if(err) {
				      console.log(msg + ' - Error running query', err);
				      callback(null, err);	 
				    } else {
				      var suggs = _.pluck(resp.Items, 'attrs');
				      console.log(suggs);
				      callback(suggs,null);	
				      
				      if(resp.ConsumedCapacity) {
				        console.log('----------------------------------------------------------------------');
				        console.log('Query consumed: ', resp.ConsumedCapacity);
				      }
				    }
			});
	}

/*	//RETURN SPECIFIC POST
	var myDB_getAllPosts = function(email, rangekey, callback) {
		console.log('Getting posts');
		Posts.get(email, rangekey, function (err,n) {
			if (err) {
				console.log('Lookup error: ' +err);
				//callback (null, 'Lookup error: ' +err);
			} else {
				console.log(n);	 
				//callback(n.get('friends'), null);   
			}
		});
	}
*/
	//FOR QUERY TESTING
	/*var sendPostResults = function (msg) {
		  return function (err, resp) {

		   // console.log('----------------------------------------------------------------------');
		    if(err) {
		      console.log(msg + ' - Error running query', err);
		    } else {
		     // console.log(msg + ' - Found', resp.Count, 'items');
		      var posts = util.inspect(_.pluck(resp.Items, 'attrs'));
		      console.log(posts);
		      return posts;
		      
		      if(resp.ConsumedCapacity) {
		        console.log('----------------------------------------------------------------------');
		        console.log('Query consumed: ', resp.ConsumedCapacity);
		      }
		    }

		  //  console.log('----------------------------------------------------------------------');
		  };
		};*/

	//------------------------------- GROUPS TABLE -----------------------------//
	
	//RETURN USER'S GROUPS [STRING LIST] 
	var myDB_getGroups = function(email, callback) {
		console.log("Getting user's groups");
		Users.get(email, function (err,n) {
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log('Group list: ', n.get('groups'));	
				callback (n.get('groups'), null);
			}
		});
	} 
	
	//RETURN GROUP INFO BY ID
	var myDB_getGroupInfo = function(groupID, callback) {
		console.log("Getting info of group " +groupID);
		Groups.get(groupID, function (err,n) {
			if (err) {
				console.log("Error:" +err);
				callback (null, 'Lookup error: ' +err);
			} else {
				var info = {
					groupID: groupID,
					groupName: n.get('groupName'),
					isGroupChat: n.get('isGroupChat')
				}
				console.log('Group info: ' + info);	
				callback (info, null);
			}
		});
	}; 
	
	//RETURN GROUP'S NAME
	var myDB_getGroupName = function(groupID, callback) {
		console.log("Getting name of group " +groupID);
		Groups.get(groupID, function (err,n) {
			if (err) {
				console.log("Error:" +err);
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log('Group Name: ', n.get('groupName'));	
				callback (n.get('groupName'), null);
			}
		});
	}; 
	
	//RETURN GROUP'S USERS [STRING LIST] 
	var myDB_getChatUsers = function(groupID, callback) {
		console.log("Getting users of group " +groupID);
		Groups.get(groupID, function (err,n) {
			if (err) {
				console.log("Error:" +err);
				callback (null, 'Lookup error: ' +err);
			} else {
				console.log('User list: ', n.get('chatUsers'));	
				callback (n.get('chatUsers'), null);
			}
		});
	}; 
	
	//Add group to every relevant user's group list
	var myDB_createGroup = function(users, callback) {
		console.log('DB: Creating new group for specified users');
		var counter = 0;
		var target = users.length;
		var groupChat = false;
		if (target > 2) {
			groupChat = true;
		}
		var groupId = '' + Math.random().toString(36).substr(2, 9);
		var groupName = "";
		console.log(users);
		for (var i = 0; i < users.length; i++) {
			if(i == users.length - 1){
				groupName += " and " + users[i];
			}
			else if(i == users.length - 2){
				groupName += users[i];
			}
			else {
				groupName += users[i] + ", ";
			}
		}
		
		var newGroup = {
			groupID: groupId,
			groupName: groupName,
			isGroupChat: groupChat,
			chatUsers: users
		};
 		Groups.create(newGroup, function(error, a) {
 			if (error) {
 				console.log("Could not create requested group: " +error);
 				callback(null, 'Error: ' +error);
 			}
 			else {
 				console.log('Created group', a.get('groupID'));
 				async.forEach(users, function(user, callback) {
 		 			Users.update({email: user, groups: {$add: groupId}}, function(err, n) {
 		 				if (err) {
 		 					console.log('Error' + err);
 		 					counter++;
 		 				} else {
 		 					console.log('Created group in listing for ' + user);
 		 					counter++;
 		 				}
 		 				if(counter === target) {
 							console.log("Finished adding group for all users");
 							callback("Groups added to users' info", null);
 						}
 		 			});
 		 		}, callback);
 			}
 		});
	};
	
	//GET GROUPS IN COMMON BETWEEN TWO USERS
	var myDB_getCommonGroups = function(user, friend, callback) {
		Users.get(user, function (err1,a) {
			if (err1) {
				callback (null, 'Lookup error: ' +err1);
			} else {
				var set1 = a.get('groups');
				Users.get(friend, function (err2,n) {
					if (err2) {
						callback (null, 'Lookup error: ' +err2);
					} else {
						var returnSet = [];
						var set2 = n.get('groups');
						for (var i = 0; i < set1.length; i++) {
							for (var j = 0; j < set2.length; j++) {
								if (set1[i] === set2[j]) {
									returnSet.push(set1[i]);
								}
							}	
						}	
						callback(returnSet, null);
					}
				});
			}
		});
	};
	
	//DELETE PRIVATE CHAT BY LIST OF COMMON GROUPS
	var myDB_deleteChat = function(groupList, callback) {
		console.log('DB: Searching for private chat to delete');
		async.forEach(groupList, function(groupID, callback) {
	 		Groups.get(groupID, function(err, n) {
	 			if (err) {
	 				console.log('Error' + err);
	 			} else {
	 				console.log('Checking if ' + groupID + ' is a private chat');
	 				if (n.get('isGroupChat') === false) {
	 					console.log('Located chat to delete: ' + groupID);
	 					var relevantUsers = n.get('chatUsers');
	 					console.log(relevantUsers);
	 					var counter = 0;
	 					var target = relevantUsers.length;
	 					async.forEach(relevantUsers, function(user, callback) {
	 						Users.update({email: user, groups: {$del : groupID}}, function(err, a) {
	 	 		 				if (err) {
	 	 		 					console.log('Error' + err);
	 	 		 					counter++;
	 	 		 					if(counter == target) {
		 	 							console.log("Finished deleting group for all users");
		 	 							callback("Groups removed from users' info", null);
		 	 						}
	 	 		 				} else {
	 	 		 					console.log('Deleted group in listing for ' + user);
	 	 		 					counter++;
	 	 		 					if(counter == target) {
		 	 							console.log("Finished deleting group for all users");
		 	 							callback("Groups removed from users' info", null);
		 	 						}
	 	 		 				}
	 	 		 			});
	 					}, callback);
	 				}
	 			}
	 		});
	 	}, callback);
	};

	//RENAME RELEVANT GROUP BY ID
	var myDB_renameGroup = function(groupId, newName, callback) {
		Groups.update({groupID: groupId, groupName: newName}, function(err, n) {
			if (err) {
				console.log('Error' + err);
				callback(null, err);
			} else {
				console.log('Updated group name for ' + groupId);
				callback("Success", null);
			}
		});
	};
	
	//LEAVE RELEVANT GROUP BY EMAIL
	var myDB_leaveGroup = function(email, groupId, callback) {
		Users.update({email: email, groups: {$del: groupId}}, function(err, n) {
				if (err) {
					console.log('Error' + err);
					callback(null, err);
				} else {
					console.log('Removed group in listing for ' + email);
					callback("Success", null);
				}
			});
	};
	
	var myDB_getNotifs = function (email, time, callback) {
		console.log('Getting refreshed chat data');
		Invites
			.query(email)
			.where('createdAt').gt(time)	//time param should be X sec B4 current time, so check for any entries that were made since the last updated time (gte = greater than)
			.loadAll()
			.exec(function (err, resp) {
			    if(err) {
				      console.log(' - Error running query', err);
				      callback(null, err);	 
				    } else {
				      var invites = _.pluck(resp.Items, 'attrs');
				      console.log(invites);
				      callback(invites,null);	 
				      
				      if(resp.ConsumedCapacity) {
				        console.log('----------------------------------------------------------------------');
				        console.log('Query consumed: ', resp.ConsumedCapacity);
				      }
				}
		});
	};
	
	//------------------------------- CHATS TABLE -----------------------------//
	
	//ADD A NEW CHAT MESSAGE TO THE DATABASE
	var myDB_uploadChat = function(groupID, user, msg, callback) {
		console.log('DB: Adding chat to ' + groupID + " by " + user);
		var newChat = {
			groupID: groupID,
			user: user,
			message: msg
		};
 		Chats.create(newChat, function(error, data) {
 			if (error) {
 				console.log("Could not add requested chat: " +error);
 				callback(null, 'Error: ' +error);
 			}
 			else {
 				console.log('Created chat', data.get('message'));
 				callback("Chat added successfully!", null);
 			}
 		});
	};
	
	var myDB_downloadChats = function(groupID, callback) {
		console.log('DB: Pulling chats for ' + groupID);
		Chats
		.query(groupID)
		.loadAll()
		.exec(function (err, resp) {
			    if(err) {
			      console.log('Error running query', err);
			      callback(null, err);	
			    } else {
			      var chats = _.pluck(resp.Items, 'attrs');
			      callback(chats,null);	
			      
			      if(resp.ConsumedCapacity) {
			        console.log('----------------------------------------------------------------------');
			        console.log('Query consumed: ', resp.ConsumedCapacity);
			      }
			    }
		});
	};
	
	var myDB_sendInvites = function(groupID, user, callback) {
		console.log('DB: Sending invites for ' + groupID);
		Groups.get(groupID, function (err,n) {
			if (err) {
				console.log("Error:" +err);
				callback (null, 'Lookup error: ' +err);
			} else {
				var sender = user;
				var recipients = n.get('chatUsers');
				var counter = 0;
				var target = recipients.length;
				async.forEach(recipients, function(recipient, callback) {
					if(recipient != sender) {
						Invites.create({recipient: recipient,
							            sender: sender, 
							            groupID: groupID}, function(error, a) {
	 		 				if (error) {
	 		 					console.log('Error' + err);
	 		 					counter++;
	 		 					if(counter === target) {
	 								console.log("Finished sending all invites");
	 								callback("Invites sent to fellow chatters!", null);
	 							}
	 		 				} else {
	 		 					console.log('Created invite for ' + recipient);
	 		 					counter++;
	 		 					if(counter === target) {
	 								console.log("Finished sending all invites");
	 								callback("Invites sent to fellow chatters!", null);
	 							}
	 		 				}
	 		 			});
					}
					else {
						counter++;
						if(counter === target) {
							console.log("Finished sending all invites");
							callback("Invites sent to fellow chatters!", null);
						}
					}
 		 		}, callback);
			}
		});
	};

//------------------------------- VISUALIZER  -----------------------------//

var myDB_getfriendvisualizer = function(user, fullname, callback) {
	var friends = []; 
	console.log(user);
	//get user's immediate friends 
	Relations.get(user, function (err,n) {
		if (err) {
			callback (null, 'Lookup error: ' +err);
		} else if (n.get('friends')!=undefined) {	//has friends 
			//array of user's friends' emails 
			console.log('DB: User friend list: ', n.get('friends'));	
			var friendEmails = n.get('friends');
			
			//for each friend email, get name + children
			async.forEach(friendEmails, function(f, xcb){
				Users.get(f, function(err,userObj){
					if (err) {
						callback (null, 'Lookup error: ' +err);
					} else {
						console.log(user + ' friend: ' + userObj.get('name'));
						var friendName = userObj.get('name');
						//*get Relations? 
						var friendJSON = {
							id: f,
							name: friendName,
							data: {},
							children: [] //*do? 
						}
						friends.push(friendJSON);
						xcb();
					}
				});
			}, function() {
				var json = {
					id: user,
					name: fullname,
					children: friends,
					data: {}
				};
				console.log("Friends 2 be visualized " + JSON.stringify(json));
				callback(json,null);
			});
		} else {	//no friends
			callback(null,null);
		}
	});	
};
	
//myDB_getfriendvisualizer ('jenyen@seas.upenn.edu', 'Jen', function(n,err){});
	
var myDB_getAffiliates = function(userEmail, fullname, friendID, callback) {
	var userFriends = [];
	var friendFriends = [];
	var affiliates = []; 
	var affiliation;
	
	//0 get user aff 
	Users.get(userEmail, function(err,user) {
		if (user.get('affiliation') == 'Please update affiliation') {
			callback(null,null);
		}
		else {
		//1 get user friend list to cross check they r not already on the graph
		console.log('1DB_getAffiliates: get user friends');
		affiliation = user.get('affiliation');
		Relations.get(userEmail, function (err,n) {  
			if (err) {
				callback (null, 'Lookup error: ' +err);
			} else if (n.get('friends')!=undefined) {	//user has friends (should be yes, just checking) 
				userFriends = n.get('friends');
				//2 get friend's friends
				console.log('2DB_getAffiliates: get friends friends');
				Relations.get(friendID, function (err,f2) {	 
					if (err) {
						callback (null, 'Lookup error: ' +err);
					} else if (f2.get('friends')!=undefined) {	//friend has friends 
						friendFriends = f2.get('friends');
						console.log('3DB_getAffiliates: foreach friends friends');
						async.forEach(friendFriends, function(f, xcb){	//3 for each of friend's friends, check + add
							console.log('possible affiliate: ' + f);
							Users.get(f, function(err,userObj){
								var affiliateName = userObj.get('name');
								if (err) {	
									callback (null, 'Lookup error: ' +err);
								} else {
									if((userObj.get('affiliation') == affiliation) && !userFriends.includes(f) && f!=userEmail) {	//check if x has same aff + not alrdy a friend
										var affiliateJSON = {
											id: f,
											name: affiliateName,
											data: {},
											children: [] //*do? 
										}
										affiliates.push(affiliateJSON);
										xcb();
									} else {
										console.log(affiliateName + ' not an affiliate or alrdy a friend or self');
										xcb();
									}
								}
							});
						}, function() {
							var json = {
								id: userEmail,
								name: fullname,
								children: affiliates,
								data: {}
							};
							console.log("Affiliates 2 be visualized " + JSON.stringify(json));
							callback(json,null);
						});	//3
					} else {	//friend no friends
						callback(null,null);
					}
				}); //2
			} else {	//user no friends
				callback(null,null);
			}
		});	//end 1
	}
	});	//end 0
}

//myDB_getAffiliates ('jenyen@seas.upenn.edu', 'Jen', 'nkona@wharton.upenn.edu', function(n,err){});

// export schema functions
var database = {
	getCurrUser: myDB_getCurrUser,
	getName: myDB_getName,	 
	
	getFriends: myDB_getFriends,  //general friend getting, adding, deleting 
	addFriend: myDB_addFriend,
	deleteFriend: myDB_deleteFriend,
	
	getProfile: myDB_getProfile,	//profile pages
	updateProfile: myDB_updateProfile,
	updateName: myDB_updateName,
	updateAffiliation: myDB_updateAff,
	updateBday: myDB_updateBday,
	updateInterests: myDB_updateInterests,
	addInterest: myDB_addInterest,
	delInterest: myDB_delInterest,
	updateActiveStatus: myDB_updateActiveStatus,
	
	getPubMsgs: myDB_getPubMsgs,
	sendPubMsg: myDB_sendPubMsg,
	
	getUser: myDB_getUser,	//checklogin, create account  
	addUser: myDB_addUser,	//create account
	
	getAllPosts: myDB_getAllPosts,	//home feed
	getRefresh: myDB_refreshedPosts,
	getComments: myDB_getComments,
	getActiveFriends: myDB_getActiveFriends,
	postNewPost: myDB_postNewPost,
	addComment: myDB_addComment,
	getSuggestions: myDB_getSuggestions,
	
	getGroups: myDB_getGroups,
	getGroupInfo: myDB_getGroupInfo,
	getGroupName: myDB_getGroupName,
	getChatUsers: myDB_getChatUsers,
	createGroup: myDB_createGroup,
	getCommonGroups: myDB_getCommonGroups,
	deleteChat: myDB_deleteChat,
	renameGroup: myDB_renameGroup,
	leaveGroup: myDB_leaveGroup,
	getNotifs: myDB_getNotifs,
	
	uploadChat: myDB_uploadChat,
	downloadChats: myDB_downloadChats,
	sendInvites: myDB_sendInvites,
	
	getVisualizedFriends: myDB_getfriendvisualizer,
	getAffiliates: myDB_getAffiliates
  };

module.exports = database;