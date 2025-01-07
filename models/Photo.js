const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const themePhoto=new Schema(
    {
        image:{
            url:String,
            filename:String,
        },
       
    }

);

const Photo=mongoose.model("Photo", themePhoto);

module.exports=Photo;