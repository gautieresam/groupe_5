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
const {NULL} = require("mysql/lib/protocol/constants/types");

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


// POST AUTHENTIFICATION
app.post('/api/auth/sign', function(req, res) {

    // ici on va recevoir les parametres suivants
    const pseudo = req.body.pseudo;
    const mdp = req.body.mdp;
    const token = generateRandomString(16);

    // on verifie les donnes qu on a sur le serveur
    console.log("GET /api/auth/sign")
    console.log("DATA pseudo="+pseudo+" mdp="+mdp)

    // On fait un appel SQL pour comparer si le pseudo et mot de passe existe dans la base
    pool.query('SELECT * FROM `membres` WHERE `pseudo`="'+pseudo+'" and mdp="'+mdp+'"' , (err, rows, fields) => {
        if(err){
            return res.status(500).json({
                erreur:err,
                "status": "false"
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
                    "token":token,
                    "status": "true"
                });
            }else{
                console.log("user non défini")
                res.json({
                    "token":"",
                    "status": "false"

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
        pool.query('SELECT p.id_code_membre as id_dispensateur, t.id_propositions,id_transactions,id_beneficiaire,duree,datePrevue,dateFin,etat,tarif,ecu FROM transactions AS t,propositions AS p WHERE t.id_propositions=p.id_propositions and id_transactions='+id_transactions , (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"

                });
            }else{
                console.log(rows)
                res.json({
                    "data":rows,
                    "status": "true"

                });
            }
        })
    }else{
        pool.query('SELECT p.id_code_membre as id_dispensateur, t.id_propositions,id_transactions,id_beneficiaire,duree,datePrevue,dateFin,etat,tarif,ecu FROM transactions AS t,propositions AS p WHERE t.id_propositions=p.id_propositions' , (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"

                });
            }else{
                res.json({
                    "data":rows,
                    "status": "true"

                });
            }
        })
    }
});

// GET ALL TRANSACTIONS BETWEEN TWO DATE => OK
// Warning id_propositions doit être defini car il s'agit d'une jointure entre 2 tables
app.get('/api/transactions/search/dates', function(req, res) {
    console.log("GET /api/transactions/search/dates")

    let datePrevue = req.query.datePrevue;
    let dateFin = req.query.dateFin;
    console.log("datePrevue="+datePrevue+"dateFin="+dateFin)
    if(datePrevue==undefined){datePrevue=null}
    if(dateFin==undefined){dateFin=null}

    console.log("datePrevue="+datePrevue+"dateFin="+dateFin)
    let startQuery = 'SELECT p.id_code_membre as id_dispensateur, t.id_propositions,id_transactions,id_beneficiaire,duree,datePrevue,dateFin,etat,tarif,ecu FROM transactions AS t,propositions AS p WHERE t.id_propositions=p.id_propositions and'
    if(datePrevue!=null && dateFin!=null){
        pool.query(startQuery+' `datePrevue`>=\''+datePrevue+'\' and `dateFin`<=\''+dateFin+'\'', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"

                });
            }else{
                console.log(rows)
                res.json({
                    "data":rows,
                    "status": "true"

                });
            }
        })
    // OK TOUTES LES TRANSACTIONS A PARTIR DE LA DATE PREVUE
    }else if(datePrevue!=null && dateFin==null){
        console.log("z")
        pool.query(startQuery+' `datePrevue`>=\''+datePrevue+'\'', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"

                });
            }else{
                console.log(rows)
                res.json({
                    "data":rows,
                    "status": "true"

                });
            }
        })
    // OK TOUTES LES TRANSACTION AVANT LA DATE DE FIN
    }else if(datePrevue==null && dateFin!=null){
        pool.query(startQuery+' `dateFin`<=\''+dateFin+'\'', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"

                });
            }else{
                console.log(rows)
                res.json({
                    "data":rows,
                    "status": "true"

                });
            }
        })
    }
});


// GET ALL TRANSACTIONS OR ONE TRANSACTIONS WITHOUT FULL ARGS
app.get('/api/transactions/search', async function(req, res) {

    console.log("GET /api/transactions/search")
    let query = 'SELECT p.id_code_membre as id_dispensateur, t.id_propositions,id_transactions,id_beneficiaire,duree,datePrevue,dateFin,etat,tarif,ecu FROM transactions AS t,propositions AS p WHERE t.id_propositions=p.id_propositions and ';
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
                query = query + "`" + key + "`>=\'" + req.query[key] + "\' and ";
            } else if (key == 'dateFin') {
                query = query + "`" + key + "`<=\'" + req.query[key] + "\' and ";
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
                query = query + "`" + key + "`>=\'" + req.query[key] + "\'";
            } else if (key == 'dateFin') {
                query = query + "`" + key + "`<=\'" + req.query[key] + "\'";
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
                erreur:err,
                "status": "false"
            });
        }else{
            console.log(rows)
            res.json({
                "data":rows,
                "status": "true"
            });
        }
    })

});

/**
 * Toutes les route pour rechercher en fonction de tous les arguments
 * Etat : OK mais renvoie une l'iste id et distance il faut filtrer suivant des KM autour de moi à finir
 */
// GET ALL TRANSACTIONS ARROUND ME
app.get('/api/transactions/localisation', function(req, res) {
    console.log("GET /api/transactions/localisation")
    const maLat = req.query.lat;
    const maLong = req.query.long;

    if(maLat!= undefined && maLong!=undefined){

    // SELECT id_propositions, 1.60934*( 3959 * acos( cos( radians(50.6333) ) * cos( radians( lat ) ) * cos( radians( longue ) - radians(3.0667) ) + sin( radians(50.6333) ) * sin( radians( lat ) ) ) ) AS distance FROM propositions
        pool.query('SELECT id_propositions, 1.60934*( 3959 * acos( cos( radians('+maLat+') ) * cos( radians( lat ) ) * cos( radians( longue ) - radians('+maLong+') ) + sin( radians('+maLat+') ) * sin( radians( lat ) ) ) ) AS distance FROM propositions', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"

                });
            }else{
                // Parcourir le tableau pour renvoyer les propositions.
                console.log(rows)
                res.json({
                    "data":rows,
                    "status": "true"

                });
            }
        })


    }else{
        console.log("les donnes sont pas definie ")
        res.json({
            "status": "false",
            "Message":"Il manque un arguement lat ou long"
        });
    }
});


/**
 * Toutes les route pour rechercher en fonction de tous les arguments
 * Etat : renvoie toutes les propositions
 *
 */
// GET ALL TRANSACTIONS ARROUND ME
app.get('/api/v2/transactions/localisation', function(req, res) {
    console.log("GET /api/transactions/localisation")
    const maLat = req.query.lat;
    const maLong = req.query.long;
    var ret=[];


    if(maLat!= undefined && maLong!=undefined){
        pool.query('SELECT id_propositions, 1.60934*( 3959 * acos( cos( radians('+maLat+') ) * cos( radians( lat ) ) * cos( radians( longue ) - radians('+maLong+') ) + sin( radians('+maLat+') ) * sin( radians( lat ) ) ) ) AS distance FROM propositions LIMIT 5', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err
                });
            }else{

                //Parcourir le tableau pour renvoyer les propositions.
                //console.log(rows)
                //console.log('>> results: ', rows );
                var string=JSON.stringify(rows);
                //console.log('>> string: ', string );
                var json =  JSON.parse(string);
                //console.log('>> json: ', json);
                //console.log('> user.name: ', json[0].distance);

                console.log(json.length)

                for (var i = 0; i < 5; i++) {

                    pool.query('SELECT * FROM `propositions` WHERE `id_propositions`='+json[i].id_propositions , (err, row, fields) => {
                        if(err){
                            return res.status(500).json({
                                erreur:err,
                                "status": "false"
                            });
                        }else{
                            //console.log("date:"+fields)
                            //console.log(row)
                            var string=JSON.stringify(row);
                            //console.log('>> string: ', string );
                            var json2 =  JSON.parse(string);
                            console.log(typeof json2[0])
                            ret.push(json2[0])
                        }
                    })
                }

                // Attendre 2 secondes
                function resolveAfter2Seconds(x) {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(x);
                        }, 5000);
                    });
                }
                let data;
                async function f1() {
                    var x = await resolveAfter2Seconds(10);
                    console.log(x); // 10
                    console.log(ret)
                    data=ret
                    res.json({
                        "data":data,
                        "status": "true"

                    });
                }
                f1();

            }
        })


    }else{
        console.log("les donnes sont pas definie ")
        res.json({
            "Message":"Il manque un arguement lat ou long",
            "status": "false"
        });
    }
});




// OK
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
    if(duree==undefined){duree=0}
    if(datePrevue==undefined){datePrevue=null}
    if(dateFin==undefined){dateFin=null}
    if(etat==undefined){etat=null}
    if(ecu==undefined){ecu=0}
    if(tarif==undefined){tarif=0}

    if(datePrevue!= null && dateFin!= null) {
        pool.query('INSERT INTO `transactions` ( `id_propositions`, `id_beneficiaire`, `duree`, `datePrevue`, `dateFin`, `etat`, `tarif`, `ecu`) VALUES ('+id_propositions+','+id_beneficiaire+','+duree+',"'+datePrevue+'","'+dateFin+'",\''+etat+'\','+tarif+','+ecu+')' , (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"
                });
            }else{
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;
                console.log(id_new_transaction)
                pool.query('SELECT * FROM transactions WHERE id_transactions='+id_new_transaction , (err, rows, fields) => {
                    if(err){
                        return res.status(500).json({
                            erreur:err,
                            "status": "false"
                        });
                    }else{
                        console.log(rows)
                        res.json({
                            "data":rows,
                            "status": "true"
                        });
                    }
                })
            }
        })
    }else if(datePrevue== null && dateFin!=null){
        pool.query('INSERT INTO `transactions` (`id_propositions`, `id_beneficiaire`, `duree`, `dateFin`, `etat`, `tarif`, `ecu`) VALUES ('+id_propositions+','+id_beneficiaire+','+duree+',"'+dateFin+'",\''+etat+'\','+tarif+','+ecu+')' , (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    status:false
                });
            }else{
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;

                pool.query('SELECT * FROM transactions WHERE id_transactions='+id_new_transaction , (err, rows, fields) => {
                    if(err){
                        return res.status(500).json({
                            erreur:err,
                            "status": "false"
                        });
                    }else{
                        console.log(rows)
                        res.json({
                            "data":rows,
                            "status": "true"
                        });
                    }
                })
            }
        })
    }else if(datePrevue!= null && dateFin== null){
        pool.query('INSERT INTO `transactions` (`id_propositions`, `id_beneficiaire`, `duree`, `datePrevue`, `etat`, `tarif`, `ecu`) VALUES ('+id_propositions+','+id_beneficiaire+','+duree+',\''+datePrevue+'\',\''+etat+'\','+tarif+','+ecu+')' , (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"
                });
            }else{
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;

                pool.query('SELECT * FROM transactions WHERE id_transactions='+id_new_transaction , (err, rows, fields) => {
                    if(err){
                        return res.status(500).json({
                            erreur:err,
                            "status": "false"
                        });
                    }else{
                        console.log(rows)
                        res.json({
                            "data":rows,
                            "status": "true"

                        });
                    }
                })
            }
        })
    }else if(datePrevue== null && dateFin== null){
        pool.query('INSERT INTO `transactions` (`id_propositions`, `id_beneficiaire`, `duree`, `etat`, `tarif`, `ecu`) VALUES ('+id_propositions+','+id_beneficiaire+','+duree+',\''+etat+'\','+tarif+','+ecu+')' , (err, rows, fields) => {
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
                            erreur:err,
                            "status": "false"

                        });
                    }else{
                        console.log(rows)
                        res.json({
                            "data":rows,
                            "status": "true"

                        });
                    }
                })
            }
        })
    }else{
        res.json({
            "status": false,
            "message": "erreur API",
        });
    }
});


// POST NEW TRANSACTIONS
// PAS OK
// A refaire





////////////////////////////////////////////////////////////////////////////////////////////////////
app.post('/api/transactions/', function(req, res) {
    // UPDATE
    console.log("GET /api/transactions/search")
    let query = 'SELECT p.id_code_membre as id_dispensateur, t.id_propositions,id_transactions,id_beneficiaire,duree,datePrevue,dateFin,etat,tarif,ecu FROM transactions AS t,propositions AS p WHERE t.id_propositions=p.id_propositions and ';

    //UPDATE `transactions` SET `id_transactions`=[value-1],`id_propositions`=[value-2],`id_beneficiaire`=[value-3],`duree`=[value-4],`datePrevue`=[value-5],`dateFin`=[value-6],`etat`=[value-7],`tarif`=[value-8],`ecu`=[value-9] WHERE 1

    let nbArgs=0;
    for (const key in req.body) {
        nbArgs++;
        console.log(key+" = "+req.body[key])
    }

    console.log("NbArgs="+nbArgs+"Debut de la boucle :")
    console.log('-------------------------------')

    // Savoir si id est definie ou non

    /*
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
                query = query + "`" + key + "`>=\'" + req.query[key] + "\' and ";
            } else if (key == 'dateFin') {
                query = query + "`" + key + "`<=\'" + req.query[key] + "\' and ";
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
                query = query + "`" + key + "`>=\'" + req.query[key] + "\'";
            } else if (key == 'dateFin') {
                query = query + "`" + key + "`<=\'" + req.query[key] + "\'";
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
    */
    res.json({
        "status":"devmasse"
    });

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
                    erreur: err,
                    "status": "false"
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"

                });
            }
        })

    }else if(id_code_membre == null && id_competences != null && desc == null){
        pool.query('SELECT * FROM `mes_competences` WHERE `id_competences`=' + id_competences, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"
                });
            }
        })

    }else if(id_code_membre == null && id_competences == null && desc != null){
        pool.query('SELECT * FROM `mes_competences` WHERE `desc`LIKE '+"'%"+desc +"%'", (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"

                });
            }
        })

    }else if(id_code_membre != null && id_competences != null && desc == null){
        pool.query('SELECT * FROM `mes_competences` WHERE `id_competences`='+id_competences+' and `id_code_membre`='+id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"
                });
            }
        })

    }else if(id_code_membre == null && id_competences != null && desc != null){
        pool.query('SELECT * FROM `mes_competences` WHERE `desc`LIKE '+"'%"+desc +"%'"+'and id_competences='+id_competences, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"
                });
            }
        })
    }else if(id_code_membre != null && id_competences == null && desc != null){
        pool.query('SELECT * FROM `mes_competences` WHERE `desc`LIKE '+"'%"+desc +"%'"+'and id_code_membre='+id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"

                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"

                });
            }
        })
    }else if(id_code_membre != null && id_competences != null && desc != null){
        pool.query('SELECT * FROM `mes_competences` WHERE `desc`LIKE '+"'%"+desc +"%'"+'and id_code_membre='+id_code_membre+' and id_competences='+id_competences, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"

                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"

                });
            }
        })
    }else{ // Par defaut renvoie tout
        pool.query('SELECT * FROM `mes_competences` WHERE 1', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"
                });
            }else{
                res.json({
                    "data":rows,
                    "status": "true"
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
                    erreur: err,
                    "status": "false"

                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"
                });
            }
        })

    }else if(id_code_membre == null && id_transactions != null && id_commentaires == null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_transactions`=' + id_transactions, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"

                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"

                });
            }
        })

    }else if(id_code_membre == null && id_transactions == null && id_commentaires != null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_commentaires`='+id_commentaires , (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"
                });
            }
        })

    }else if(id_code_membre != null && id_transactions != null && id_commentaires == null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_transactions`='+id_transactions+' and `id_code_membre`='+id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"

                });
            }
        })

    }else if(id_code_membre == null && id_transactions != null && id_commentaires != null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_commentaires`='+id_commentaires +' and id_transactions='+id_transactions, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"

                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"

                });
            }
        })
    }else if(id_code_membre != null && id_transactions == null && id_commentaires != null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_commentaires`='+id_commentaires +' and id_code_membre='+id_code_membre, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"
                });
            }
        })
    }else if(id_code_membre != null && id_transactions != null && id_commentaires != null){
        pool.query('SELECT * FROM `commentaires` WHERE `id_commentaires`='+id_commentaires +' and id_code_membre='+id_code_membre+' and id_transactions='+id_transactions, (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                console.log(rows)
                res.json({
                    "data": rows,
                    "status": "true"
                });
            }
        })
    }else{ // Par defaut renvoie tout
        pool.query('SELECT * FROM `commentaires` WHERE 1', (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    "status": "false"
                });
            }else{
                res.json({
                    "data":rows,
                    "status": "true"
                });
            }
        })
    }
});

// PUT COMMENTAIRES => A FAIRE
// Creation d'un nouveau comentaire dans la base
// id_transactions texte id_code_membre sont necessaires pour la création
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
                    erreur: err,
                    "status": "false"

                });
            } else {
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;

                pool.query('SELECT * FROM commentaires WHERE id_commentaires=' + id_new_transaction, (err, rows, fields) => {
                    if (err) {
                        return res.status(500).json({
                            erreur: err,
                            "status": "false"

                        });
                    } else {
                        console.log(rows)
                        res.json({
                            "data": rows,
                            "status": "true"

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



// POST COMMENTAIRES => OK
// Modification d'un nouveau comentaire dans la base
// La variable ID commentaire ne peut pas être modifiable.
app.post('/api/commentaires/', function(req, res) {

    console.log("POST /api/commentaires/")
    let id_commentaires = req.body.id_commentaires;
    let id_transactions = req.body.id_transactions;
    let texte = req.body.texte;
    let id_code_membre = req.body.id_code_membre;
    console.log(id_commentaires)

    if(id_commentaires==undefined){id_commentaires=null}
    if(id_transactions==undefined){id_transactions=null}
    if(texte==undefined){texte=null}
    if(id_code_membre==undefined){id_code_membre=null}

    console.log(id_commentaires)
    if(id_commentaires != null) {
        // OK
        if(id_transactions != null && texte == null && id_code_membre == null) {
                pool.query('UPDATE `commentaires` SET  `id_transactions`='+id_transactions+' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err
                    });
                } else {
                    pool.query('SELECT * FROM commentaires WHERE id_commentaires=' + id_commentaires, (err, rows, fields) => {
                        if (err) {
                            return res.status(500).json({
                                erreur: err,
                                "status": "false"

                            });
                        } else {
                            console.log(rows)
                            res.json({
                                "data": rows,
                                status: true,

                            });
                        }})
                }
            })
        // OK
        }else if(id_transactions == null && texte != null && id_code_membre == null){
            pool.query('UPDATE `commentaires` SET  `texte`=\''+texte+'\' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err,
                        "status": "false"


                    });
                } else {
                    pool.query('SELECT * FROM commentaires WHERE id_commentaires=' + id_commentaires, (err, rows, fields) => {
                        if (err) {
                            return res.status(500).json({
                                erreur: err,
                                "status": "false"

                            });
                        } else {
                            console.log(rows)
                            res.json({
                                "data": rows,
                                status: true,

                            });
                        }})
                }
            })
        // OK
        }else if(id_transactions == null && texte == null && id_code_membre != null){
            pool.query('UPDATE `commentaires` SET  `id_code_membre`='+id_code_membre+' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err,
                        "status": "false"
                    });
                } else {
                    pool.query('SELECT * FROM commentaires WHERE id_commentaires=' + id_commentaires, (err, rows, fields) => {
                        if (err) {
                            return res.status(500).json({
                                erreur: err
                            });
                        } else {
                            console.log(rows)
                            res.json({
                                "data": rows,
                                status: true,
                            });
                        }})
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
                    pool.query('SELECT * FROM commentaires WHERE id_commentaires=' + id_commentaires, (err, rows, fields) => {
                        if (err) {
                            return res.status(500).json({
                                erreur: err
                            });
                        } else {
                            console.log(rows)
                            res.json({
                                "data": rows,
                                status: true,
                            });
                        }})
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
                    pool.query('SELECT * FROM commentaires WHERE id_commentaires=' + id_commentaires, (err, rows, fields) => {
                        if (err) {
                            return res.status(500).json({
                                erreur: err
                            });
                        } else {
                            console.log(rows)
                            res.json({
                                "data": rows,
                                status: true,

                            });
                        }})
                }
            })
        // OK
        }else if(id_transactions != null && texte == null && id_code_membre != null){
            pool.query('UPDATE `commentaires` SET  `id_transactions`='+id_transactions+' , `id_code_membre`='+id_code_membre+' WHERE `id_commentaires`='+id_commentaires, (err, rows, fields) => {
                if (err) {
                    return res.status(500).json({
                        erreur: err,
                        "status": "false"

                    });
                } else {
                    pool.query('SELECT * FROM commentaires WHERE id_commentaires=' + id_commentaires, (err, rows, fields) => {
                        if (err) {
                            return res.status(500).json({
                                erreur: err
                            });
                        } else {
                            console.log(rows)
                            res.json({
                                "data": rows,
                                status: true,

                            });
                        }})
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
                    pool.query('SELECT * FROM commentaires WHERE id_commentaires=' + id_commentaires, (err, rows, fields) => {
                        if (err) {
                            return res.status(500).json({
                                erreur: err
                            });
                        } else {
                            console.log(rows)
                            res.json({
                                "data": rows,
                                status: true,
                            });
                        }})
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
                "status": "true",
                message: 'Import OK '
            });
        }
    }catch (err) {
        res.send({
            "status": "false",
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
                        erreur: err,
                        "status": "false"
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


//**************************Propositions************************************
// PUT NEW PROPOSITIONS => OK
app.put('/api/propositions/', function(req, res) {

    console.log("PUT /api/propositions/")

    let id_propositions = null;
    let id_code_membre = req.query.id_code_membre;
    let titre = req.query.titre;
    let desc = req.query.desc;
    let id_competences = req.query.id_competences;
    let date_debut = req.query.date_debut;
    let date_fin = req.query.date_fin;
    let lat = req.query.lat;
    let long = req.query.long;
    let id_new_transaction;

    if(id_code_membre==undefined){id_code_membre=null}
    if(titre==undefined){titre=null}
    if(desc==undefined){desc=null}
    if(id_competences==undefined){id_competences=null}
    if(date_debut==undefined){date_debut=undefined}
    if(date_fin==undefined){date_fin=undefined}
    if(lat==undefined){lat=0}
    if(long==undefined){long=0}

    if(date_debut!= undefined && date_fin!= undefined) {
        pool.query('INSERT INTO `propositions` (`id_code_membre`, `titre`, `desc`, `id_competences`, `date_debut`, `date_fin`, `lat`, `long`) VALUES (' + id_code_membre + ',' + titre + ',\'' + desc + '\',' + id_competences + ',\'' + date_debut + '\',\'' + date_fin + '\',' + lat + ',' + long + ')', (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;

                pool.query('SELECT * FROM propositions WHERE id_propositions=' + id_new_transaction, (err, rows, fields) => {
                    if (err) {
                        return res.status(500).json({
                            erreur: err,
                            "status": "false"
                        });
                    } else {
                        console.log(rows)
                        res.json({
                            "data": rows,
                            "status": "true",
                        });
                    }
                })
            }
        })
    }else if(date_debut== undefined && date_fin!= undefined){
        pool.query('INSERT INTO `propositions` (`id_code_membre`, `titre`, `desc`, `id_competences`, `date_fin`, `lat`, `long`) VALUES (' + id_code_membre + ',' + titre + ',\'' + desc + '\',' + id_competences + ',\'' + date_fin + '\',' + lat + ',' + long + ')', (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;

                pool.query('SELECT * FROM propositions WHERE id_propositions=' + id_new_transaction, (err, rows, fields) => {
                    if (err) {
                        return res.status(500).json({
                            erreur: err,
                            "status": "false"

                        });
                    } else {
                        console.log(rows)
                        res.json({
                            "data": rows,
                            "status": "true",

                        });
                    }
                })
            }
        })
    }else if(date_debut!= undefined && date_fin== undefined){
        pool.query('INSERT INTO `propositions` (`id_code_membre`, `titre`, `desc`, `id_competences`, `date_debut`, `lat`, `long`) VALUES (' + id_code_membre + ',' + titre + ',\'' + desc + '\',' + id_competences + ',\'' + date_debut + '\',' + lat + ',' + long + ')', (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"

                });
            } else {
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;

                pool.query('SELECT * FROM propositions WHERE id_propositions=' + id_new_transaction, (err, rows, fields) => {
                    if (err) {
                        return res.status(500).json({
                            erreur: err,
                            "status": "false"

                        });
                    } else {
                        console.log(rows)
                        res.json({
                            "data": rows,
                            "status": "true",

                        });
                    }
                })
            }
        })
    }else if(date_debut== undefined && date_fin== undefined){
        pool.query('INSERT INTO `propositions` (`id_code_membre`, `titre`, `desc`, `id_competences`, `lat`, `long`) VALUES (' + id_code_membre + ',' + titre + ',\'' + desc + '\',' + id_competences + ','+ lat + ',' + long + ')', (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err,
                    "status": "false"
                });
            } else {
                const transaction = rows;
                var string = JSON.stringify(transaction);
                var json = JSON.parse(string);
                id_new_transaction = json.insertId;

                pool.query('SELECT * FROM propositions WHERE id_propositions=' + id_new_transaction, (err, rows, fields) => {
                    if (err) {
                        return res.status(500).json({
                            erreur: err,
                            "status": "false"

                        });
                    } else {
                        console.log(rows)
                        res.json({
                            "data": rows,
                            "status": "true",

                        });
                    }
                })
            }
        })
    }else{
        res.json({
            "status": "false",
            "message": "erreur API",
        });
    }
});


// GET ALL TRANSACTIONS OR ONE TRANSACTIONS (WITHOUT SEARCH)
app.get('/api/propositions', function(req, res) {
    console.log("GET /api/propositions")
    const id_propositions = req.query.id_propositions;
    if(id_propositions){
        pool.query('SELECT * FROM `propositions` WHERE `id_propositions`='+id_propositions , (err, rows, fields) => {
            if(err){
                return res.status(500).json({
                    erreur:err,
                    status: false,
                });
            }else{
                console.log(rows)
                res.json({
                    "data":rows,
                    "status": "true"
                });
            }
        })
    }else{
        console.log(rows)
        res.json({
            "status":"false",
            "message":"Il manque l'id de la proposition !"
        });
    }
});


app.listen(port);
console.log('Server started at http://localhost:' + port);
