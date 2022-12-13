const mongoose = require ('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



const HostSchema = new mongoose.Schema({
    HomeName:{
        type: String,
        required: true,
        unique: true,
    },
    Location:{
      type: String,
      required: true,
    },
    Imageurl:{
        type:String,
    },
    Price:{
        type: Number,
        required: true
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
// HostSchema.methods.generateAuthToken = async function(){
//  try{
//     // console.log(this._id);
//     const token = jwt.sign({_id:this._id.toString()},"privacykey");
//     this.tokens = this.tokens.concat({token})
//     await this.save();
//     // console.log(token);
//     return token;
//  }catch(err){
//      res.send("the error part" + err);
//      console.log("the error part" + err);
//  }
// }


//first password chalega agar modified krna hua toh is method se bcrypt js ka use krernge.
//converting password into hash,
// HostSchema.pre("save", async function (next){
   
//    if(this.isModified("password")){
   
//     // console.log(`the current password is ${this.password}`);
//     this.password = await bcrypt.hash(this.password , 10);
//     // console.log(`the hashing password is ${this.password}`);
//     this.confirmpassword = await bcrypt.hash(this.password , 10);
//    }
//     next();
// })

//now we need to create a collections

const  hostdata = new mongoose.model("host_data",HostSchema);
 

module.exports = hostdata;
 
