//------------------require modules- mongoose,bcrypt and jwt ---------------**
const mongoose = require ('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//we create a Schema for defining templates and structure.
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
    
});
//-------------generating tokens--------------------**
EmployeeSchema.methods.generateAuthToken = async function(){
 try{
    const token = jwt.sign({_id:this._id.toString()},"privacykey");
    this.tokens = this.tokens.concat({token})
    await this.save();
    return token;
 }
 catch(err){
     res.send("the error part" + err);
    //  console.log("the error part" + err);
 }
};
//-----first password insert if want to modified then method se bcrypt js --------------**
//converting password into hash------------------------**
EmployeeSchema.pre("save", async function (next){
   if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password , 10);
    this.confirmpassword = await bcrypt.hash(this.password , 10);
   }
    next();
});
//now we need to create a collections
const  Host_register = new mongoose.model("Host_register",EmployeeSchema);
//--export module ---**
module.exports = Host_register;
