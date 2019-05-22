var restify = require('restify');

var cliente = restify.createJsonClient({
    url: 'http://localhost:3001'
});

cliente.post('/cartoes/autoriza', {},
    function (erro, req, resp, retorno) {
        console.log('consumindo serviço de cartões');
        console.log(retorno);
    });