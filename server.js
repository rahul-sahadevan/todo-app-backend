const express = require("express")
require("dotenv").config()
const mongoose  = require("mongoose")
const { cleanupAndValidate } = require("./utils/authUtil")
const userModal = require("./userModal")

// constants 
const app = express()
const PORT = process.env.PORT || 8000
const URI = process.env.URI

// middleware
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.set("view engine", "ejs")

// db connection
mongoose.connect(URI).
then(()=> console.log("db is connected"))
.catch((error)=> console.log(error))

// api's
app.get("/",(req,res)=>{
    return res.send("server is running")
})

// api for registration 

app.get("/register",(req,res)=>{
    return res.render("register")
})

app.post("/register_user",async(req,res)=>{
    console.log(req.body)
    const {name,email,password} = req.body
    const userObj = new userModal({
        name,
        email,
        password
    })
    const userEmilExist = await userModal.findOne({email})
    console.log(userEmilExist)
    if(userEmilExist){
        return res.send({
            status : 500,
            message : "user email exist !",
            data : userEmilExist
        })
    }
    try{

        const userDb = await userObj.save()
        console.log(userDb)
        await cleanupAndValidate({name,email,password})
        console.log("below prmise")

        return res.send({
            status : 201,
            message : "todo added succesfully",
            data: userDb
        })     
    }
    catch(error){
        console.log(error)
        return res.send({
            status: 500,
            message :" data base error",
            error: error
        })
    }

    

    return res.send("registered succesfully")
})

// api for login the user

app.get("/login",(req,res)=>{
    return res.render("login")
})

app.post("/login_user",(req,res)=>{
    return res.send("login done")
})


app.listen(PORT,()=>{
    console.log("server is running on port 8000")
})