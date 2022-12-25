//require jwt token and register here  ** //
const jwt = require("jsonwebtoken");
const Register = require("../models/register");
//authentication for verifying the user by using token ** //
const auth = async (req , res, next) =>{
try{
  const token = req.cookies.jwt;
  const verifyUser = jwt.verify(token,process.env.SECRET_KEY);
  const user = Register.findOne({_id:verifyUser._id});
  // console.log(user.firstname);
  req.token = token;
  req.user = user;
  next();
}
catch(error){
res.status(401).send(error);
}
};

module.exports = auth;