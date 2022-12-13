const mongoose = require ('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//reqquire a brcypt js.
//we create a schema for defining templates and structure.

const EmployeeSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
    },
    firstname:{
      type: String,
      required: true,
    },
    lastname:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
     
    confirmpassword:{
        type:String,
        required: true,
    },
   
    Address:{
        type:String,
        required: true,
    },
    City:{
        type:String,
        required: true,
    },

    Zip:{
        type: Number,
        required: true,
    },
    tokens:[{
         token:{
        type:String,
        required: true,
         }
    }]
    
//    State:{
//         type:String,
//         required: true,
//     },
     
})
//generating tokens
EmployeeSchema.methods.generateAuthToken = async function(){
 try{
    // console.log(this._id);
    const token = jwt.sign({_id:this._id.toString()},"privacykey");
    this.tokens = this.tokens.concat({token})
    await this.save();
    // console.log(token);
    return token;
 }catch(err){
     res.send("the error part" + err);
     console.log("the error part" + err);
 }
}


//first password chalega agar modified krna hua toh is method se bcrypt js ka use krernge.
//converting password into hash,
EmployeeSchema.pre("save", async function (next){
   
   if(this.isModified("password")){
   
    // console.log(`the current password is ${this.password}`);
    this.password = await bcrypt.hash(this.password , 10);
    // console.log(`the hashing password is ${this.password}`);
    this.confirmpassword = await bcrypt.hash(this.password , 10);
   }
    next();
})

//now we need to create a collections

 
const  Host_register = new mongoose.model("Host_register",EmployeeSchema);

 
module.exports = Host_register;
