// GET ALL TRANSACTIONS ARROUND ME
app.get('/api/v2/transactions/localisation', function(req, res) {
    console.log("GET /api/transactions/localisation")
    const maLat = req.query.lat;
    const maLong = req.query.long;

    if(maLat!= undefined && maLong!=undefined){
        pool.query('SELECT id_propositions, 1.60934*( 3959 * acos( cos( radians('+maLat+') ) * cos( radians( lat ) ) * cos( radians( longue ) - radians('+maLong+') ) + sin( radians('+maLat+') ) * sin( radians( lat ) ) ) ) AS distance FROM propositions LIMIT 5', async (err, rows, fields) => {
            if (err) {
                return res.status(500).json({
                    erreur: err
                });
            } else {
                var string = JSON.stringify(rows);
                var json = JSON.parse(string);
                var ret = [];


                function resolveAfter2Seconds(x) {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            //resolve(x);
                            for (var i = 0; i < 5; i++) {

                                pool.query('SELECT * FROM `propositions` WHERE `id_propositions`=' + json[i].id_propositions, (err, row, fields) => {
                                    if (err) {
                                        return res.status(500).json({
                                            erreur: err
                                        });
                                    } else {
                                        //console.log("date:"+fields)
                                        //console.log(row)
                                        var string = JSON.stringify(row);
                                        //console.log('>> string: ', string );
                                        var json2 = JSON.parse(string);
                                        console.log(json2[0])
                                        ret.push(json2[0]);

                                    }
                                })

                            }

                        }, 5000);
                    });
                }

                var x = await resolveAfter2Seconds(10);


                console.log('rrrrrrrrrrrr')
                console.log(ret)

                res.json({
                    "data": ret
                });
            }
        })


    }else{
        console.log("les donnes sont pas definie ")
        res.json({
            "data":"",
            "Message":"Il manque un arguement lat ou long"
        });
    }
});
