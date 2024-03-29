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
const auth = require("./src/middleware/auth");
const bodyParser = require('body-parser');
//--require PORT and also set environment variable------------**
const PORT = process.env.PORT || 3000;
//--------------for database connect------------------------***
const conn = require("./src/db/connect");

const Register = require("./src/models/register");
const Admin_Register = require("./src/models/host_register");
const Host_Register = require("./src/models/hostform");

app.set('views', path.join(__dirname, './templates/views'));
const template_path = path.join(__dirname, "./templates/views");
 //------------use of cookieparser,set view engine ejs------------------------**
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set("view engine", "ejs"); //set view engine
app.set("views", template_path);
 
//init session flash
app.use(session({
  secret:  process.env.SESSION_SECRET_KEY,
  saveUninitialized: true,
  resave:false,
  cookie :{
    //secure:true,
    httpOnly : true,
  }
}));
 app.use(flash());
 //-------------------for displaying flash -messages----------------------**
 app.use((req,res,next) =>{
  // res.locals.message = req.session.message;
  res.locals.success = req.flash('success');
  res.locals.info = req.flash('info');
  res.locals.danger = req.flash('danger');
  res.locals.warning = req.flash('warning');
  res.locals.primary = req.flash('primary');
  // delete req.session.message;
  next();
 })
 
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
  const uri = "mongodb+srv://atulnew:topology@cluster0.yylrcsq.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  await client.connect();

  var result2 = await client.db("userdetail").collection("host_datas").findOne({HomeName});
  return result2
}
 
//--------------for render a details pages------------------------------------------------**
app.get('/details/:id',auth, async (req, res) => {
      
  let data = await FindData1(req.params.id);
 
  res.render('details', {
    data: data,
  });
  
});
 //--------------for render ahost_ details pages-------------------------------**
  app.get('/host_details/:HomeName',  auth, async (req, res) => {
  let hub = (req.params.HomeName);
    let data1 = await FindData3(hub); 

    res.render('host_details', {
      data1: data1
    });
});

//-------------for set of logout route--------------------------------------------**
app.get("/logout", async (req, res) => {
  try {
    req.flash('success','User Logout Succesfully!!');
    res.clearCookie("jwt");
    res.redirect("/");
  } catch (error) {
    res.status(500).send(error);
  }
})
//----------------for home route------------------------------------------------**
app.get('/' , async (req, res) => {
  let data = await FindData();
  let data1 = await FindData2();
  let x = req.cookies.jwt;
  res.render('index', {
    data: data,
    data1:data1,
    x:x, 
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
       //-----------for register the data and generate token------------**
      const token = await registerEmployee.generateAuthToken();
      //passworde hash
      res.cookie("jwt", token);//cookie generate by using jwt----**
      // console.log(cookie);
      const registered = await registerEmployee.save();
      req.flash("primary","Congratulations your SignUp Successfully!!");
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
app.post('/login',  async(req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const useremail = await Register.findOne({ email: email });

    //------if we want to login then first match the passwords and email.ny using bcrypt.js------------**
    const isMatch = await bcrypt.compare(password, useremail.password);
    //----------add middlewware and add token.---------**
    const token = await useremail.generateAuthToken();
    //-------cookie authenciation----------**
  
    if (isMatch) {
      //flash message
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 600000),
        httpOnly: true,
        //secure:true:heart_eyes:
      });
      req.flash("success","User LoggedIn Succesfully !!");
      res.redirect('/');
    } else {
      // res.send("Password is not matching.");
      req.flash('success','User Password Not Match Please Try again!!!');
      res.redirect('/');
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
app.get('/edit', (req, res) => {
  res.render("edit");
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
        expires: new Date(Date.now() + 30000),
        httpOnly: true
      });
      //-----passworde hash-------**
      const registered = await registerEmployee.save();
      // res.redirect('/');
      if(registered !== ""){
        req.flash("success","User Registered and LoggedIn successfully..");
        res.redirect('/');
      }
    } else {
      req.flash("error","password not matching ");
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
//------host_exp routes -----------**
app.get('/host_exp', (req, res) => {
  res.render("host_exp");
});
 
//--host signup route-------------------** 
app.get('/host_signup', (req, res) => {
  res.render("host_signup");
});

//------------perform crud operations--------------------------**
app.get('/crud', async (req, res) => {
  let data1 = await FindData2();
  // console.log(data1);
  res.render('crud', {
    data1:data1,
  });
  
});
//-----------------------edit and update route  by crud operations--------------------**
app.get("/edit/:id",async(req,res) =>{
  let id = req.params.id;
  // console.log(id);
  Host_Register.findById(id,(err,data1) =>{
    if(err) {
      
      res.redirect("/crud");
    }else{
      if(data1 == null){
         
        res.redirect("/crud");
      }else{
        res.render("edituser",{
          title:'Edit User',
          data1:data1,
        });
      }
    }
  })
});
//-----------------update by post route------------------------------**
app.post('/hostinform/:id',async(req,res) =>{
  let id = req.params.id;
 await Host_Register.findOneAndUpdate({_id:id},{
    HomeName: req.body.hname,
    Location: req.body.location,
    PropertyType: req.body.ptype,
    Homeurl: req.body.Imageurl,
    minimum_nights: req.body.mnights,
    neighbourhood_overview: req.body.overview,
    cancellation_policy:req.body.policy,
    Price: req.body.price,
  })
  if (id != id) {
    console.log(err);
} else {
    req.flash('primary','User Updated Successfully!!')
    res.redirect('/crud');
}
       
  }); 
//-----------------------deleted by crud operations-------**
 app.get('/delete/:id',(req,res) =>{
  let id = req.params.id;
  Host_Register.findByIdAndRemove(id, function (err) {
      if (err) {
          console.log(err);
      } else {
        
           req.flash('primary','Deleted data Successfully!!');
          res.redirect("/crud");
      }
  })
 });

//----------hostregister route -----------------------------------**
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
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 600000),
        httpOnly: true,
        //secure:true
      });
      req.flash('success','Hi, Everyone Welcome to Host Admin System... 🙌😄');
      res.redirect("/crud");
    } else {
      req.flash('primary','Password Not Match Please Try Again!! ');
      res.redirect('/host_login')
      // res.send("Invalid login Details");
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
   if(registered != ''){
    req.flash('success','User Data Added Succesfully!');
    res.redirect('/crud');
  }else{
    res.redirect('/');
  }
 
});

//--jsonwebtoken.. creating a token----**
const createToken = async () => {
  const token = await jwt.sign({ _id: "638ccfab50b8ea7e2482af0b" }, "SECRET_KEY", {
    expiresIn: "6seconds"
  });
 
  const userVer =  await jwt.verify(token, "SECRET_KEY");
}
createToken();
app.listen(PORT, () => {

  console.log(`server is listen on PORT ${PORT}`);
});
//---------------------------------code ends here-----------------------------------**

 
