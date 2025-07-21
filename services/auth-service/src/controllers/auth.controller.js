const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({ message: "Email and password are required!" });
        }
        const existingUser = await User.findOne({ where: { email } });
        if(existingUser){
            return res.status(409).json({ message: "Email already in use." });
        }
        const user = await User.create({ email, password });
        res.status(201).json({ message: "User created successfully.", userId: user.id });
    } catch(error){
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

exports.login = async (req, res) => {
    try{
        const { email, password } = req.body;
        const user = await User.findOne({ where: {email} });
        if(!user || !(await user.isValidPassword(password))){
            res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            {id: user.id, email: user.email},
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ message: "Login successful", token });
    } catch(error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
}