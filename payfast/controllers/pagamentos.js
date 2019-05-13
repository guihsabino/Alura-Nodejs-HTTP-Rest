
module.exports = function (app) {
    app.get('/pagamentos', function (req, resp) {
        console.log('Recebida requisição de pagamentos na porta 3000!')
        resp.send('OK!')
    });

    app.post('/pagamentos/pagamento', function (req, resp) {
        // Enviando corpo da requisição
        var pagamento = req.body;
        console.log(pagamento);
        resp.send('OK!')
    });
}