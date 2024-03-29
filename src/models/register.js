//--require all the modules ----------**
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//require a brcypt js.
//we create a schema for defining templates and structure.
const employeeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },

    confirmpassword: {
        type: String,
        required: true,
    },

    Address: {
        type: String,
        required: true,
    },
    City: {
        type: String,
        required: true,
    },

    Zip: {
        type: Number,
        required: true,
    },
    tokens: [{
        token: {
            type: String,
            required: true,
        }
    }]

});
//generating tokens-------------**
employeeSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token: token })
        await this.save();
        return token;
    } catch (err) {
        res.send("the error part" + err);
        console.log(err);
    }
}
//first password chalega agar modified krna hua toh is method se bcrypt js ka use krernge----**.
//converting password into hash----**
employeeSchema.pre("save", async function (next) {

    if (this.isModified("password")) {

        this.password = await bcrypt.hash(this.password, 10);
        this.confirmpassword = await bcrypt.hash(this.password, 10);
    }
    next();
});
//now we need to create a collections
const Register = new mongoose.model("Register", employeeSchema);
module.exports = Register;

