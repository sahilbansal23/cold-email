const express = require("express");

const { addnewmail } = require("./controller/addnewemail");

const app = express();
const PORT = process.env.PORT || 4000;

app.post("/configure", addnewmail);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
