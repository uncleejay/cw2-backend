// requires the express module
const express = require('express');
// calls the express function to start a new application
var app = express();
// requires the modules needed
const path = require("path");
const fs = require("fs");
var cors = require('cors');
//application middlewares
app.use(cors())
app.use(express.json());
app.use(function (req, res, next) {
    console.log("Request URL: " + req.url);
    console.log("Request Date: " + new Date());
    next();
});
app.use(function (req, res, next) {
    // Uses path.join to find the path where the file should be
    var filePath = path.join(__dirname, 'static', req.url);
    // Built-in fs.stat gets info about a file
    fs.stat(filePath, function (err, fileInfo) {
        if (err) {
            next();
            return;
        }
        // if the fie exists, send the file if not continue to the next middleware
        if (fileInfo.isFile()) res.sendFile(filePath);
        else next();
    });
});

// connects to mongodb
const {MongoClient} = require("mongodb");
const ObjectID = require('mongodb').ObjectID;
const uri = "mongodb+srv://joseph:cstweb@cluster0.h3rm5.mongodb.net/cstweb?retryWrites=true&w=majority";
let db;
MongoClient.connect(uri, (err, client) => {
    if(!err){
        db = client.db('cstweb');
    }else{
        console.log(err);
    }
});

// gets the mongodb collection name
app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName);
    return next()
});

app.get('/', (req, res, next) => {
    res.send('Select a collection, e.g., /collection/messages');
});


app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
});

app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e);
        console.log(results.ops);
        res.send(results.ops)
    })
})

app.put('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.update(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' })
        })
})

app.get('/collection/:collectionName/:query', (req, res, next) => {

const query = {"$or": [
    {'subject': {'$regex': req.params.query, '$options': 'i'}},
    {'location': {'$regex': req.params.query, '$options': 'i'}}
]};

   
req.collection.find(query).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
});

app.use(function (req, res) {
    // Sets the status code to 404
    res.status(404);
    // Sends the error "File not found!”
    res.send("File not found!");
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("App is listening on port 3000");
});