const nodemailer = require("nodemailer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
let transporter;
async function readAndQueueEmails(email, appPassword) {
  try {
    if (!transporter) {
      console.error("Transporter not initialized");
      throw new Error("Error in transporter");
    }
    getEmails(email, appPassword);
  } catch (error) {
    console.error("Error reading emails:", error);
    throw new Error("Error in transporter");
  }
}

async function processEmail(fromEmail, emailBody) {
  //   console.log("email body main:", emailBody);
  let replyText = null;
  if (emailBody.toLowerCase().includes("not interested")) {
    replyText = `
I hope this email finds you well.

Thank you for taking the time to respond. I understand that you are currently not interested in learning more about [Topic]. Your feedback is valuable to us, and we respect your decision.

Should your circumstances change in the future or if you find yourself reconsidering, please don't hesitate to reach out to us. We are always here to assist you and provide further information whenever you need it.

Feel free to contact us at [Your Contact Information] whenever you are ready to explore [Topic] further. We would be delighted to assist you in any way we can.

Once again, thank you for considering [Your Company/Product/Service]. We wish you all the best in your endeavors.

Best Regards,
Sahil Bansal
+91-9479875600
`;
  } else if (emailBody.toLowerCase().includes("interested")) {
    replyText = `I hope this email finds you well.
    
Thank you for expressing your interest in learning more about [Product/Service]. We're thrilled to hear that you are keen to explore further.
    
To provide you with a comprehensive understanding of our [Product/Service], I would like to extend an invitation for a demo call. This will allow us to walk you through the features, benefits, and any specific aspects you might be interested in.
    
Could you please let me know a convenient time for you to hop on a demo call? I'm available [suggest a few specific times or offer to accommodate their schedule]. Kindly confirm your availability, and I'll ensure to schedule the call accordingly.
    
Looking forward to connecting with you and addressing any queries you may have.
    
Best Regards,
Sahil Bansal
+91-9479875600
    `;
  } else {
    replyText = `
I hope this email finds you well.
Thank you for your email. How can we assist you further?

Best Regards,
Sahil Bansal
+91-9479875600
`;
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
    await transporter.sendMail({
      from: "Sahil Bansal [Comapany Name]",
      to: fromEmail,
      subject: "Thank you for your reply",
      text: replyText,
    });
    console.log("Reply sent to:", fromEmail);
  } catch (error) {
    console.error("Error sending reply:", error);
    throw new Error(error);
  }
}

const getEmails = async (email, appPassword) => {
  try {
    const imapConfig = {
      user: email,
      password: appPassword,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    };

    setInterval(() => checkIMAP(imapConfig), 2000);
    checkIMAP(imapConfig);
  } catch (error) {
    console.log("an error occurred", error);
  }
};
const checkIMAP = (imapConfig) => {
  const imap = new Imap(imapConfig);
  imap.connect();
  imap.once("ready", () => {
    imap.openBox("INBOX", false, () => {
      imap.search(["UNSEEN", ["SINCE", new Date()]], (err, results) => {
        if (results.length > 0) {
          const f = imap.fetch(results, { bodies: "" });
          f.on("message", (msg) => {
            msg.on("body", (stream) => {
              simpleParser(stream, async (err, parsed) => {
                console.log("parsed,", parsed);

                const sender = parsed.headers.get("from").text;

                const emailRegex =
                  /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

                const extractedEmails = sender.match(emailRegex);

                // Log the extracted email addresses
                //console.log("Extracted Emails:", extractedEmails);
                // Retrieve email body
                let emailBody = parsed.text;

                console.log("Sender Email:", extractedEmails);
                console.log("Email Body:", emailBody);

                processEmail(extractedEmails, emailBody);
              });
            });
            msg.once("attributes", (attrs) => {
              const { uid } = attrs;
              imap.addFlags(uid, ["\\Seen"], () => {
                console.log("Marked the email as read!");
              });
            });
          });

          f.once("error", (ex) => {
            return Promise.reject(ex);
          });
          f.once("end", () => {
            console.log("Done fetching all messages!");
          });
        } else {
          imap.end();
        }
      });
    });
  });

  imap.once("error", (err) => {
    console.log("error in imap", err.message);
    if (err.message == "Invalid credentials (Failure)") {
      throw new Error("Invalid Credential");
    }
    imap.destroy();
  });

  imap.once("end", () => {
    console.log("Connection ended");
    imap.destroy();
  });
};
async function createAndVerifyTransporter(email, appPassword) {
  try {
    // Create transporter
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: appPassword,
      },
    });

    // Verify transporter
    await transporter.verify();

    console.log("Transporter is ready to send emails");
    // Proceed with your code here
    return true;
  } catch (error) {
    console.error("Error creating or verifying transporter:", error);
    throw new Error("INVALID Credentials");
  }
}

const addnewmail = async (req, res) => {
  try {
    const { email, appPassword } = req.query;
    console.log("email", email);
    console.log("appPassword", appPassword);

    //To create any verify the transporter
    await createAndVerifyTransporter(email, appPassword);
    // Here we can also save the appPassword and email into DB
    res.status(200).send({
      status: 200,
      msg: "Configuration successful",
    });

    readAndQueueEmails(email, appPassword);
  } catch (error) {
    res.status(400).send({
      status: 400,
      msg: error.message,
    });
  }
};

module.exports = {
  addnewmail,
};
