var express = require('express');
var consign = require('consign');
var bodyParser = require('body-parser');

module.exports = function () {
    var app = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Define o que deve ser inserido na variável app
    consign()
        .include('controllers')
        .into(app);

    return app;
}
