require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/secretsDB', {useNewUrlParser: true, useUnifiedTopology: true});

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model('User', userSchema);

app.get( '/', (req, res) => {
        res.render('home')
    });

app.get( '/login', (req, res) => {
        res.render('login')
    });

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, (err) => {
        if (err) {
            console.log(err);
            
        } else {
            if ({password: password}) {
                res.render('secrets')
            } else {
                console.log(err);
                
            }
        }
    })
})
    
    
app.get( '/register', (req, res) => {
        res.render('register')
    });

app.post('/register', (req, res) => {
    const newUser =  new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save((err) => {
        if (err) {
            console.log(err);
            
        } else {
            res.render('secrets')
        }
    })
})


app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});