const express = require("express")
require("dotenv").config()
const mongoose  = require("mongoose")
const cleanupAndValidate = require("./utils/authUtil")
const userModal = require("./userModal")
const bcrypt = require("bcrypt")
const validator = require("validator")
const isAuth = require("./middlewares/isAuth")
const todoModel = require("./models/todoModels")


const session = require("express-session")
const mongoDb = require("connect-mongodb-session")(session)

// constants 
const app = express()
const PORT = process.env.PORT || 8000
const URI = process.env.URI
const secret = process.env.secrete

console.log(secret)

// store for session

const store  = new mongoDb({
    uri:URI ,
    collection:"sessions"
})


// middleware
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.set("view engine", "ejs")
app.use(session({
    secret:secret,
    resave:false,
    saveUninitialized:false,
    store:store
}))

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

app.post("/register_user", async (req, res) => {
    console.log(req.body)
    const { name, email, password } = req.body

    try {
        // Validate first
        await cleanupAndValidate({ name, email, password })

        const hashPassword = await bcrypt.hash(password, Number(process.env.SALT))
        console.log(password, hashPassword)

        const userEmailExist = await userModal.findOne({ email })
        console.log(userEmailExist)

        if (userEmailExist) {
            return res.send({
                status: 500,
                message: "user email exist !",
                data: userEmailExist
            })
        }

        const userObj = new userModal({
            name,
            email,
            password: hashPassword
        })

        const userDb = await userObj.save()
        console.log(userDb)

        return res.redirect("/login")

    } catch (error) {
        console.log(error)
        return res.send({
            status: 500,
            message: "data base error",
            error: error.message
        })
    }
})
// api for login the user

app.get("/login",(req,res)=>{
    return res.render("login")
})

app.post("/login_user",async(req,res)=>{
    const {email,password} = req.body
    console.log(email,password)
    const userDb = await userModal.findOne({email})
    console.log(userDb,"userDb")
    if(!validator.isEmail(email)){
        if(!userDb){
            return res.send({
                status: 400,
                messsage: "email is not matching"
            })
        }
    }

    const isMatched = await bcrypt.compare(password,userDb.password)
    console.log(password,userDb.password,isMatched)

    if(!isMatched){
        return res.send({
            status: 400,
            message: "passowrd is not matching"
        })
    }

    console.log(req.session)
    req.session.isAuth = true
    req.session.user = {
        email:email,
    }


    
    return res.redirect("/dashboard")
})

app.get('/dashboard',(req,res)=>{
    return res.render("dashboard")
})

// logout

app.post("/logout",isAuth,(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.log(err)
            return res.send({
                status: 500,
                message:"database error",
                error: err
            })
        }

        return res.redirect("/login")
    })
})

app.post("/logout_fromAll",isAuth,async(req,res)=>{

    const email = req.session.user.email

    const sessionSchema = new mongoose.Schema({_id: String},{strict:false})
    const sessionModel = mongoose.model("session",sessionSchema)

    try{

        const dbMany =  await sessionModel.deleteMany({
            "session.user.email" : email
        })

        return res.send({
            status: 200,
            message: "logout from all device success",
            data: dbMany
        })



    }
    catch(error){
        return res.send({
            status: 500,
            message:"data base error",
            error: error
        })
    }

})


app.post("/create-todo",isAuth,async(req,res)=>{

    const todo = req.body.todo
    const email = req.session.user.email

    console.log(todo,email)

    if(!todo){
        return res.send({
            status:400,
            message:"tddo is missing"
        })
    }
    else if(typeof todo !== "string"){
        return res.send({
            status: 400,
            message: "todo should be a string"
        })
    }
    else if(todo.length < 3 || todo.length > 100){
        return res.send({
            status: 400,
            message:"todo length should be 3-100"
        })
    }

    try{
        const todoObj = new todoModel({
            todo,
            email
        })

        const todoDb = await todoObj.save()
        console.log(todoDb)
        res.send({
            status: 201,
            message:"todo added successfuly!",
        })

    }
    catch(error){
        return res.send({
            status:500,
            message:"data base error",
            error:error
        })
    }

    
    return res.send("todo added")
})

app.post("/edit-item",isAuth,async(req,res)=>{
    const {id,newData} = req.body
    const email = req.session.user.email
    console.log(id,newData)

    try{

        const todoDb = await todoModel.findOne({_id : id})
        console.log(todoDb)

        if(todoDb.email !== email){
            return res.send({
                status: 403,
                message:"authorisation failed"
            })
        }

        const prevTodo = await todoModel.findOneAndUpdate({_id:id},{todo:newData})
        return res.send({
            status:201,
            message:"todo is updated",
            prevData:prevTodo
        })

    }
    catch(error){

        return res.send({
            status: 500,
            message: "database error"
        })

    }
})

app.post("/delete-item",isAuth,async(req,res)=>{

    const {id} = req.body
    const email = req.session.user.email

    if(!id){
        return res.send({
            status:400,
            message:"credetials is missing"
        })
    }

    try{

        const todoDb = await todoModel.findOne({_id:id})

        console.log(todoDb)
        if(todoDb.email !== email){
            return res.send({
                status:403,
                message:"user authentication failed"
            })
        }

        const deleteDb = await todoModel.findOneAndDelete({_id:id})
        return res.send({
            status:200,
            message:"deletion is succefull",
            data:deleteDb
        })

    }
    catch(error){
        return res.send({
            status:500,
            message:"data base error"
        })
    }
})

app.listen(PORT,()=>{
    console.log("server is running on port 8000")
})