const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

User.beforeCreate(async (user) => {
    const salt = await bcrypt.getSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
});

User.prototype.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = User;