// GET ALL TRANSACTIONS OR ONE TRANSACTIONS (WITHOUT SEARCH)
app.get('/api/transactions/search', async function(req, res) {

    console.log("GET /api/transactions/search")
    let query = 'SELECT * FROM `transactions` WHERE ';
    let nbArgs=0;
    for (const key in req.query) {
        nbArgs++;
        console.log(key+" = "+req.query[key])
    }
    console.log("Debut de la boucle :")
    let i = nbArgs;
    for (const key in req.query) {
        console.log(key, req.query[key])
        if(i==1){
            query= query +"`"+key+"`="+req.query[key]+" ";
        }else if(i==2){
            query = query +"`"+key+"`="+req.query[key]+" and ";
        }else if(i==3){
            query = query +"`"+key+"`="+req.query[key]+" and ";
        }else if(i==4){
            query = query +"`"+key+"`="+req.query[key]+" and ";
        }else if(i==5){
            query = query +"`"+key+"`="+req.query[key]+" and ";
        }else if(i==6){
            query = query +"`"+key+"`="+req.query[key]+" and ";
        }else if(i==7){
            query = query +"`"+key+"`="+req.query[key]+" and ";
        }else if(i==8){
            query = query +"`"+key+"`="+req.query[key]+" and ";
        }else if(i==9){
            query = query +"`"+key+"`="+req.query[key]+" and ";
        }else{
            console.log("jsp")
        }
        i--;
    }
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