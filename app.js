const express = require("express");

const {addnewmail} = require("./controller/addnewemail");

// const { Queue: BullMQ } = require('bullmq');



const app = express();
const PORT = process.env.PORT || 4000;


app.post("/configure",addnewmail);




// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
