//require all modules.
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const ejs = require('ejs');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");
const bodyParser = require('body-parser');

const port = process.env.PORT || 4000;


const conn = require("./db/connect");

const Register = require("./models/register");
const Admin_Register = require("./models/Host_register");
const Host_Register = require("./models/Hostform");

app.set('views', path.join(__dirname, '../templates/views'));
const template_path = path.join(__dirname, "../templates/views");
// const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set("view engine", "ejs"); //set view engine
app.set("views", template_path);
// ejs.registerPartials(partials_path);
//  console.log(process.env.SECRET_KEY);


//session flash
app.use(session({
  secret: 'flashblog',
  saveUninitialized: true,
  resave: true
}));
app.use(flash());
app.use(function (req, res, next) {
  res.locals.message = req.flash();
  next();
});

// app.get('/', (req, res) => {
//   req.flash('success', 'Welcome!!');
//   res.redirect('/display-message');
// });

// app.get('/display-message', (req, res) => {
//   res.render("display");
// });

 
//Database code access code from mongoatlas
const { MongoClient } = require('mongodb');
async function FindData() {
  const uri = "mongodb+srv://atulnew:topology@cluster0.yylrcsq.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  await client.connect();

  var result = await client.db("sample_airbnb").collection("listingsAndReviews").find({ "property_type": "House" }).limit(52).toArray();


  return result
}

//another function to find the id to fetch data off details page.
async function FindData1(id) {
  // console.log("find data"+ _id);
  const uri = "mongodb+srv://atulnew:topology@cluster0.yylrcsq.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  await client.connect();

  var result = await client.db("sample_airbnb").collection("listingsAndReviews").findOne({ _id: id });
  // console.log(result);

  return result

}

// async function FindData2(id) {
//   // console.log("find data"+ _id);
//   const uri= "mongodb+srv://atulnew:topology@cluster0.yylrcsq.mongodb.net/?retryWrites=true&w=majority";
//   const client = new MongoClient(uri);

//   await client.connect();

//   var result = await client.db("userdetail").collection("host_datas").findOne({_id:id});
//   // console.log(result);

//   return result

// };
//for render a details pages
app.get('/details/:id', auth, async (req, res) => {



  let data = await FindData1(req.params.id);
  //  console.log(data);
  res.render('details', {
    data: data,
    // data1:data1
  });


});
//for set of logout route
app.get("/logout", async (req, res) => {
  try {


    res.clearCookie("jwt");
    console.log("logout succesfully");

    res.redirect("/");
  } catch (error) {
    res.status(500).send(error);
  }
})
//for home route
app.get('/', async (req, res) => {





  let data = await FindData()
  // let data1 = await FindData2();
  // console.log(data);
  res.render('index', {
    data: data,
    //  data1:data1
  });


});

app.get('/display-message', (req, res) => {
    res.send(req.flash('message'));
});


//for register the form by using a scheema and token generate by using jwtwebtoken.
app.post('/register', async (req, res) => {
  // const firstname = req.body.fname;
  //  console.log(firstname);

  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;



    if (password === cpassword) {
      const registerEmployee = Register({
        email: req.body.email,
        firstname: req.body.fname,
        lastname: req.body.lname,
        password: password,
        confirmpassword: cpassword,
        Address: req.body.address,
        City: req.body.city,
        // State: req.body.state,
        Zip: req.body.zip

      })
      //  console.log("the success part" + registerEmployee);
      const token = await registerEmployee.generateAuthToken();
      //  console.log("the token part" + token);

      //passworde hash
      res.cookie("jwt", token);
      console.log(cookie);

      const registered = await registerEmployee.save();
      // console.log("the page part" + registered);
      res.status(201).redirect('/');


    } else {
      res.send("password are not matching");
    }

  } catch (err) {
    res.status(400).send(err);
    console.log("the error part page");
  }
});

//for login route
app.get('/login', (req, res) => {
  res.render("login");

});
//for read form of login data and compare the information ,generating token,authenciation,add middleware.
app.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;


    const useremail = await Register.findOne({ email: email });

    //if we want to login then first match the passwords and email.ny using bcrypt.js
    const isMatch = await bcrypt.compare(password, useremail.password);

    //add middlewware and add token.
    const token = await useremail.generateAuthToken();
    // console.log("the token part" + token);
    //cookie authenciation
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 900000),
      httpOnly: true,
      //secure:true
    });
    
      
    // console.log(`this is the cookie awesome ${req.cookies.jwt}`);

    //  if(useremail.password === password){
    if (isMatch) {
      //flash message
      //  req.flash('message', 'Welcome to Blog');
      //  res.redirect('/display-message');
     
  
  res.redirect("/");

    } else {
      res.send("Invalid login Details");
    }
    //  console.log(useremail.password);
    //  console.log(`${email}and the password is: ${password} `)
  } catch (err) {
    res.status(400).send("Invalid login Details");
  }
});

//for signup route
app.get('/signup', (req, res) => {
  res.render('signup');
});
//for helppage route.
app.get('/help', (req, res) => {
  res.render('help');
});
//for regisetred and check all the value ,generate token ,authenciation cookie generation,
app.post('/register', async (req, res) => {
  const firstname = req.body.fname;
  //  console.log(firstname);

  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;



    if (password === cpassword) {
      const registerEmployee = new Register({
        email: req.body.email,
        firstname: req.body.fname,
        lastname: req.body.lname,
        password: password,
        confirmpassword: cpassword,
        Address: req.body.address,
        City: req.body.city,
        // State: req.body.state,
        Zip: req.body.zip

      })
      //  console.log("the success part" + registerEmployee);
      const token = await registerEmployee.generateAuthToken();
      //  console.log("the token part" + token);

      //new gebnerate cookie
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 3000),
        httpOnly: true

      });

      console.log(cookie);
      //passworde hash

      const registered = await registerEmployee.save();
      // console.log("the page part" + registered);
      res.redirect('/');


    } else {
      res.send("password are not matching");
    }

  } catch (err) {
    res.status(400).send(err);
    console.log(err);
  }
});
//using of bcrypt for match the password authenticate.
// const  bcrypt = require("bcryptjs");
const securePassword = async (password) => {
  console.log(password);
  const passwordhash = await bcrypt.hash(password, 10)
  console.log(passwordhash);


  const passwordmatch = await bcrypt.hash(password, 10)
  console.log(passwordmatch);
};

// securePassword("atul@123");
//host property is started here.
app.get('/host', (req, res) => {
  res.render("host");
});
//host login
app.get('/host_login', (req, res) => {
  res.render("host_login");
});
app.get('/host_exp', (req, res) => {
  res.render("host_exp");
});
//host signup 
app.get('/host_signup', (req, res) => {
  res.render("host_signup");
});

//host 
app.post('/Host_register', async (req, res) => {
  const Firstname = req.body.fname;
  //  console.log(firstname);

  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;



    if (password === cpassword) {
      const Host_registerEmployee = new Admin_Register({
        email: req.body.email,
        firstname: req.body.fname,
        lastname: req.body.lname,
        password: password,
        confirmpassword: cpassword,
        Address: req.body.address,
        City: req.body.city,
        // State: req.body.state,
        Zip: req.body.zip

      })
      //  console.log("the success part" + registerEmployee);
      const token = await Host_registerEmployee.generateAuthToken();
      //  console.log("the token part" + token);
      //passworde hash

      const registered = await Host_registerEmployee.save();
      // console.log("the page part" + registered);
      res.redirect('/');


    } else {
      res.send("password are not matching");
    }

  } catch (err) {
    res.status(400).send(err);
    console.log(err);
  }
});
// const  bcrypt = require("bcryptjs");
const Securepassword = async (password) => {
  console.log(password);
  const passwordhash = await bcrypt.hash(password, 10)
  console.log(passwordhash);


  const passwordmatch = await bcrypt.hash(password, 10)
  console.log(passwordmatch);
};

app.post('/hostlogin', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;


    const useremail = await Admin_Register.findOne({ email: email });

    //if we want to login then first match the passwords and email.ny using bcrypt.js
    const isMatch = await bcrypt.compare(password, useremail.password);

    //add middlewware and add token.
    const token = await useremail.generateAuthToken();
    // console.log("the token part" + token);

    //  if(useremail.password === password){
    if (isMatch) {
      res.redirect("/host_exp");
    } else {
      res.send("Invalid login Details");
    }
    //  console.log(useremail.password);
    //  console.log(`${email}and the password is: ${password} `)
  } catch (err) {
    res.status(400).send("Invalid login Details");
  }
});


app.post('/hostinform', async (req, res) => {

  const HostSchema = new Host_Register({
    HomeName: req.body.hname,
    Location: req.body.location,
    Imageurl: req.body.Imageurl,
    Price: req.body.price,

  });
  console.log(HostSchema);
  const registered = await HostSchema.save();
  // console.log("the page part" + registered);
  res.redirect('/');


});

//jsonwebtoken.. creating a token
const createToken = async () => {

  const token = await jwt.sign({ _id: "638ccfab50b8ea7e2482af0b" }, "SECRET_KEY", {
    expiresIn: "2seconds"
  });
  //  console.log(token);

  const userVer = await jwt.verify(token, "SECRET_KEY");
  //  console.log(userVer);

}
createToken();
app.listen(port, () => {

  console.log(`server is listen on port ${port}`);
});
