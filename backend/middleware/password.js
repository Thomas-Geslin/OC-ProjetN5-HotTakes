const passwordValidator = require('password-validator');

let passwordSchema = new passwordValidator();


// Création des règles pour le mdp
passwordSchema    
.is().min(8)
.has().uppercase()
.has().not().spaces()
.has().digits(1);


/* Fonction vérifiant la force du mdp à l'inscription */
module.exports = (req, res, next) => {
    if(passwordSchema.validate(req.body.password)) {
        next();
    } else {
        return res.status(400).json({ error: 'Mdp trop faible : ' + passwordSchema.validate('req.body.password', { list: true }) })
    }
}