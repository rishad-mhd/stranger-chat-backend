const { default: mongoose } = require("mongoose");

function connectMongo() {
    mongoose.connect(process.env.MONGO_URI)
        .then((res) => {
            console.log("Database Connected");
        }).catch(e => console.log(e))
}

module.exports = connectMongo