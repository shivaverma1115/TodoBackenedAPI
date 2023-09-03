const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
require("dotenv").config()
const cors = require("cors")

const { UserModel } = require("./models/User.model")
const { TaskModel } = require("./models/Tasks.model")
const { connection } = require("./config/db")
const { authentication } = require("./middleWare/Authentication.middleware")

const app = express()
app.use(express.json())
app.use(cors({
    origin: "*"
}))


app.get("/", (req, res) => {
    res.send({msg:"base API endpoint"})
})

const Contact = process.env.CONTACT
app.get("/contact",(req,res)=>{
    res.send({Number : "this is my Mobile number :- "+ Contact})
})

app.post("/signup", async (req, res) => {
    const { email, password, name, city } = req.body;
    const is_user = await UserModel.findOne({ email: email })
    if (is_user) {
        res.send({ msg: "Email already registered, Try signing in?" })
    }
    bcrypt.hash(password, 3, async function (err, hash) {
        const new_user = new UserModel({
            email,
            password: hash,
            name,
            city
        })
        await new_user.save()
        res.send({ msg: "Sign up successfull" })
    });
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const is_user = await UserModel.findOne({ email })
    if (is_user) {
        const hashed_pwd = is_user.password
        bcrypt.compare(password, hashed_pwd, function (err, result) {
            if (result) {
                const token = jwt.sign({ userID: is_user._id }, process.env.SECRET_KEY)
                res.send({ msg: "Login successfull", token: token })
            }
            else {
                res.send({msg:"Login failed"})
            }
        });
    }
    else {
        res.send({msg:"Sign up first"})
    }
})




app.use(authentication)

app.get("/tasks", async (req, res) => {
    try {
        const tasks = await TaskModel.find({ user_id: req.userID })
        res.send({ tasks })
    }
    catch (err) {
        console.log(err)
        res.send({ msg: "something went wrong, please try again later" })
    }
})


app.post("/tasks/add", async (req, res) => {
    const { title, status, category } = req.body;
    const userID = req.userID
    const new_task = new TaskModel({
        title,
        status,
        category,
        user_id: userID
    })
    try {
        await new_task.save()
        return res.send({ msg: "task successfully added" })
    }
    catch (err) {
        console.log(err)
        res.send({ msg: "something went wrong" })
    }
})


app.delete("/tasks/:taskID", async (req, res) => {
    const { taskID } = req.params
    try {
        const tasks = await TaskModel.findOneAndDelete({ _id: taskID, user_id: req.userID })
        if (tasks) {
            res.send({ msg: "Task deleted successfully" })
        }
        else {
            res.send({ msg: "Task not found or you are not authorised to do this operation" })
        }
    }
    catch (err) {
        console.log(err)
        res.send({ msg: "something went wrong, please try again later" })
    }
})

const port = process.env.PORT

app.listen(port, async () => {
    try {
        await connection
        console.log("connected to db successfully")
    }
    catch (err) {
        console.log("error while connecting to DB")
        console.log(err)
    }
    console.log(`listening on port ${port}`)
})