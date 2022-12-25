//---------------require all modules-----------------------------------------------**
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
//--require port and also set environment variable------------**
const port = process.env.PORT || 3000;
//--------------for database connect----------------------**
const conn = require("./db/connect");

const Register = require("./models/register");
const Admin_Register = require("./models/Host_register");
const Host_Register = require("./models/Hostform");

app.set('views', path.join(__dirname, '../templates/views'));
const template_path = path.join(__dirname, "../templates/views");
 //------------use of cookieparser,set view engine ejs------------------------**
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set("view engine", "ejs"); //set view engine
app.set("views", template_path);
// ejs.registerPartials(partials_path);
//  console.log(process.env.SECRET_KEY);


//init session flash
app.use(session({
  secret:  process.env.SESSION_SECRET_KEY,
  saveUninitialized: false,
  resave:false,
  cookie :{
    //secure:true,
    httpOnly : true,
  }
}));
app.use(flash());
app.use(function(req, res, next){
  res.locals.message = req.flash();
  next();
});
 
// app.get('/', (req, res) => {
//   req.flash('success', 'Welcome!!');
//   res.redirect('/flash-message');
// });
 
app.get('/flash-message', (req, res) => {
  res.render("flash");
});

 
//--------------------Database code access code from mongodb database----------------------**
const { MongoClient, ObjectId } = require('mongodb');
async function FindData() {
  //-----------------------mongodb uri connection-----------------------**
  const uri = "mongodb+srv://atulnew:topology@cluster0.yylrcsq.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  await client.connect();

  var result = await client.db("sample_airbnb").collection("listingsAndReviews").find({ "property_type": "House" }).limit(16).toArray();


  return result
}

//-----------------------another function to find the id to fetch data off details page from mongodb-------**
async function FindData1(id) {
  //-----------------------mongodb uri connection-----------------------**
  const uri = "mongodb+srv://atulnew:topology@cluster0.yylrcsq.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  await client.connect();
  var result = await client.db("sample_airbnb").collection("listingsAndReviews").findOne({ _id: id });
  // console.log(result);
  return result
}


 //--------------------Database  access code from mongodb database of host data ----------------------**
async function FindData2(){
  //-----------------------mongodb uri connection-----------------------**
  const uri= "mongodb+srv://atulnew:topology@cluster0.yylrcsq.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  await client.connect();
  
  var result1 = await client.db("userdetail").collection("host_datas").find().toArray();
  // console.log(result1);
  return result1
};
//-----------------------another function to find the homename  to fetch data off host_details page from mongodb-------**
async function FindData3(HomeName) {
  //-----------------------mongodb uri connection-----------------------**
  const uri = "mongodb+srv://atulnew:topology@cluster0.yylrcsq.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  await client.connect();

  var result2 = await client.db("userdetail").collection("host_datas").findOne({HomeName});
  return result2
}
 
//--------------for render a details pages------------------------------------------------**
app.get('/details/:id',   async (req, res) => {
      
  let data = await FindData1(req.params.id);
  res.render('details', {
    data: data,
  });
  
});
 //--------------for render ahost_ details pages------------------------------------------------**
  app.get('/host_details/:HomeName',   async (req, res) => {
  let hub = (req.params.HomeName);
    let data1 = await FindData3(hub); 

    res.render('host_details', {
      data1: data1
    });
});

//-------------for set of logout route--------------------------------------------**
app.get("/logout", async (req, res) => {
  try {
    res.clearCookie("jwt");
    // console.log("logout succesfully");
    req.flash("success","User loggedout succesfully");
    res.redirect('/flash-message');
    // const message = req.flash()
    // // res.redirect("/");
  } catch (error) {
    res.status(500).send(error);
  }
})
//----------------for home route-------------------------------------------------------------------------**
app.get('/' , async (req, res) => {
  let data = await FindData();
  let data1 = await FindData2();
  res.render('index', {
    data: data,
    data1:data1,
   
     
  });

});

 
 


//---------------for register the form by using a scheema and token generate by using jwtwebtoken.---------**
app.post('/register', async (req, res) => {

  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;
//-------match the password with current passwords------------**
    if (password === cpassword) {
      const registerEmployee = Register({
        email: req.body.email,
        firstname: req.body.fname,
        lastname: req.body.lname,
        password: password,
        confirmpassword: cpassword,
        Address: req.body.address,
        City: req.body.city,
        Zip: req.body.zip

      })
       //for register the data and generate token------------**
      const token = await registerEmployee.generateAuthToken();
      //passworde hash
      res.cookie("jwt", token);//cookie generate by using jwt----**
      // console.log(cookie);
      const registered = await registerEmployee.save();
      res.status(201).redirect('/');
    }
     else {
      res.send("password are not matching");
    }
  }
   catch (err) {
    res.status(400).send(err);
    // console.log(err);
  }
});

//------------------------for login route----------------------------------**
app.get('/login', (req, res) => {
  res.render("login");

});
//---------------------for read form of login data and compare the information ,generating token,authenciation,add middleware---------------------------------------**
app.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const useremail = await Register.findOne({ email: email });

    //------if we want to login then first match the passwords and email.ny using bcrypt.js------------**
    const isMatch = await bcrypt.compare(password, useremail.password);
    //----------add middlewware and add token.---------**
    const token = await useremail.generateAuthToken();
    //-------cookie authenciation----------**
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 900000),
      httpOnly: true,
      //secure:true
    });
    
    //  if(useremail.password === password){
    if (isMatch) {
      //flash message
      req.flash("success","User registered and loggedin succesfully");
    //  res.redirect('/flash-message');
      // req.flash('success', 'Welcome!!');
      res.redirect('/');
 
      // console.log("login success");
     
    } else {
      // res.send("Invalid login Details");
      // req.flash("error","Email already registered please login");
      // res.render('/flash-message');
      res.send("Password is not matching.");
    }
  } catch (err) {
    // res.status(400).send("Invalid login Details");
    res.status(400).send(err);
  }
});

//-------------for signup route-------------**
app.get('/signup', (req, res) => {
  res.render('signup');
});
//------for helppage route.--------------------**
app.get('/help', (req, res) => {
  res.render('help');
});
//-------for regisetred and check all the value ,generate token ,authenciation cookie generation--------**
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
        Zip: req.body.zip
      });

      const token = await registerEmployee.generateAuthToken();
      //  console.log("the token part" + token);
       res.redirect('/');
      //--new generate cookie-----------**
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 3000),
        httpOnly: true
      });
      //-----passworde hash-------**
      const registered = await registerEmployee.save();
      // res.redirect('/');
      console.log(registered);
      if(registered !== ""){
        req.flash("success","User registered and loggedin succesfully");
        res.redirect('/');
      }
    } else {
      // res.send("password are not matching");
      req.flash("error","password not matching ");
      res.render('/flash-message');
      res.send("Password is not matching");
    }

  } catch (err) {
    req.flash("error","email already registered please login");
    res.redirect('/');
  }
});
//--------using of bcrypt for match the password authenticate------------**.
const securePassword = async (password) => {
  console.log(password);
  const passwordhash = await bcrypt.hash(password, 10)
  console.log(passwordhash);

  const passwordmatch = await bcrypt.hash(password, 10)
  console.log(passwordmatch);
};

//---host route is started here------------------**.
app.get('/host', (req, res) => {
  res.render("host");
});
//-------host login route--------**
app.get('/host_login', (req, res) => {
  res.render("host_login");
});
//------host_xp routes -----------**
app.get('/host_exp', (req, res) => {
  res.render("host_exp");
});
//--host signup-------------------** 
app.get('/host_signup', (req, res) => {
  res.render("host_signup");
});

//----------hostregister route 
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
        Zip: req.body.zip

      })
      const token = await Host_registerEmployee.generateAuthToken();
      //  console.log("the token part" + token);
      //passworde hash
      const registered = await Host_registerEmployee.save();
      // console.log("the page part" + registered);
      res.redirect('/');
    } 
    else {
      res.send("password are not matching");
    }

  } catch (err) {
    res.status(400).send(err);
    console.log(err);
  }
});
 
const Securepassword = async (password) => {
  console.log(password);
  const passwordhash = await bcrypt.hash(password, 10)
  console.log(passwordhash);


  const passwordmatch = await bcrypt.hash(password, 10)
  console.log(passwordmatch);
};

//-----------for register hostlogin------------**
app.post('/hostlogin', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const useremail = await Admin_Register.findOne({ email: email });
    //---------if we want to login then first match the passwords and email.ny using bcrypt.js
    const isMatch = await bcrypt.compare(password, useremail.password);
    //add middlewware and add token.
    const token = await useremail.generateAuthToken();
    // console.log("the token part" + token);
    if (isMatch) {
      res.redirect("/host_exp");
    } else {
      res.send("Invalid login Details");
    }
   
  } catch (err) {
    res.status(400).send("Invalid login Details");
  }
});

//----------for host inform data register----------**
app.post('/hostinform', async (req, res) => {

  const HostSchema = new Host_Register({
    HomeName: req.body.hname,
    Location: req.body.location,
    PropertyType: req.body.ptype,
    Homeurl: req.body.Imageurl,
    minimum_nights: req.body.mnights,
    neighbourhood_overview: req.body.overview,
    cancellation_policy:req.body.policy,
    Price: req.body.price,
    
  });
  const registered = await HostSchema.save();
  res.redirect('/');
});

//--jsonwebtoken.. creating a token----**
const createToken = async () => {
  const token = await jwt.sign({ _id: "638ccfab50b8ea7e2482af0b" }, "SECRET_KEY", {
    expiresIn: "2seconds"
  });
  //  console.log(token);

  const userVer =  await jwt.verify(token, "SECRET_KEY");
  //  console.log(userVer);

}
createToken();
app.listen(port, () => {

  console.log(`server is listen on port ${port}`);
});
//---------------------------------code ends here-----------------------------------**

 
