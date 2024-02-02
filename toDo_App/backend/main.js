//imports
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

//intializations
const app = express();
app.use(express.json());

const secretKey = 'Your-Secert-key here'

function verifyToken(req, res, next) {
    const token = req.headers.authorization;
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            console.error("Token invalid or denied usage");
            return res.status(401).json({ message: 'Unauthorized' });
        } else {
            next();
        }
    });
}
// connect DB
mongoose.connect('MongoDB connection URL')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));
//schema and model for todoList
const todoListSchema = new mongoose.Schema({
    title: String,
    desc: String
});
const list = mongoose.model('todoList', todoListSchema);

 // schema and model for users
const usersSchema = new mongoose.Schema({
    username:{
        type:String,
    },
    password:{
        type:String,
    }
})
const users = mongoose.model('todoUsers', usersSchema)



//route to signup
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const obj = {
        userName: username,
        password: password
    }
    try {
        const newUsers = new users(obj)
        await newUsers.save();
        const signed = jwt.sign({ userId: newUsers._id }, secretKey)
        res.status(200).json({
            key: signed
        })
    } catch (err) {
        console.error(err);
        res.status(400).json({
            msg: "user signup failed"
        })
    }
})


//route to add Users
app.post('/add',verifyToken, async (req, res) => {
    try {
        const { title, desc } = req.body;
        const newItem = new list({ title, desc });
        await newItem.save();
        res.status(200).json({ msg: "saved successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET route to retrieve all items
app.get('/getall',verifyToken, async (req, res) => {
    try {
        const users = await list.find();
        const titlesAndDescs = users.map(user => ({
            title: user.title,
            desc: user.desc,
            todo_id: user._id
        }));
        res.status(200).json(titlesAndDescs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE route to delete an item
app.delete('/deleteOne/:itemId',verifyToken, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        if (!itemId) {
            return res.status(400).json({ error: 'Item ID is required' });
        }
        await list.findByIdAndDelete(itemId);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Error deleting record:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
