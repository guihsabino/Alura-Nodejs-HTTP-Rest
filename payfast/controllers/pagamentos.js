var logger = require('../servicos/logger.js');

module.exports = function (app) {
    app.get('/pagamentos', function (req, resp) {
        console.log('Recebida requisição de pagamentos na porta 3000!')
        logger.info('Recebida requisição de pagamentos na porta 3000!')
        resp.send('OK!')
    });

    app.get('/pagamentos/pagamento/:id', function (req, resp) {
        var id = req.params.id;
        console.log('Consultando pagamento: ' + id);
        logger.info('Consultando pagamento: ' + id);

        var memcachedClient = app.servicos.memcachedClient();

        memcachedClient.get('pagamento-' + id, function (erro, retorno) {
            if (erro || !retorno) {
                console.log('MISS - chave nao encontrada');
                logger.info('MISS - chave nao encontrada');

                var connection = app.persistencia.connectionFactory();
                var pagamentoDao = new app.persistencia.PagamentoDao(connection);

                pagamentoDao.buscaPorId(id, function (erro, resultado) {
                    if (erro) {
                        console.log('erro ao consultar no banco: ' + erro);
                        logger.info('erro ao consultar no banco: ' + erro);
                        resp.status(500).send(erro);
                        return;
                    }
                    console.log('pagamento encontrado: ' + JSON.stringify(resultado));
                    logger.info('pagamento encontrado: ' + JSON.stringify(resultado));
                    resp.json(resultado);
                    return;
                });
                //HIT no cache
            } else {
                console.log('HIT - valor: ' + JSON.stringify(retorno));
                logger.info('HIT - valor: ' + JSON.stringify(retorno));
                resp.json(retorno);
                return;
            }
        });

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
            logger.info('Pagamento Cancelado!');
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
            logger.info('Pagamento Confirmado!');
            resp.send(pagamento);
        });
    });

    app.post('/pagamentos/pagamento', function (req, resp) {

        req.assert("pagamento.forma_de_pagamento",
            "Forma de pagamento eh obrigatorio").notEmpty();
        req.assert("pagamento.valor",
            "Valor eh obrigatorio e deve ser um decimal")
            .notEmpty().isFloat();

        // Pedindo pro request mostrar quais os erros de validação que ele encontrou
        var erros = req.validationErrors();

        if (erros) {
            console.log('Erros de validação encontrados!');
            logger.info('Erros de validação encontrados!');
            resizeBy.status(400).send(erros);
            return;
        }

        // Enviando corpo da requisição
        var pagamento = req.body["pagamento"];
        console.log('processando uma requisicao de um novo pagamento');
        logger.info('processando uma requisicao de um novo pagamento');

        pagamento.status = 'Criado!';
        pagamento.data = new Date();

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.salva(pagamento, function (erro, resultado) {
            if (erro) {
                console.log('erro ao inserir no banco: ' + erro);
                logger.info('erro ao inserir no banco: ' + erro);
                resp.status(500).send(erro);
            } else {
                pagamento.id = resultado.insertId;
                console.log('pagamento criado com sucesso!');
                logger.info('pagamento criado com sucesso!');

                var memcachedClient = app.servicos.memcachedClient();
                memcachedClient.set('pagamento-' + pagamento.id, pagamento, 6000, function (erro) {
                    console.log("Nova chave adicionada ao cache: pagamento-" + pagamento.id);
                    logger.info("Nova chave adicionada ao cache: pagamento-" + pagamento.id);
                });

                if (pagamento.forma_de_pagamento == 'cartao') {
                    var cartao = req.body["cartao"];
                    console.log(cartao);

                    var clienteCartoes = new app.servicos.clienteCartoes();

                    clienteCartoes.autoriza(cartao,
                        function (exception, request, response, retorno) {
                            if (exception) {
                                console.log(exception);
                                logger.info(exception);
                                resp.status(400).send(exception);
                                return;
                            }
                            console.log(retorno);
                            logger.info(retorno);

                            resp.location('/pagamentos/pagamento/' +
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

                            resp.status(201).json(response);
                            return;
                        });


                } else {
                    resp.location('/pagamentos/pagamento/' +
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

                    resp.status(201).json(response);
                }
            }
        });

    });
}
