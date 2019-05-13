
module.exports = function (app) {
    app.get('/pagamentos', function (req, resp) {
        console.log('Recebida requisição de pagamentos na porta 3000!')
        resp.send('OK!')
    });

    app.post('/pagamentos/pagamento', function (req, resp) {


        req.assert("forma_de_pagamento", "Forma de pagamento é obrigatória!").notEmpty();
        req.assert("valor", "Valor é obrigatório, e deve ser um decimal!").notEmpty().isFloat();

        // Pedindo pro request mostrar quais os erros de validação que ele encontrou
        var erros = req.validationErrors();

        if (erros) {
            console.log('Erros de validação encontrados!');
            resizeBy.status(400).send(erros);
            return;
        }

        // Enviando corpo da requisição
        var pagamento = req.body;
        console.log('processando uma requisiçao de um novo pagamento');

        pagamento.status = 'Criado!';
        pagamento.data = new Date();

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.salva(pagamento, function (erro, resultado) {
            if (erro) {
                console.log('erro ao inserir no banco: ' + erro);
                resp.status(500).send(erro);
            } else {
                console.log('pagamento criado com sucesso!');
                resp.location('/pagamentos/pagamento/' + resultado.insertId);

                resp.status(201).json(pagamento);
            }
        });
    });
}