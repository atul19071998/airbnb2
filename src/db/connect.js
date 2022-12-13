const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://atulnew:topology@cluster0.yylrcsq.mongodb.net/userdetail?retryWrites=true&w=majority",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
}).then(() =>{
    console.log(`connection is succesfull`);
}).catch((err) =>{
    console.log(err);
})

module.exports =  mongoose;




//"mongodb://0.0.0.0:27017/newdata"