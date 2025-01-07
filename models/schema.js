const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const blogSchema=new Schema(
    {
        title:{
            type:String,
            required:true,
        },
        about:{
            type:String,
            required:true,
        },
        date:{
            type: Date,
            default: Date.now,
        },
        // Creating another collection/Table    
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
        },
        review:[
            {
                type:Schema.Types.ObjectId,
                ref:"Review",
            }
        ]
    }
);

const Blog=mongoose.model("Blog", blogSchema);

module.exports=Blog;