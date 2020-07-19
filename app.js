var https = require('https')
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var JustWatch = require('justwatch-api');
const { send } = require('process');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

function providersDict(object) {
    return new Promise((res, rej) => {
        try {
            let result = {}
            for (provider of object) {
                result[provider['id']] = provider['clear_name']
            }
            res(result)
        } catch (e) {
            rej(500);
        }
    })
};

function sendMessage(chat, text) {
    https.get(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${chat}&parse_mode=Markdown&text=${text}`);
};

var jw = new JustWatch({ locale: 'es_ES' })
app.post(`/${process.env.TELEGRAM_TOKEN}`, async (req, res) => {
    var providers = await providersDict(await jw.getProviders());
    if (!req.body.message.text.startsWith('/') && req.body.message.from.is_bot == false) {
        if (providers !== 500) {
            var searchResult = await jw.search({ query: req.body.message.text });
            resp = [];
            for (result of searchResult['items']) {
                if (result['title'].toLowerCase() == req.body.message.text.toLowerCase()) {
                    if (result['offers'] && result['offers'].length > 0) {
                        result['offers'].forEach(element => {
                            if (!resp.includes(providers[element['provider_id']])) resp.push(providers[element['provider_id']])
                        });
                        sendMessage(req.body.message.chat.id, resp.join(', '))
                        res.sendStatus(200);
                    } else {
                        sendMessage(req.body.message.chat.id, "No he podido encontrar proveedores");
                        res.sendStatus(200);
                    };
                    break
                };
            };
            if (resp.length < 1) {
                sendMessage(req.body.message.chat.id, "No he podido encontrar lo que buscas")
                res.sendStatus(200);
            }
        } else {
            sendMessage(req.body.message.chat.id, "ERROR");
            res.sendStatus(200)
        }
    }
    res.end();
});

module.exports = app;
