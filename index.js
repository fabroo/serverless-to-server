const admin = require("firebase-admin");
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 5002;
const bodyParser = require("body-parser");

admin.initializeApp();

app.use(cors());
app.use(bodyParser.json());

app.use('/global', require("./global.functions"))
app.use('/spotify', require("./spotify.functions"))
app.use('/youtube', require("./youtube.functions"))

app.listen(PORT, () =>{
	console.log(`[SERVER] : running on port ${PORT}`)
})