const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    name:{
        type:String
    },
    active:{
        type:Boolean,
        default: false
    }
})


module.exports = mongoose.model('User',userSchema)