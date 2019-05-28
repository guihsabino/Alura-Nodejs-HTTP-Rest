var fs = require('fs');

module.exports = function (app) {
    app.post('/upload/imagem', function (req, resp) {
        console.log('Recebendo imagem!');

        var filename = req.headers.filename;
        req.pipe(fs.createWriteStream('files/' + filename))
            .on('finish', function () {
                console.log('Arquivo escrito com sucesso!');
                resp.status(201).send('OK');
            });
    });
}