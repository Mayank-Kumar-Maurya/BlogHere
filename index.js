require('dotenv').config();
// console.log(process.env.CLOUD_API_KEY) ;

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const Blog=require("./models/schema.js");
const Review=require("./models/Review.js");

const methodOverride=require("method-override");

const asyncWrap=require("./utils/asyncWrap.js");
const ExpressError=require("./utils/ExpressError.js");
const ejsMate=require("ejs-mate");
const joiSchema=require("./joiSchema.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const User=require("./models/User.js");
const passport = require("passport");
const LocalStrategy=require("passport-local");
const {isLoggedIn, validateBlog, isAuthor, redirectingPath, isReviewOwner, isAdmin}=require("./middleWare.js");
const Photo = require("./models/Photo.js");
const multer  = require('multer');
const {storage}= require("./cloudConfig.js");
const upload = multer({ storage });



app.set("view engine","ejs");
app.path("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);

const MongoURL="mongodb://127.0.0.1:27017/Blogging";
const dburl=process.env.ATLAS_URL;

const store=MongoStore.create({
    mongoUrl:dburl,
    crypto: {
        secret:process.env.SECRET,
    },
    touchAfter: 24 * 60 * 60,
});

store.on("error", (err)=>
{
    console.log("ERROR IN MONGO SESSION", err)
})

const sessionOption={
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expire: Date.now *7*24*60*60*1000, 
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    }
};

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());  //as a middleware
app.use(passport.session()); // so that it remember the sessions

passport.use(new LocalStrategy(User.authenticate()));  //authentication method comes from passport-local-mongoose
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const port=8080;


main().then(()=>
{
    console.log("Connected to mongodb successfully");
}).catch((err)=>
{
    console.log(err);
});

async function main()
{
    // await mongoose.connect(MongoURL);
    await mongoose.connect(dburl);
}

app.use((req,res,next)=>
{
    res.locals.successMsg=req.flash("success");
    res.locals.errMsg=req.flash("error");
    res.locals.currUser=req.user;
    res.locals.Admin=process.env.ADMIN;
    next();
});


// app.get("/demoReview",async(req, res)=>
// {
//     let rating=4;
//     let message="very good";
//     let newReview=new Review({rating,message});
//     newReview.save();
//     res.send("review save");
// });

// home 
app.get("/blogHere",asyncWrap(async(req,res)=>
{
    let backPhoto=await Photo.findOne();
    // console.log("backPhoto",backPhoto);
    let allBlog=await Blog.find().populate("owner");
    res.render("index.ejs",{allBlog,backPhoto});
}));

// new blog
app.get("/blogHere/new",isLoggedIn,(req,res)=>
{
    // console.log(req.user);
   
    res.render("blogs/New.ejs");
});

// photo
app.get("/blogHere/photo", isLoggedIn, isAdmin, (req,res)=>
{
    res.render("blogs/photo.ejs");
});

app.post("/blogHere/photo" ,isLoggedIn, isAdmin, upload.single('image'), asyncWrap(async(req,res)=>
{
        let photoDetails=req.file;
        if(photoDetails)
        {
            let del=await Photo.deleteMany();
            // console.log("delete", del);
        }
        let UploadLink=new Photo(
            {
                image:
                {
                    url:photoDetails.path,
                    filename:photoDetails.filename,
                }
                
            }
        );
        await UploadLink.save();
       
        req.flash("success", "New Image Uploaded Successfully!");
        res.redirect("/blogHere");

}));

// Updating new blog
app.post("/blogHere",isLoggedIn,validateBlog,asyncWrap(async(req,res,next)=>
{
   
        // console.log(req.body);
    let {title,about}=req.body;
    let RegisteredUserId=req.user._id;
        // console.log(RegisteredUserId);
    let newBlog=new Blog({
        title:title,
        about:about,
        owner:RegisteredUserId,
    });
    // console.log(req.user._id);
    // newBlog.owner=req.user._id;
    await newBlog.save();
    // console.log(title);
    req.flash("success","Successfully Posted New Blog");
    res.redirect("/blogHere");  
// } 
}));

// SignUp page
app.get("/blogHere/SignUp", (req,res)=>
    {
        res.render("blogs/SignUp.ejs");
    });

app.post("/blogHere/SignUp", asyncWrap(async(req,res,next)=>
{
   try{
    let {username, email, password}=req.body;
    let newUser=new User({
        email,
        username
    });
    let RegisteredUser= await User.register(newUser, password);
    // console.log(RegisteredUser);
    req.login(RegisteredUser, (err)=>
    {
        if(err)
        {
            req.flash("error", err);
           return next(err);
        }
        req.flash("success", `Welcome to BlogHere`);
        res.redirect("/blogHere");
    })
   
   }
   catch(err)
   {
    req.flash("error" , "A user with the given username is already registered");
    res.redirect("/blogHere/SignUp");
   }
}));

    // LogIn Page
app.get("/blogHere/LogIn", (req, res) => 
{
    res.render("blogs/LogIn.ejs");
});
app.post("/blogHere/LogIn",redirectingPath, 
    passport.authenticate("local", 
    {
        failureRedirect: "/blogHere/LogIn",
        failureFlash: true,
    }),
    (req,res)=>{
        req.flash("success", " Welcome back to BlogHere you are LoggedIn Successfully");
        res.redirect(res.locals.directingPath);
});

// logOut
// app.get("/blogHere/LogOut",(req,res,next)=>  // not using GET req because logout can be send by user manually from url to avoid we use POST
app.post("/blogHere/LogOut",(req,res,next)=>
{
    req.logout((err)=>
    {
        if(err)
        {
            next(err);
        }
        else
        {
            req.flash("success","You are successfully logged Out! ");
            res.redirect("/blogHere");
        }
    })
})

// show
app.get("/blogHere/:id/curr",asyncWrap(async(req,res)=>
{
    // console.log(res.locals.currUser);
    let {id}=req.params;
    let userBlog=await Blog.findOne({_id:id}).populate("owner").populate({path:"review", populate: { path: "author"}});
    // console.log(userBlog);
    if(!userBlog)
    {
        req.flash("error","Blog which you are searching does't exist");
       return res.redirect("/blogHere");
    }
    // console.log(userBlog);
    res.render("blogs/Look.ejs", {userBlog});
}));

// Edit Route page
app.get("/blogHere/:id/edit", isLoggedIn, isAuthor, asyncWrap(async(req,res)=>
{
    let {id}=req.params;
   

    let userBlog=await Blog.findOne({_id:id});  
    
    if(!userBlog)
        {
            req.flash("error","Blog which you are searching does't exist");
            return res.redirect("/blogHere");
        } 
    res.render("blogs/Edit.ejs",{userBlog});
}));

// edit route
app.patch("/blogHere/:id", isLoggedIn,isAuthor,asyncWrap(async(req,res)=>
{
    let {id}=req.params;
    let {title,about}=req.body;
    // console.log(title,about);
    let UpdateBlog=await Blog.findByIdAndUpdate(id,{title:title ,about:about});
    req.flash("success","Successfully Edited the Blog");
    res.redirect(`/blogHere/${id}/curr`);
}));

// delete
app.delete("/blogHere/:id", isLoggedIn, isAuthor, asyncWrap(async(req,res)=>
{
    let {id}=req.params;
    let BlogDelete=await Blog.findByIdAndDelete(id);
    req.flash("success","Successfully Deleted the Blog");
    res.redirect("/blogHere");

}));



// Review
app.post("/blogHere/:id/Review", isLoggedIn, asyncWrap(async(req,res)=>
{
    let {id}= req.params;
    let {rating, message}=req.body;
    // console.log(rating,message);
    let newReview=new Review({rating, message});
    newReview.author=res.locals.currUser;
    // console.log(newReview);
    let postingReview=await Blog.findById(id);
    postingReview.review.push(newReview);
    // console.log(postingReview);
   
    await newReview.save();
    await postingReview.save();
    req.flash("success", "Comment Posted");
    res.redirect(`/blogHere/${id}/curr`);

}));

// review edit
app.get("/blogHere/:id/:mainId/reviewEdit",isLoggedIn, isReviewOwner, asyncWrap(async(req,res)=>
{
    let {id,mainId}=req.params;
    // console.log(id);
    let reviewText=await Review.findById(id);
    // console.log("====>>>>",reviewText);
    res.render("blogs/ReviewEdit.ejs",{reviewText,mainId});
}));
app.patch("/blogHere/:id/:mainId/reviewEdit", isLoggedIn, isReviewOwner, asyncWrap(async(req,res)=>
{
    let {id,mainId}=req.params;
    let {rating, message}=req.body;
    // console.log("hello");
    // console.log(id,rating,message);
    const updateReview=await Review.findByIdAndUpdate(id,{rating:rating,message:message});
    req.flash("success", "Your review has been updated");
    // console.log(updateReview);
    res.redirect(`/blogHere/${mainId}/curr`);
}));

// delete review
app.delete("/blogHere/:id/:mainId/reviewDelete",isLoggedIn, isReviewOwner, asyncWrap(async(req,res)=>
{
    let{id, mainId}=req.params;
    // console.log(id,mainId);
    let review=await Review.findByIdAndDelete(id);
    res.redirect(`/blogHere/${mainId}/curr`);
}));


// demoUser
app.get("/demoUser", async(req,res)=>
{
    let NewUser=new User({
        email: "jaadu1234@gmail.com",
        username: "jaadu",
    });
    let RegisterdUser=await User.register(NewUser, "jaadu@1234");
    res.send(RegisterdUser);
});



app.all("*", (req,res,next)=>
{
    
    next(new ExpressError(404 ,"Page Not Found"));
});

app.use((err,req,res,next)=>
{
   let {status=500, message="some error occured"}=err;
   if(message.substring(0,6)==="Review")
   {
    message=err.errors.message;
   }
   res.status(status).render("Error.ejs", {message});
});


app.listen(port,()=>
{
    console.log(`Successfully connected to port :${port}`);
})