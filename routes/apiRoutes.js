module.exports = function(app){
    app.post('/api/image', function(req, res) {
        let imagedata = req.body.data.split(',')[1];
        fs.writeFile('./client/img/test.png', imagedata, 'base64', function(err) {
            if (err) {
                throw err
                res.send(500)
            }
            console.log('File saved.')
            res.send(200)
        })
    })
};
