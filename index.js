const express = require('express');
const mysql = require("mysql");
const app = express();
const port = process.env.PORT || 8888;
const bodyParser = require('body-parser')
const {stringify} = require("nodemon/lib/utils");
const cors = require('cors');
const morgan = require('morgan');
const _ = require('lodash');
const fileUpload = require('express-fileupload');

const pool = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database : "TP-BDD-1",
    insecureAuth : true
});

var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

pool.connect((err) => {
    if(err){
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
});
module.exports = pool;

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// GET AUTHENTIFICATION
app.get('/api/auth/sign', function(req, res) {

    // ici on va recevoir les parametres suivants
    const pseudo = req.query.pseudo;
    const mdp = req.query.mdp;
    const token = generateRandomString(16);

    // on verifie les donnes qu on a sur le serveur
    console.log("GET /api/auth/sign")
    console.log("DATA pseudo="+pseudo+" mdp="+mdp)

    // On fait un appel SQL pour comparer si le pseudo et mot de passe existe dans la base
    pool.query('SELECT * FROM `membres` WHERE `pseudo`="'+pseudo+'" and mdp="'+mdp+'"' , (err, rows, fields) => {
        if(err){
            return res.status(500).json({
                erreur:err
            });
        }else{
            const user = rows[0];
            // SI la requete passe on a normalement une ligne qui est la premiere ligne du tableau de retour
            if(user){ // si elle est definie on va renvoyer un token et renvoyer les donées
                var string=JSON.stringify(user);
                var json =  JSON.parse(string);
                var base_pseudo = json.pseudo;
                var base_mdp = json.mdp;

                console.log("BDD base_pseudo="+base_pseudo+" base_mdp="+base_mdp)
                res.json({
                    "token":token
                });
            }else{
                console.log("user non défini")
                res.json({
                    "token":""
                });
            }
        }
    })
});


// GET ALL TRANSACTIONS OR ONE TRANSACTIONS (WITHOUT SEARCH)
app.get('/api/transactions', function(req, res) {
    console.log("GET /api/transactions")
    const id_transactions = req.query.id_transactions;
    if(id_transactions){
        pool.query('SELECT * FROM transactions WHERE id_transactions='+id_transactions , (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err
                });
            }else{
                console.log(rows)
                res.json({
                    "data":rows
                });
            }
        })
    }else{
        pool.query('SELECT * FROM `transactions`' , (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err
                });
            }else{
                res.json({
                    "data":rows
                });
            }
        })
    }
});

// GET ALL TRANSACTIONS BETWEEN TWO DATE
app.get('/api/transactions/search/dates', function(req, res) {
    console.log("GET /api/transactions/search/dates")

    let datePrevue = req.query.datePrevue;
    let dateFin = req.query.dateFin;
    if(datePrevue==undefined){datePrevue=null}
    if(dateFin==undefined){dateFin=null}
    // OK TOUTES LES TRANSACTIONS DANS L'INTERVAL
    if(datePrevue!=null && dateFin!=null){
        pool.query('SELECT * FROM `transactions` WHERE `datePrevue`>=\''+datePrevue+'\' and `dateFin`<=\''+dateFin+'\'', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err
                });
            }else{
                console.log(rows)
                res.json({
                    "data":rows
                });
            }
        })
    // OK TOUTES LES TRANSACTIONS A PARTIR DE LA DATE PREVUE
    }else if(datePrevue!=null && dateFin==null){
        pool.query('SELECT * FROM `transactions` WHERE `datePrevue`>=\''+datePrevue+'\'', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err
                });
            }else{
                console.log(rows)
                res.json({
                    "data":rows
                });
            }
        })
    // OK TOUTES LES TRANSACTION AVANT LA DATE DE FIN
    }else if(datePrevue==null && dateFin!=null){
        pool.query('SELECT * FROM `transactions` WHERE `dateFin`<=\''+dateFin+'\'', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err
                });
            }else{
                console.log(rows)
                res.json({
                    "data":rows
                });
            }
        })
    }
});


/**
 * FRoute pour rechercher en fonction de tous les arguments
 * Etat : A faire
 */
// GET ALL TRANSACTIONS OR ONE TRANSACTIONS (WITHOUT SEARCH)
app.get('/api/transactions/search', async function(req, res) {

    console.log("GET /api/transactions/search")

    // DEFINIR LA QUERY DE BASE
    let query = 'SELECT * FROM `transactions` WHERE ';
    let nbArgs=0;
    for (const key in req.query) {
        nbArgs++;
        console.log(key+" = "+req.query[key])
    }

    console.log("NbArgs="+nbArgs+"Debut de la boucle :")
    console.log('-------------------------------')
    for (const key in req.query) {
        if(nbArgs>1) {
            console.log(key, req.query[key])
            if (key == 'id_transactions') {
                query = query + "`" + key + "`=" + req.query[key] + " and ";
            } else if (key == 'id_propositions') {
                query = query + "`" + key + "`=" + req.query[key] + " and ";

            } else if (key == 'id_beneficiaire') {
                query = query + "`" + key + "`=" + req.query[key] + " and ";
            } else if (key == 'duree') {
                query = query + "`" + key + "`=" + req.query[key] + " and ";
            } else if (key == 'datePrevue') {
                query = query + "`" + key + "`=\'" + req.query[key] + "\' and ";

            } else if (key == 'dateFin') {
                query = query + "`" + key + "`=\'" + req.query[key] + "\' and ";

            } else if (key == 'etat') {
                query = query + "`" + key + "`=\'" + req.query[key] + "\' and ";
            } else if (key == 'ecu') {
                query = query + "`" + key + "`=" + req.query[key] + " and ";
            } else if (key == 'tarif') {
                query = query + "`" + key + "`=" + req.query[key] + " and ";
            }else {
                console.log('eror2')
            }
        }else{
            if (key == 'id_transactions') {
                query = query + "`" + key + "`=" + req.query[key];
            } else if (key == 'id_propositions') {
                query = query + "`" + key + "`=" + req.query[key];
            } else if (key == 'id_beneficiaire') {
                query = query + "`" + key + "`=" + req.query[key];
            } else if (key == 'duree') {
                query = query + "`" + key + "`=" + req.query[key];
            } else if (key == 'datePrevue') {
                query = query + "`" + key + "`=\'" + req.query[key] + "\'";
            } else if (key == 'dateFin') {
                query = query + "`" + key + "`=\'" + req.query[key] + "\'";
            } else if (key == 'etat') {
                query = query + "`" + key + "`=\'" + req.query[key] + "\'";
            } else if (key == 'ecu') {
                query = query + "`" + key + "`=" + req.query[key];
            } else if (key == 'tarif') {
                query = query + "`" + key + "`=" + req.query[key];
            }else {
                console.log('eror')
            }
        }
       nbArgs--;
    }
    console.log(query)

    pool.query(query, (err, rows, fields) => {
        if(err){
            return res.status(500).json({
                erreur:err
            });
        }else{
            console.log(rows)
            res.json({
                "data":rows
            });
        }
    })

});

/**
 * Toutes les route pour rechercher en fonction de tous les arguments
 * Etat : A faire
 */
// GET ALL TRANSACTIONS ARROUND ME
app.get('/api/transactions/localisation', function(req, res) {
    console.log("GET /api/transactions/localisation")
    const lat = req.query.lat;
    const long = req.query.long;

    if(lat!= undefined && long!=undefined){

    // Coordonnées FLeurbaix
    let B2 = 50.65; // a lat
    let C2 = 2.8333; // a long

    // Coordonnées Lille
    let B3 = 50.6333; // b lat
    let C3 = 3.0667; // B long

    const radsToDegs = rad => rad * 180 / Math.PI;
    const degsToRads = deg => (deg * Math.PI) / 180.0;

    // SELECT 111.111 * DEGREES(ACOS(COS(RADIANS(50.6333)) * COS(RADIANS(50.6333)) * COS(RADIANS(a.long - 3.0667)) + SIN(RADIANS(a.lat)) * SIN(RADIANS(50.6333)))) AS distance_in_km FROM propositions AS a

    const sin = rad => Math.sin(rad);
    const cos = rad => Math.cos(rad);
    const acos = rad => Math.acos(rad);

    const distance = acos(sin(degsToRads(B2))*sin(degsToRads(B3))+cos(degsToRads(B2))*cos(degsToRads(B3))*cos(degsToRads(C2-C3)))*6371;
    console.log(distance)

        /*
        SELECT a.id_propositions AS from_city, b.id_propositions AS to_city, 111.111 * DEGREES(ACOS(COS(RADIANS(a.lat)) * COS(RADIANS(b.lat)) * COS(RADIANS(a.long - b.long)) + SIN(RADIANS(a.lat)) * SIN(RADIANS(b.lat)))) AS distance_in_km FROM propositions AS a JOIN propositions AS b ON a.id_propositions <> b.id_propositions WHERE a.id_propositions = 19 AND b.id_propositions = 25
         */

        res.json({
            "data":"",
            "Message":"Il y a les arguments il faut finir de dev"
        });

    }else{
        console.log("les donnes sont pas definie ")
        res.json({
            "data":"",
            "Message":"Il manque un arguement lat ou long"
        });
    }
});


// PUT NEW TRANSACTIONS => OK
app.put('/api/transactions/', function(req, res) {

    console.log("PUT /api/transactions/")

    let id_transactions = null;
    let id_propositions = req.query.id_propositions;
    let id_beneficiaire = req.query.id_beneficiaire;
    let duree = req.query.duree;
    let datePrevue = req.query.datePrevue;
    let dateFin = req.query.dateFin;
    let etat = req.query.etat;
    let ecu = req.query.ecu;
    let tarif = req.query.tarif;
    let id_new_transaction;

    if(id_propositions==undefined){id_propositions=null}
    if(id_beneficiaire==undefined){id_beneficiaire=null}
    if(duree==undefined){duree=null}
    if(datePrevue==undefined){datePrevue=null}
    if(dateFin==undefined){dateFin=null}
    if(etat==undefined){etat=null}
    if(ecu==undefined){ecu=0}
    if(tarif==undefined){tarif=0}

        pool.query('INSERT INTO `transactions` (`id_transactions`, `id_propositions`, `id_beneficiaire`, `duree`, `datePrevue`, `dateFin`, `etat`, `tarif`, `ecu`) VALUES ('+id_transactions+','+id_propositions+','+id_beneficiaire+','+duree+','+datePrevue+','+dateFin+','+etat+','+tarif+','+ecu+')' , (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err
                });
            }else{
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;

                pool.query('SELECT * FROM transactions WHERE id_transactions='+id_new_transaction , (err, rows, fields) => {
                    if(err){
                        return res.status(500).json({
                            erreur:err
                        });
                    }else{
                        console.log(rows)
                        res.json({
                            "data":rows
                        });
                    }
                })
            }
        })
});


// POST NEW TRANSACTIONS => OK
app.post('/api/transactions/', function(req, res) {

    console.log("POST /api/transactions/")

    let id_transactions = req.body.id_transactions;
    let id_propositions = req.body.id_propositions;
    let id_beneficiaire = req.body.id_beneficiaire;
    let duree = req.body.duree;
    let datePrevue = req.body.datePrevue;
    let dateFin = req.body.dateFin;
    let etat = req.body.etat;
    let ecu = req.body.ecu;
    let tarif = req.body.tarif;

    if(id_propositions==undefined){id_propositions=null}
    if(id_beneficiaire==undefined){id_beneficiaire=null}
    if(duree==undefined){duree=null}
    if(datePrevue==undefined){datePrevue=null}
    if(dateFin==undefined){dateFin=null}
    if(etat==undefined){etat="OK"}
    if(ecu==undefined){ecu=0}
    if(tarif==undefined){tarif=0}

    console.log(typeof(datePrevue))

    pool.query('UPDATE `transactions` SET  `id_transactions`='+id_transactions+', `duree`='+duree+', `datePrevue`="'+datePrevue+'", `id_propositions`='+id_propositions+',`id_beneficiaire`='+id_beneficiaire+',`duree`='+duree+',`etat`="'+etat+'",`tarif`='+tarif+',`ecu`='+ecu+' WHERE `id_transactions`='+id_transactions, (err, rows, fields) => {
        if(err){
            return res.status(500).json({
                erreur:err
            });
        }else{
            pool.query('SELECT * FROM transactions WHERE id_transactions='+id_transactions , (err, rows, fields) => {
                if(err){
                    return res.status(500).json({
                        erreur:err
                    });
                }else{
                    console.log(rows)
                    res.json({
                        "data":rows
                    });
                }
            })
        }
    })
});




// GET MES COMPETENCES => OK
app.get('/api/mescompetences', function(req, res) {
    console.log("GET /api/mescompetences")
    let id_code_membre = req.query.id_code_membre; // id_code_membre
    let id_competences = req.query.id_competences; // id_code_membre
    let desc = req.query.desc; // id_code_membre

    if(id_code_membre==undefined){id_code_membre=null}
    if(id_competences==undefined){id_competences=null}
    if(desc==undefined){desc=null}

    if(id_code_membre != null && id_competences == null && desc == null) {
        pool.query('SELECT * FROM `mes_competences` WHERE `id_code_membre`=' + id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })

    }else if(id_code_membre == null && id_competences != null && desc == null){
        pool.query('SELECT * FROM `mes_competences` WHERE `id_competences`=' + id_competences, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })

    }else if(id_code_membre == null && id_competences == null && desc != null){
        pool.query('SELECT * FROM `mes_competences` WHERE `desc`LIKE '+"'%"+desc +"%'", (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })

    }else if(id_code_membre != null && id_competences != null && desc == null){
        pool.query('SELECT * FROM `mes_competences` WHERE `id_competences`='+id_competences+' and `id_code_membre`='+id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })

    }else if(id_code_membre == null && id_competences != null && desc != null){
        pool.query('SELECT * FROM `mes_competences` WHERE `desc`LIKE '+"'%"+desc +"%'"+'and id_competences='+id_competences, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })
    }else if(id_code_membre != null && id_competences == null && desc != null){
        pool.query('SELECT * FROM `mes_competences` WHERE `desc`LIKE '+"'%"+desc +"%'"+'and id_code_membre='+id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })
    }else if(id_code_membre != null && id_competences != null && desc != null){
        pool.query('SELECT * FROM `mes_competences` WHERE `desc`LIKE '+"'%"+desc +"%'"+'and id_code_membre='+id_code_membre+' and id_competences='+id_competences, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })
    }else{ // Par defaut renvoie tout
        pool.query('SELECT * FROM `mes_competences` WHERE 1', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err
                });
            }else{
                res.json({
                    "data":rows
                });
            }
        })
    }
});


// GET COMMENTAIRES => OK
app.get('/api/commentaires', function(req, res) {
    console.log("GET /api/commentaires")
    let id_code_membre = req.query.id_code_membre; // id_code_membre
    let id_transactions = req.query.id_transactions; // id_code_membre
    let id_commentaires = req.query.id_commentaires; // id_code_membre

    if(id_code_membre==undefined){id_code_membre=null}
    if(id_transactions==undefined){id_transactions=null}
    if(id_commentaires==undefined){id_commentaires=null}

    if(id_code_membre != null && id_transactions == null && id_commentaires == null) {
        pool.query('SELECT * FROM `commentaires` WHERE `id_code_membre`=' + id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })

    }else if(id_code_membre == null && id_transactions != null && id_commentaires == null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_transactions`=' + id_transactions, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })

    }else if(id_code_membre == null && id_transactions == null && id_commentaires != null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_commentaires`='+id_commentaires , (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })

    }else if(id_code_membre != null && id_transactions != null && id_commentaires == null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_transactions`='+id_transactions+' and `id_code_membre`='+id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })

    }else if(id_code_membre == null && id_transactions != null && id_commentaires != null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_commentaires`='+id_commentaires +' and id_transactions='+id_transactions, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })
    }else if(id_code_membre != null && id_transactions == null && id_commentaires != null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_commentaires`='+id_commentaires +' and id_code_membre='+id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })
    }else if(id_code_membre != null && id_transactions != null && id_commentaires != null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_commentaires`='+id_commentaires +' and id_code_membre='+id_code_membre+' and id_transactions='+id_transactions, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows
                });
            }
        })
    }else{ // Par defaut renvoie tout
        pool.query('SELECT * FROM `commentaires` WHERE 1', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err
                });
            }else{
                res.json({
                    "data":rows
                });
            }
        })
    }
});

// PUT COMMENTAIRES => A FAIRE
// Creation d'un nouveau comentaire dans la base
app.put('/api/commentaires/', function(req, res) {

    console.log("PUT /api/commentaires/")
    let id_transactions = req.query.id_transactions;
    let texte = req.query.texte;
    let id_code_membre = req.query.id_code_membre;
    if(id_transactions==undefined){id_transactions=null}
    if(texte==undefined){texte=null}
    if(id_code_membre==undefined){id_code_membre=null}

    if(id_transactions!= null && texte!= null && id_code_membre!= null) {
        pool.query('INSERT INTO `commentaires` (`id_transactions`, `texte`, `id_code_membre`) VALUES (' + id_transactions + ',\'' + texte + '\',' + id_code_membre + ')', (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;

                pool.query('SELECT * FROM commentaires WHERE id_commentaires=' + id_new_transaction, (err, rows, fields) => {
                    if (err) {
                        return res.status(500).json({
                            erreur: err
                        });
                    } else {
                        console.log(rows)
                        res.json({
                            "data": rows
                        });
                    }
                })
            }
        })
    }else{
        console.log("Il manque des arguements")
        res.json({
            status: false,
            message: 'Il manque des arguements'
        });
    }
});



// POST COMMENTAIRES => A FAIRE
// Creation d'un nouveau comentaire dans la base
app.post('/api/commentaires/', function(req, res) {

    console.log("PUT /api/commentaires/")
    let id_commentaires = req.query.id_commentaires;
    let id_transactions = req.query.id_transactions;
    let texte = req.query.texte;
    let id_code_membre = req.query.id_code_membre;

    if(id_commentaires==undefined){id_commentaires=null}
    if(id_transactions==undefined){id_transactions=null}
    if(texte==undefined){texte=null}
    if(id_code_membre==undefined){id_code_membre=null}

    if(id_commentaires != null) {
        // OK
        if(id_transactions != null && texte == null && id_code_membre == null) {
                pool.query('UPDATE `commentaires` SET  `id_transactions`='+id_transactions+' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err
                    });
                } else {
                    console.log(rows)
                    res.json({
                        "data": rows
                    });
                }
            })
        // OK
        }else if(id_transactions == null && texte != null && id_code_membre == null){
            pool.query('UPDATE `commentaires` SET  `texte`=\''+texte+'\' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err
                    });
                } else {
                    console.log(rows)
                    res.json({
                        "data": rows
                    });
                }
            })
        // OK
        }else if(id_transactions == null && texte == null && id_code_membre != null){
            pool.query('UPDATE `commentaires` SET  `id_code_membre`='+id_code_membre+' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err
                    });
                } else {
                    console.log(rows)
                    res.json({
                        "data": rows
                    });
                }
            })
        // OK
        }else if(id_transactions != null && texte != null && id_code_membre == null){
            pool.query('UPDATE `commentaires` SET  `texte`=\''+texte+'\' , `id_transactions`='+id_transactions+' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err
                    });
                } else {
                    console.log(rows)
                    res.json({
                        "data": rows
                    });
                }
            })
        // OK
        }else if(id_transactions == null && texte != null && id_code_membre != null){
            pool.query('UPDATE `commentaires` SET  `texte`=\''+texte+'\' , `id_code_membre`='+id_code_membre+' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err
                    });
                } else {
                    console.log(rows)
                    res.json({
                        "data": rows
                    });
                }
            })
        // OK
        }else if(id_transactions != null && texte == null && id_code_membre != null){
            pool.query('UPDATE `commentaires` SET  `id_transactions`='+id_transactions+' , `id_code_membre`='+id_code_membre+' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err
                    });
                } else {
                    console.log(rows)
                    res.json({
                        "data": rows
                    });
                }
            })
        // OK
        }else if(id_transactions != null && texte != null && id_code_membre != null){
            pool.query('UPDATE `commentaires` SET  `texte`=\''+texte+'\' , `id_code_membre`='+id_code_membre+' , `id_transactions`='+id_transactions+' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err
                    });
                } else {
                    console.log(rows)
                    res.json({
                        "data": rows
                    });
                }
            })
        }else{
            res.json({
                status: false,
                message: 'Erreur de use case !'
            });
        }
    }else{
        res.json({
            status: false,
            message: 'Il id_commentaires comme arguement pour modifier'
        });
    }
});


app.use(fileUpload({
    createParentPath: true
}));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

// POST UPLOAD => OK
app.post('/api/upload-avatar', async (req, res) => {
    console.log("POST /api/upload-avatar")
    let id_transactions = req.body.id_transactions; // id_code_membre
    try {
        if(!req.files || !id_transactions) {
            res.send({
                status: false,
                message: 'No file uploaded or not id_transactions'
            });
        }else{
            const uniq_token_file = generateRandomString(8);
            let avatar = req.files.avatar;
            await avatar.mv('./uploads/' + uniq_token_file + '-' + avatar.name)
                pool.query('INSERT INTO `images` (`id_transactions`, `id_file_sys_img`, `id_images`) VALUES ('+id_transactions+',\''+uniq_token_file+'-'+avatar.name+'\',NULL);' ) , (err, rows, fields) => {
                    const data_images_bdd = rows;
                    var string = JSON.stringify(data_images_bdd);
                    var json = JSON.parse(string);
                    let id_new_transaction = json.insertId;
                }
                res.send({
                status: true,
                message: 'Import OK '
            });
        }
    }catch (err) {
        res.send({
            status: false,
            message: 'File is not uploaded'
        }
        )
    }
});


// GET DOWNLOAD => OK
app.get('/api/download-avatar', async (req, res) => {
    console.log("GET /api/download-avatar")
    const id_transactions = req.query.id_transactions; // id_code_membre
    console.log(id_transactions)
    try {
        if(id_transactions) {
            console.log("id_transactions is defined")
            pool.query('SELECT `id_file_sys_img` FROM `images` WHERE `id_transactions`='+id_transactions, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err
                    });
                } else {
                    var ret = [];
                    for (var i of rows)
                        ret.push(i);

                    res.contentType("image/png")
                    const name = stringify(ret[0].id_file_sys_img)
                    const data =__dirname+'/uploads/'+name; // OK
                    console.log(data)
                    res.download(data);
                }
            })
        }else {
            res.send({
                status: false,
                message: 'No id_transactions'
            });        }
    }catch (err) {
        res.send({
                status: false,
                message: 'File is not uploaded'
            }
        )
    }
});


app.listen(port);
console.log('Server started at http://localhost:' + port);
