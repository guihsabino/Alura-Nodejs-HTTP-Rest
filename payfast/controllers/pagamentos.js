module.exports = function (app) {
    app.get('/pagamentos', function (req, resp) {
        console.log('Recebida requisição de pagamentos na porta 3000!')
        resp.send('OK!')
    });


    app.delete('/pagamentos/pagamento/:id', function (req, resp) {
        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CANCELADO';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, function (erro) {
            if (erro) {
                resp.status(500).send(erro);
                return;
            }
            console.log('Pagamento Cancelado!');
            resp.status(204).send(pagamento);
        });
    });

    app.put('/pagamentos/pagamento/:id', function (req, resp) {
        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CONFIRMADO';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, function (erro) {
            if (erro) {
                resp.status(500).send(erro);
                return;
            }
            console.log('Pagamento Confirmado!');
            resp.send(pagamento);
        });
    });

    app.post('/pagamentos/pagamento', function (req, resp) {

        var body = req.body;
        var pagamento = body['pagamento'];

        req.assert("pagamento.forma_de_pagamento", "Forma de pagamento é obrigatória.").notEmpty();
        req.assert("pagamento.valor", "Valor é obrigatório e deve ser um decimal.").notEmpty().isFloat();
        req.assert("pagamento.moeda", "Moeda é obrigatória e deve ter 3 caracteres").notEmpty().len(3, 3);

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
                pagamento.id = resultado.insertId;
                console.log('pagamento criado com sucesso!');
                resp.location('/pagamentos/pagamento/' + pagamento.id);

                if (pagamento.forma_de_pagamento == 'cartao') {
                    var cartao = req.body["cartao"];
                    console.log(cartao);

                    var clienteCartoes = new app.servicos.clienteCartoes();

                    clienteCartoes.autoriza(cartao,
                        function (exception, request, response, retorno) {
                            if (exception) {
                                console.log(exception);
                                res.status(400).send(exception);
                                return;
                            }
                            console.log(retorno);

                            res.location('/pagamentos/pagamento/' +
                                pagamento.id);

                            // Definindo o que pode ser feito após a criação do pagamento
                            var response = {
                                dados_do_pagamanto: pagamento,
                                cartao: retorno,
                                links: [
                                    {
                                        href: "http://localhost:3000/pagamentos/pagamento/"
                                            + pagamento.id,
                                        rel: "confirmar",
                                        method: "PUT"
                                    },
                                    {
                                        href: "http://localhost:3000/pagamentos/pagamento/"
                                            + pagamento.id,
                                        rel: "cancelar",
                                        method: "DELETE"
                                    }
                                ]
                            }

                            res.status(201).json(response);
                            return;
                        });


                } else {
                    res.location('/pagamentos/pagamento/' +
                        pagamento.id);

                    var response = {
                        dados_do_pagamanto: pagamento,
                        links: [
                            {
                                href: "http://localhost:3000/pagamentos/pagamento/"
                                    + pagamento.id,
                                rel: "confirmar",
                                method: "PUT"
                            },
                            {
                                href: "http://localhost:3000/pagamentos/pagamento/"
                                    + pagamento.id,
                                rel: "cancelar",
                                method: "DELETE"
                            }
                        ]
                    }

                    res.status(201).json(response);
                }
            }
        });

    });
}
