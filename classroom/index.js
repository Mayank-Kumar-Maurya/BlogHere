const ExpressError=require("./ExpressError.js");
const express=require("express");
const app=express();
const path=require("path");
const port=3000;
// const cookieParser=require("cookie-parser");
const session=require("express-session");
const flash=require("connect-flash");


app.set("view engine","ejs");
app.path("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
// app.use(cookieParser("hanumanji"));
app.use(session({ 
    secret: "hanumanji",
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

app.use((req,res,next)=>
{
    res.locals.sucMsg=req.flash("success");
    res.locals.errMsg=req.flash("error");
    next();
});

app.get("/register",(req,res)=>
{
    let {name="topa"}=req.query;
    req.session.name=name;
    if(req.session.name==="topa")
    {
        req.flash("error","Please enter name");
    }
    else
    {
        req.flash("success","name registered successfully");
    }
   

    res.send(name);
});

app.get("/look",(req,res)=>
{
    // console.log(req.flash("success"));
    // res.locals.sucMsg=req.flash("success");
    // res.locals.errMsg=req.flash("error");
    // now using as middlewares
    res.locals.pk=req.session.name;
    res.locals.gk="jaadu";
    res.render("mes.ejs");
});

// app.get("/test",(req,res)=>
// {
//     if(req.session.i)
//     {
//         req.session.i++;
//     }else
//     {
//         req.session.i=1;
//     }
//     res.send(`you send the session ${req.session.i} times`);
// });


// app.get("/cookies",(req,res)=>
// {
//     res.cookie("color","red");
//     res.cookie("country","india");
//     res.cookie("place","Lucknow");
//     res.cookie("Location","Gayatripurm",{signed: true});
//     res.send("cookies send");
// });
// app.get("/seeCookies",(req,res)=>
// {
//     console.dir(req.cookies);
//     console.dir(req.signedCookies);
//     res.send("view console");
// })

// app.get("/", (req,res)=>
// {
//     res.send("hello");
// });
// app.get("/err",(req,res)=>
// {
//     abcd=abcd;
   
// });
// app.get("/access",(req,res)=>
// {
//     throw new ExpressError(401,"access denied");
// });
// app.use((err,req,res,next)=>
// {
//     let {status=500,message="can't get message "}=err;
//     res.status(status).send(message);
// });

app.listen(port, ()=>
{
    console.log(`successfully connected at ${port}`);
});
