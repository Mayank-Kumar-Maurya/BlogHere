const joiSchema = require("./joiSchema");
const Blog=require("./models/schema.js");
const ExpressError=require("./utils/ExpressError.js");
const Review=require("./models/Review.js");


const isLoggedIn = (req, res, next) => 
{
    console.log(req.path + "...=>" + req.originalUrl);
    req.session.redirectingPath = req.originalUrl; // we can't use session.redirectingPath directly to logIn route because after login passport delete the previous session and re-initialise it  so we store it in locals we can't be deleted by passport  
    if (!req.isAuthenticated()) 
    {
        req.flash("error", "You must be logged in first");
        return res.redirect("/blogHere/LogIn");
    }
    next();
};

const validateBlog=(req,res,next)=>
    {
        let {error}=joiSchema.validate(req.body);
        // console.log(error);
        if(error)
        {
            let errMsg=error.details[0].message;
            // console.log(errMsg)
            throw new ExpressError(400, errMsg);
        }
        else
        next();
    }

// for checking the authorisation whether it is a correct user or not 
const isAuthor = async (req, res, next) => 
{
    let { id } = req.params;
    let userId = await Blog.findById(id);
    if ((res.locals.currUser._id).equals(userId.owner._id) || (res.locals.currUser._id).equals(process.env.ADMIN)) //"676eb2b766675867c2439d98"
    {
        next();
    }
    else
    {
        req.flash("error", "You Don't have permission to make any changes in this blog");
        return res.redirect(`/blogHere/${id}/curr`);
    }
   
}


// after login redirection which path use previous on
const redirectingPath = (req, res, next) => 
{
    if (req.session.redirectingPath) 
    {
        res.locals.directingPath = req.session.redirectingPath;
    }
    else 
    {
        res.locals.directingPath = "/blogHere";
    }
    next();
}

// reviewOwner check
const isReviewOwner= async (req ,res, next)=>
{
    let {id,mainId}= req.params;
    console.log(id);
    let authorId=await Review.findById(id);
    //   console.log("id=" ,authorId.author._id, "currUser=",res.locals.currUser._id);
    if(((res.locals.currUser._id).equals(authorId.author._id)) || (res.locals.currUser._id).equals(process.env.ADMIN)) //"676eb2b766675867c2439d98"
    {
        next();
    }
    else
    {
        req.flash("error", "You are not the Owner of this Review");
        return res.redirect(`/blogHere/${mainId}/curr`);
    }
    // next(); 
};

const isAdmin= (req,res,next)=>
{ //676eb2b766675867c2439d98
    if(!(res.locals.currUser._id).equals(process.env.ADMIN))
    {
        req.flash("error", "You Don't have permission to make any changes in this content");
        return res.redirect(`/blogHere`);
    }
    next();
}

module.exports={isLoggedIn, validateBlog, isAuthor, redirectingPath, isReviewOwner, isAdmin};