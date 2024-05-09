const express = require("express");
const nodemailer = require("nodemailer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");

// const { Queue: BullMQ } = require('bullmq');

const getEmails = (email, appPassword) => {
  try {
    const imapConfig = {
      user:email,
      password: appPassword,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    };

    setInterval(()=>checkIMAP(imapConfig),30000);
    checkIMAP(imapConfig)
  } catch (ex) {
    console.log("an error occurred");
  }
};
const checkIMAP=(imapConfig)=>{
    const imap = new Imap(imapConfig);
    imap.connect();
    imap.once("ready", () => {
        imap.openBox("INBOX", false, () => {
          imap.search(["UNSEEN", ["SINCE", new Date()]], (err, results) => {
              if(results.length>0){
            const f = imap.fetch(results, { bodies: "" });
            f.on("message", (msg) => {
              msg.on("body", (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  // const {from, subject, textAsHtml, text} = parsed;
                  console.log("parsed,", parsed);
  
                  // Retrieve sender's email address
                  const sender = parsed.headers.get("from").text;
  
                  // Regular expression to match email addresses
                  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
                
                  const extractedEmails = sender.match(emailRegex);
                  
                  // Log the extracted email addresses
                  console.log('Extracted Emails:', extractedEmails);
                  // Retrieve email body
                  let emailBody = parsed.text;
                 
  
                  console.log("Sender:", extractedEmails);
                  console.log("Email Body:", emailBody);
  
                  processEmail(extractedEmails, emailBody);
  
                  /* Make API call to save the data
                       Save the retrieved data into a database.
                       E.t.c
                    */
                });
              });
              msg.once("attributes", (attrs) => {
                const { uid } = attrs;
                imap.addFlags(uid, ["\\Seen"], () => {
                  // Mark the email as read after reading it
                  console.log("Marked as read!");
                });
              });
            });
          
            f.once("error", (ex) => {
              return Promise.reject(ex);
            });
            f.once("end", () => {
              console.log("Done fetching all messages!");
            });
          }
          else{
            imap.end();
          }
          });
        });
      });
  
      imap.once("error", (err) => {
        console.log("error in imap", err);
        imap.destroy();
      });
  
      imap.once("end", () => {
        console.log("Connection ended");
        imap.destroy();
      });
}

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize BullMQ queue
// const queue = new BullMQ('emailQueue');

let transporter; // Declare transporter outside the route handler to make it accessible globally

// Endpoint to configure email and app password
app.post("/configure", async (req, res) => {
  // console.log("req.body",req);
  const { email, appPassword } = req.query;
  console.log("email", email);
  console.log("appPassword", appPassword);

  //Initialize transporter with received credentials
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: appPassword,
    },
  });

  res.json({ message: "Configuration successful" });

  // Start reading and queuing emails after configuration
  readAndQueueEmails(email, appPassword);

});

async function readAndQueueEmails(email, appPassword) {
  // Ensure transporter is initialized
  if (!transporter) {
    console.error("Transporter not initialized");
    return;
  }

  // Create Nodemailer transporter with IMAP
  try {
    // Retrieve unseen emails
    // var currentDate = new Date();
    getEmails(email, appPassword);

    // currentDate.setDate(currentDate.getDate() - 1);
    // const emails = await transporter.search(['UNSEEN', ['SINCE', currentDate]]);

    // // Process each email and add it to the queue
    // for (const email of emails) {
    //     const message = await transporter.fetch(email.uid, { bodies: ['TEXT'] });
    //     const emailBody = message.text;
    //     console.log("emailbody",emailBody);
    //     //processEmail(emailBody);
    //     // queue.add('processEmail', { emailBody });

    //     // Mark email as seen
    //     await transporter.setFlags(email.uid, ['\\Seen']);
    // }
  } catch (error) {
    console.error("Error reading emails:", error);
  }

  // Schedule next read
}

// Function to process emails from the queue
async function processEmail(fromEmail, emailBody) {
  // const emailBody = emailBody;
  // Print email body to console
  console.log("Received email:", emailBody);

  let replyText;
  if (emailBody.toLowerCase().includes("interested")) {
    replyText =
      "Thank you for your interest. We will provide more information shortly.";
  } else if (emailBody.toLowerCase().includes("not interested")) {
    replyText =
      "Thank you for letting us know. If you change your mind, feel free to reach out.";
  } else {
    replyText = "Thank you for your email. How can we assist you further?";
  }

  try {
    await sendReply(fromEmail, replyText);
  } catch (error) {
    console.error("Error sending reply:", error);
  }
}

// Function to send reply to the email
async function sendReply(fromEmail, replyText) {
  // Ensure transporter is initialized
  if (!transporter) {
    console.error("Transporter not initialized");
    return;
  }

  try {
    // Extract email address from the data
    // const fromEmail = fromEmail;

    // Send automated reply
    await transporter.sendMail({
      from: "Your Name <your@gmail.com>",
      to: fromEmail,
      subject: "Thank you for your reply",
      text: replyText,
    });
    console.log("Reply sent to:", fromEmail);
  } catch (error) {
    console.error("Error sending reply:", error);
  }
}

// Process queue for handling emails
// queue.process('processEmail', async (job) => {
//     await processEmail(job);
// });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
