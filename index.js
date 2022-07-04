require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongo = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const shortId = require("shortid");
const validUrl = require("valid-url");
const app = express();


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: true}));

app.use(cors());

app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));



// Connection request to Data Base with some options
const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
});


//To get notified if the connection was succesfull o it has an error
const connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error:"));
connection.once("open", () => {
  console.log("MongoBD database connected succesfuly")
});

//This call the Schema method from Mongoose
const Schema = mongoose.Schema;
//This create the Schema urlSchema with its object and inputs
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});
//This create the model in the database
const URL = mongoose.model("URL", urlSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});



app.post("/api/shorturl", async function(req, res){
  const url = req.body.url
  const urlCode = shortId.generate();
  //check if the url is valid or not
  if(!validUrl.isWebUri(url)){
           res.json({
      error: 'invalid URL' })
  } else {
        try {
      //check if it´s alredy in the database
      let findOne = await URL.findOne({
        original_url: url
      })
      if(findOne){
        res.json({
          original_url: findOne.orignal_url,
          short_url: findOne.short_url
        })
      } else {
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        });
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch(err){
      console.log(err);
      res.json("Server error...")
    }
  }
});

app.get("/api/shorturl/:short_url", async function(req, res){
  try {
    let urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if(urlParams){
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json("No URL found")
    }
  } catch(err){
    console.log(err);
    res.status(500).json("Server error...")
  }
});



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
