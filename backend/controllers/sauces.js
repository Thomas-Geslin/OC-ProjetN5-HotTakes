const Sauce = require('../models/Sauce');
const fs = require('fs');

/* Fonction permettant de créer une nouvelle sauce */
exports.createSauce = (req, res) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce crée !' }))
        .catch(error => res.status(400).json({ error }));   
};


/* Fonction permettant de récupérer les infos d'une sauce quand on clique dessus */
exports.getOneSauce = (req, res ) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(400).json({ error }));
};


/* Fonction permettant de récupérer les infos de toutes les suaces depuis la BDD pour la page d'acceuil */
exports.getAllSauces = (req, res) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error })); 
};


/* Fonction permettant de modifier une sauce */
exports.modifySauce = (req, res) => {
    // Supprime l'ancienne image si on en ajoute une nouvelle 
    if(req.file) {
        Sauce.findOne({ _id: req.params.id })
            .then((sauce) => {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, (err) => {
                    if(err) throw err;
                })
            })
            .catch((error) => res.status(400).json({ error }));
    }
    // Ajoute la nouvelle image si il y en as une, sinon change simplement le body
    const sauceObject = req.file ?
    {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    // Met à jour la sauce
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
        .catch(error => res.status(400).json({ error }));
};


/* Fonction permettant de supprimer une sauce */
exports.deleteSauce = (req, res) => {
    // Récupère la sauce à supprimer
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (!sauce) {
            res.status(404).json({ error: new Error("La sauce n'existe pas !") });
            }
            if (sauce.userId !== req.auth.userId) {
            res.status(400).json({ error: new Error("Vous n'êtes pas autorisé à supprimer cette sauce !") });
            }
            // Supprime l'image de la sauce
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
        // Supprime la sauce de la BDD
        Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
            .catch(error => res.status(400).json({ error }));
            });
        })
        .catch((error) => res.status(400).json({ error }));
};


/* Fonction permettant de liker une sauce */
exports.likeSauce = (req, res) => {
    switch (req.body.like) {
        // Cas où on enlève un like/dislike
        case 0:
            Sauce.findOne({ _id: req.params.id })
                .then(sauce => {
                    // Cherche si il faut enlever un like, si oui l'enlève
                    if(sauce.userLiked.includes(req.body.userId)) {
                        Sauce.updateOne({ _id: req.params.id }, { $inc: {likes: -1}, $pull: {userLiked: req.body.userId} })
                            .then(() => res.status(201).json({ message: 'Ton avis a été pris en compte (like)!' }))
                            .catch((error) => res.status(400).json({ error }));
                    }
                    // Cherche si il faut enlever un dislike, si oui l'enlève
                    else if(sauce.userDisliked.includes(req.body.userId)) {
                        Sauce.updateOne({ _id: req.params.id }, { $inc: {dislikes: -1}, $pull: {userDisliked: req.body.userId} })
                            .then(() => res.status(201).json({ message: 'Ton avis a été pris en compte (dislike)!' }))
                            .catch((error) => res.status(400).json({ error }));
                    }
                })
                .catch(() => res.status(400).json({ message: 'erreur 3' }));
        break;
        // Cas où on like
        case 1:
            Sauce.findOne({ _id: req.params.id })
                .then(sauce => {
                    // Si l'utilisateur as déjà liker ou disliker la sauce, si c'est le cas bloque l'ajout du like
                    if(sauce.userDisliked.includes(req.body.userId)) {
                        Sauce.updateOne({ _id: req.params.id }, { $inc: {dislikes:-1}, $pull: {userDisliked: req.body.userId} })
                            .then(() => res.status(200).json({ message: 'Votre dislike a bien été enlevé !' }))
                            .catch(error => res.status(400).json(error));
                    } else if(sauce.userLiked.includes(req.body.userId)) {
                        Sauce.updateOne({ _id: req.params.id }, { $inc: {likes:-1}, $pull: {userLiked: req.body.userId} })
                        .then(() => res.status(200).json({ message: 'Votre like a bien été enlevé !' }))
                        .catch(error => res.status(400).json(error));
                    // Sinon le rajoute
                    } else {
                        Sauce.updateOne({ _id: req.params.id }, { $inc: {likes:1}, $push: {userLiked: req.body.userId} })
                            .then(() => res.status(200).json({ message: 'Votre like a bien été ajouté !' }))
                            .catch(error => res.status(400).json(error));
                    }
                })
                .catch(error => res.status(400).json(error));
        break;
        // Cas où on dislike
        case -1:
            Sauce.findOne({ _id: req.params.id })
            .then(sauce => {
                // Si l'utilisateur as déjà liker ou disliker la sauce, si c'est le cas bloque l'ajout du like
                if(sauce.userDisliked.includes(req.body.userId)) {
                    Sauce.updateOne({ _id: req.params.id }, { $inc: {dislikes:-1}, $pull: {userDisliked: req.body.userId} })
                        .then(() => res.status(200).json({ message: 'Votre dislike a bien été enlevé !' }))
                        .catch(error => res.status(400).json(error));
                } else if(sauce.userLiked.includes(req.body.userId)) {
                    Sauce.updateOne({ _id: req.params.id }, { $inc: {likes:-1}, $pull: {userLiked: req.body.userId} })
                    .then(() => res.status(200).json({ message: 'Votre like a bien été enlevé !' }))
                    .catch(error => res.status(400).json(error));
                // Sinon le rajoute
                } else {
                    Sauce.updateOne({ _id: req.params.id }, { $inc: {dislikes:1}, $push: {userDisliked: req.body.userId} })
                        .then(() => res.status(200).json({ message: 'Votre like a bien été ajouté !' }))
                        .catch(error => res.status(400).json(error));
                }
            })
            .catch(error => res.status(400).json(error));
        break;
        default:
            console.error('Something went wrong !');
    }
};