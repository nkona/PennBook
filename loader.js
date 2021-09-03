// create DB tables and initialize + delete, update tables 
'use strict';
var vogels = require('vogels'); 	 
//vogels.AWS.config.loadFromPath('./config.json');

var async = require('async');
var Joi = require('joi');
var SHA256 = require("crypto-js/sha256");


var AWS = require('aws-sdk');
var db = new AWS.DynamoDB();

//USER TABLE
//Test User Input

var pw = SHA256('test').toString();
var testUser = { 
	email : 'lydiama8@gmail.com',
	name : 'Lyds Ma',
	affiliation: 'Penn student',
 	interests: ['coffee', 'frozen'],
 	birthday: '2000-06-14',
 	password: pw,
 	numPosts: 0,
 	loginstatus: false,
 	groups: ['1', '2'],
};
var userData = [];

//Define Model
var Users = vogels.define('Users', {
	hashKey: 'email',
	// add the timestamp attributes (updatedAt, createdAt)
	timestamps: true,
	schema : {
		email : Joi.string().email(),
		name: Joi.string(),
		affiliation: Joi.string(),
		interests: vogels.types.stringSet(),
		birthday: Joi.date(),	//*might need a parser
		password: Joi.string(),
		numPosts: Joi.number(),	//keep track of posts created by user, to be used as Post ID 
		loginstatus: Joi.boolean().default(false),
		groups: vogels.types.stringSet()	//set of UUIDs
	},
	tableName: 'Users',
	indexes : [{
	    hashKey : 'name', rangeKey : 'email', name : 'SearchIndex', type : 'global'
	  }]
});

//Upload User Data function
var uploadUsers = function() {
	console.log("Uploading");
	async.forEach(userData, function(user, cb2){
		console.log("Adding user");
		Users.create(user, function(err,acc){
			console.log("Created account in DynamoDB", acc.get('birthday'));
			cb2();
		});
	}, console.log('Done!'));
};

//PUB MSGS TABLE
//Test
var testMsg = { 
		email : 'lydiama8@gmail.com',	//param friend email
		poster : 'test@gmail.com',
		posterName: 'test',
		message: 'hi lyd'
};

var pubmsgData = [testMsg];

//Define Model
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

//Upload Pub Msg Data function
var uploadMsgs = function() {
	console.log("Uploading");
	async.forEach(pubmsgData, function(msg, cb2){
		console.log("Adding msg");
		PubMsgs.create(msg, function(err,acc){
			console.log("Created public message in DynamoDB", acc.get('message'));
			cb2();
		});
	}, console.log('Done!'));
};


//RELATIONS TABLE
//Test Relations Input
var testRelation = { 
		email : 'jenyen@seas.upenn.edu',
		friends: ['nkona@wharton.upenn.edu', 'test@gmail.com']
};

var relationsData = [testRelation];

//Define Model
var Relations = vogels.define('Relations', {
	hashKey: 'email',
	// add the timestamp attributes (updatedAt, createdAt)
	timestamps: true,
	schema : {
		email : Joi.string().email(),
		friends: vogels.types.stringSet()
	},
	tableName: 'Relations'
});

//Upload Relation Data function
var uploadRelations = function() {
	console.log("Uploading relationships");
	async.forEach(relationsData, function(relation, cb2){
		console.log("Adding relation");
		Relations.create(relation, function(err,r){
			console.log("Created relation in DynamoDB", r.get('friends'));
			cb2();
		});
	}, console.log('Done!'));
};

//POSTS TABLE
//Test Post Input
var testPost1 = { 
		email : 'lydiama8@gmail.com',
		postCreator: 'lydiama8@gmail.com', 
		postID: 'lydiama8@gmail.com1', 
		post: 'Lydia updated her status: Test'
};

var testPost2 = { 
		email : 'test@gmail.com',
		postCreator: 'lydiama8@gmail.com', 
		postID: 'lydiama8@gmail.com1', 
		post: 'Lydia updated her status: Test'
};

var postsData = [testPost1, testPost2];

//Define Model
var Posts = vogels.define('Posts', {
	hashKey: 'email',	//user or friend who should see this post on their feed
	rangeKey: 'createdAt',		//sort key. 
	timestamps: true,
	schema : {
		email : Joi.string().email(),
		postCreator: Joi.string().email(),
		postID: Joi.string(),	// email+#posts (test@gmail.com1). not a UUID because table will have multiple entries for the same post
		post: Joi.string()	//*make posts a nested obj to include user who made it and content ? 
	},
	tableName: 'Posts',
	indexes : [{
	    hashKey : 'postID', name : 'PostIDIndex', type : 'global'	//for adding comments
	  }]
});

//Upload Post Data function
var uploadPosts = function() {
	console.log("Uploading posts");
	async.forEach(postsData, function(post, cb2){
		console.log("Adding post");
		Posts.create(post, function(err,p){
			console.log("Created post in DynamoDB", p.get('post'));
			cb2();
		});
	}, console.log('Done!'));
};

//COMMENTS TABLE
//Test Comment Input
var testC1 = { 
		postID: 'lydiama8@gmail.com1', 
		comment: 'Lit',
		creator: 'test@gmail.com'
};

var testC2 = { 
		postID: 'lydiama8@gmail.com1', 
		createdAt: '2019-12-01T18:52:56.276Z',
		comment: 'Hi',
		creator: 'test2@gmail.com'
};
var commentData = [testC1, testC2];

//Define Model
var Comments = vogels.define('Comments', {
	hashKey: 'postID',	//map comment to specific post 
	rangeKey: 'createdAt',		//sort key
	timestamps: true,
	schema : {
		postID: Joi.string(),	// email+#posts (test@gmail.com#)
		comment: Joi.string(),	//*make posts a nested obj to include user who made it and content ? 
		creator: Joi.string().email()
	},
	tableName: 'Comments'
});

//Upload Comment Data function
var uploadComments = function() {
	console.log("Uploading comments");
	async.forEach(commentData, function(com, cb2){
		console.log("Adding comment");
		Comments.create(com, function(err,c){
			console.log("Created comment in DynamoDB", c.get('comment'));
			cb2();
		});
	}, console.log('Done!'));
};

//CHAT GROUP TABLE
var testgroup = { 
		groupID: '482791832',
		groupName: 'swag',
		chatUsers: ['lydiama8@gmail.com', 'test@gmail.com', 'test2@gmail.com']
};

var groupData = [testgroup];

//Define Model
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

var uploadGroups = function() {
	console.log("Uploading Group data");
	async.forEach(groupData, function(group, cb2){
		console.log("Adding Group");
		Groups.create(group, function(err,g){
			console.log("Created Group in DynamoDB", g.get('chatUsers'));
			cb2();
		});
	}, console.log('Done!'));
};

//CHAT MESSAGE TABLE
var testchat = { 
		groupID: '482791832',
		groupName: 'swag',
		user: 'lydiama8@gmail.com',
		message: 'Hi'
};

var chatData = [testchat];

//Define Model 
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

var uploadChats = function() {
	console.log("Uploading Chat data");
	async.forEach(chatData, function(chat, cb2){
		console.log("Adding Chat Message");
		Chats.create(chat, function(err,c){
			console.log("Added chat in DynamoDB", c.get('message'));
			cb2();
		});
	}, console.log('Done!'));
};

//CHAT INVITE TABLE

var testinvite = { 
		receiver: 'nkona@wharton.upenn.edu',
		sender: 'lydiama8@gmail.com',
		groupID: '482791832',
		groupName: 'swag',
};

var inviteData = [testinvite];

var uploadInvites = function() {
	console.log("Uploading Invite data");
	async.forEach(inviteData, function(invite, cb2){
		console.log("Adding Invite Message");
		Chats.create(invite, function(err,c){
			console.log("Added invite in DynamoDB", c.get('message'));
			cb2();
		});
	}, console.log('Done!'));
};

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

function deleteTable (table, uploadFunc, err, data) {	//if u call delete table, u will create table and load data 
	if (err) {
		console.log('Error: ' +err);
	} else  {
		console.log("Deleting "+ table +" table");
		var params = {
		        "TableName": table
		}; 
		db.deleteTable(params, function() { 
			console.log("Waiting 15s for the table to be deleted...");
			setTimeout(function() {
				console.log(table + " table deleted!");
				createTables(uploadFunc);	//includes loadtable data
			}, 15000);
		});
	}
}

var createTables = function (uploadFunc) {
	console.log('Creating tables');
	vogels.createTables(function(err) {	
		  if (err) {
		    console.log('Error creating tables: ', err);
		  } else {
		    console.log("Waiting 30s for the table to become active...");
		    setTimeout(uploadFunc, 30000);
		  }	
	});
}


//USERS 
deleteTable("Users",uploadUsers,null,null);

//PUBMSGS
deleteTable("PubMsgs",uploadMsgs,null,null);

//RELATIONS
deleteTable("Relations",uploadRelations,null,null);

//POSTS
deleteTable("Posts",uploadPosts,null,null);
//createTables (uploadPosts)();

//COMMENTS
deleteTable("Comments",uploadComments,null,null);

//GROUPS
deleteTable("Groups",uploadGroups,null,null);

//CHATS
//deleteTable("Chats",uploadChats,null,null);

//CHAT INVITES
deleteTable("Invites",uploadInvites,null,null);

