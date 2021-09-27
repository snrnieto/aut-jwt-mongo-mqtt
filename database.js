const mongoose = require("mongoose");


const url = 'mongodb://127.0.0.1:27017/app';
mongoose.connect(url).then(() => {
    console.log("Connected to database")
}).catch((err) => {
    console.log('Error connecting to database '+err)
})