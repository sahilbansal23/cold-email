Automated Email Reply System
Overview
This Node.js backend application provides an automated email reply system. It monitors incoming emails and generates replies based on given criterion
1) Interested
2) Not Interested
3) More information 

Features
Automatic processing of incoming emails
Generation of replies based on predefined criteria
Integration with a mail server for sending responses
Logging of email processing activities

Prerequisites
Node.js installed on your machine
Access to an email server (e.g., Gmail) for sending and receiving emails
Necessary credentials (email address, app password if using Gmail)

Installation
Clone this repository to your local machine.

git clone https://github.com/your-username/automated-email-reply.git

Navigate to the project directory.

npm install

Libraray used

Used IMAP for reading the all unseen mail in the authenticated mail 

Used nodemailer for sending the mail reply

To Run in Local machine 
Hit the api using postman and it starts working automatically

http://localhost:4000/configure?email=[EMAIL_ADDRESS]&appPassword=[YOUR_APP_PASSWORD]
