
const mongoose =require("mongoose")
const Schema = mongoose.Schema

const userShema = new Schema({

    name:{
        type:String,
        unique: true,
        require:true
    },
    email : {
        type:String,
        unique:true,
        require:true
    },
    password:{
        type:String,
        require:true
    }
})

module.exports = mongoose.model("Todo",userShema)