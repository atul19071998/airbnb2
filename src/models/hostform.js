 //require mongoose----**
const mongoose = require ('mongoose');
 //----we create host schema for saving the data to mongodb database.--------**
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
    PropertyType:{
        type:String,
        required:true
    },
    minimum_nights:{
        type:String,
        
    },
    neighbourhood_overview:{
        type:String,
         
    },
    cancellation_policy:{
        type:String,
         
    },
    Homeurl:{
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
});

//now we need to create a collections
const  hostdata = new mongoose.model("host_data",HostSchema);
module.exports = hostdata;
 
