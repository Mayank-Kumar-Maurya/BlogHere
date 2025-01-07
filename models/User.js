const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");

let userSchema=mongoose.Schema({
    email:{
        type: String,
        required:true,
    }
});

userSchema.plugin(passportLocalMongoose); //it will create itself username & salt hashing password 

const User=mongoose.model("User",userSchema);

module.exports=User;