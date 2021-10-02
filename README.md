# PennBook

Pennbook is our take on building a social networking site similar to Facebook. Although the backend databases are now offline, the app can be 
run by following the instructions below and creating the requisite tables on AWS and uploading your account information in config. Our 
application implements an encrypted log-in, individual and personalizable profile pages, home pages that contain timelines of status updates, 
new friendships, and profile updates, as well as allowing for commenting. Naturally, people can add or delete friends, and also see their 
friends' friends and comment on their wall on their friends' profile pages. Users can also see which of their friends are currently active.

All updates are made dynamically, meaning that refreshes are not required to see updates to relevant pages, particularly on the home page 
timeline. There is also a chat function allowing for chats between friends and group chats, where messages are sent dynamically and are saved 
on the backend for persistence, allowing one to close the page and/or log out and come back to resume the chat later. Finally, we have also 
implemented a friend recommendation algorithm using Hadoop MapReduce that can be run from the command line. The full feature list is below.


## List of Features Implemented

- Users can create accounts from the signup page.
- Users can login from the login page.
- Users are password protected with encryption (SHA256) to prevent incorrect access
- Each user has a unique profile page that contains information such as full name,
affiliation, birthday, and interests. These fields can be updated dynamically.
- Each user has a home page with a timeline of status updates, new friendships, and
profile updates made by friends. 
- Users can post statuses from the homepage and this will be reflected on friends' homepages.
- Users can comment on posts on the homepage. 
- Users can see a list of active friends from the homepage that updates dynamically.
- Users can search for other users in the network through the searchbar. 
- User's time line/home feed is dynamically updated
- Users can post on friends' "walls" (i.e. public messages).
- Users can see their friends' friends on their profile (friendprofile.ejs)
- Users can add or delete friends. The add functionality is implemented on nonfriendprofile.ejs
and the delete functionality is implemented on friendprofile.ejs.
- Users can chat with one another. Each chat is generated automatically and the contents of
a chat session are persistent.
- Users can change the names of chats and will be dynamically updated for both users 
- Chat messages are ordered consistently.
- Chat messages scroll within the chat itself, not the window.
- Auto scrolling in chat module so that chats are self-contained and don’t stretch page
- Can temporarily leave chat by switching tabs, permanently by unfriending a user
- When a user receives a chat from another user, he/she receives a alert notification on the homepage.
- Chats can be opened when target user is offline, and messages sent can be seen when they log in and go to the chat page
- Friend recommendation mapreduce can be run from the command line. 
- Friend rec inputs are a two way list of type:name for users, interests, affiliations and outputs friend recs for all users
- Friend visualizer displays all friends. Upon clicking a friend node, visualizer will display that friend's friends who are not friends with the current user logged in, but have the same affiliates. 


## Running App

- Run npm install to install packages from package.json
- Run npm install vogels
- Run npm install socket.io
- Run node app.js. 
- Open localhost:8080.
