var fs = require('fs');

fs.readFile('imagem.jpg', function (erro, buffer) {
    console.log('Arquivo lido!');

    fs.writeFile('imagem2.jpg', buffer, function () {
        console.log('Arquivo escrito!');
    });
});
