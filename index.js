const express = require('express');
const mysql = require("mysql");
const app = express();
const port = process.env.PORT || 8888;
const bodyParser = require('body-parser')
const {stringify} = require("nodemon/lib/utils");

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
app.use(express.urlencoded({ extended: true }));


// GET AUTHENTIFICATION
app.get('/api/auth/sign', function(req, res) {

    const pseudo = req.query.pseudo;
    const mdp = req.query.mdp;
    const token = generateRandomString(16);

    console.log("GET /api/auth/sign")
    console.log("DATA pseudo="+pseudo+" mdp="+mdp)

    pool.query('SELECT * FROM `membres` WHERE `pseudo`="'+pseudo+'" and mdp="'+mdp+'"' , (err, rows, fields) => {
        if(err){
            return res.status(500).json({
                erreur:err
            });
        }else{
            const user = rows[0];
            if(user){
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


// GET ALL TRANSACTIONS OR ONE TRANSACTIONS
app.get('/api/transactions', function(req, res) {
    console.log("GET /api/transactions")
    const id = req.query.id;
    if(id){
        pool.query('SELECT * FROM transactions WHERE id_transactions='+id , (err, rows, fields) => {
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


// PUT NEW TRANSACTIONS
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


// POST NEW TRANSACTIONS
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
            console.log(rows)
            console.log("ro")
            res.json({
                "data":rows
            });
        }
    })
});




app.listen(port);
console.log('Server started at http://localhost:' + port);
