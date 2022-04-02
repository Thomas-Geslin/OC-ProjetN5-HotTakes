const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

/* fonction permettant à un nouvel utilisateur de s'inscrire */
exports.signup = (req, res) => {
    // hache le mot de passe
    bcrypt.hash(req.body.password, 10)
      .then(hash => {
        // Créer le nouvel utilisateur
        const user = new User({
          email: req.body.email,
          password: hash
        });
        // Sauvegarde l'utilisateur
        user.save()
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
          .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
};

/* Fonction permettant à un utilisateur de se connecter */
exports.login = (req, res) => {
    // Récupère l'utilisateur avec son email
    User.findOne({ email: req.body.email })
      .then(user => {
        // Si il n'en trouve pas renvoit une erreur
        if (!user) {
          return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        // Compare le mdp rentré avec celui présent dans la BDD
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            // Si le mdp est mauvais refuse la connexion
            if (!valid) {
              return res.status(401).json({ error: 'Mot de passe incorrect !' });
            }
            // Valide la connexion et renvoit un token d'authentification
            res.status(200).json({
              userId: user._id,
              token: jwt.sign(
                { userId: user._id },
                'RANDOM_TOKEN_SECRET',
                { expiresIn: '24h' }
              )
            });
          })
          .catch(error => res.status(500).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
  };