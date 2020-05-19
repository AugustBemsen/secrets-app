require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// const md5 = require('md5');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'This is a loving and fun secret.',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/secretsDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    submittedSecret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);


passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
       ;
        
      return cb(err, user);
    });
  }
));

app.get( '/', (req, res) => {
        res.render('home')
    });
    
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
});

app.get( '/login', (req, res) => {
        res.render('login')
    });

app.post('/login', (req, res) => {
    const user = new User({
        username : req.body.username,
        password : req.body.password
    })

    // User.findOne({email: username}, (err) => {
    //     if (err) {
    //         console.log(err);
            
    //     } else {
    //         if ({password: password}) {
    //             res.render('secrets')
    //         } else {
    //             console.log(err);
                
    //         }
    //     }
    // })

    req.login(user, function(err) {
        if (err) { 
            console.log(err);  
         } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
         }

      });
})
    
    
app.get( '/register', (req, res) => {
        res.render('register')
    });

app.get('/secrets', (req, res) => {
    // if (req.isAuthenticated()) {
    //     res.render('secrets');
    // } else {
    //     res.redirect('/login');
    // }
    User.find({submittedSecret: {$ne: null}}, (err, foundUsers) => {
        if (err) {
            console.log(err);
            
        } else {
            res.render('secrets', {useSecrets: foundUsers});
            console.log(foundUsers);
            
            
        }
    });
})

app.post('/register', (req, res) => {
    // const newUser =  new User({
    //     email: req.body.username,
    //     password: md5(req.body.password)
    // });
    // newUser.save((err) => {
    //     if (err) {
    //         console.log(err);
            
    //     } else {
    //         res.render('secrets')
    //     }
    // })
    User.register({username: req.body.username, active: false}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect('/register')
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        }
    
    });
});
app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('submit');
    } else {
        res.redirect('/login');
    }

});

app.post('/submit', (req, res) => {
    const allSecrets = req.body.secret;
    User.findById(req.user.id, (err, foundUser) => {
        if (err) {
            console.log(err);
            
        } else {
            if (foundUser) {
                foundUser.submittedSecret = allSecrets;
                foundUser.save( () => {
                    res.redirect('secrets');
                })
            }
        }
    })
    
})

app.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
})

app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});