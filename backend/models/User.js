const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// Schéma d'un utilisateur
const userSchema = mongoose.Schema({ 
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Plugin vérifiant si un utilisateur s'inscrivant utilise bien une adresse mail unique
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);