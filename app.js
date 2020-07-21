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

message = {
    error: "Ha habido un error en el servidor. Por favor, inténtalo más tarde.",
    no_result: "No he podido encontrar nada para lo que me has pedido.",
    
}

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
    try {
        var providers = await providersDict(await jw.getProviders());
        if (req.body.message.text && !req.body.message.text.startsWith('/')) {
            if (providers !== 500) {
                var searchResult = await jw.search({ query: req.body.message.text });
                resp = [];
                if (searchResult && searchResult['items'] && searchResult['items'].length > 0) {
                    var found = false;
                    for (result of searchResult['items']) {
                        if (result['title']) {
                            if (result['title'].toLowerCase() == req.body.message.text.toLowerCase()) {
                                if (result['offers'] && result['offers'].length > 0) {
                                    result['offers'].forEach(element => {
                                        if (!resp.includes(providers[element['provider_id']])) resp.push(providers[element['provider_id']])
                                    });
                                    sendMessage(req.body.message.chat.id, resp.join(', '));
                                    found = true;
                                } else {
                                    sendMessage(req.body.message.chat.id, "No he podido encontrar proveedores");
                                };
                                break
                            }
                        } else sendMessage(req.body.message.chat.id, message.error);
                    };
                    if (found == false) sendMessage(req.body.message.chat.id, message.no_result);
                } else sendMessage(req.body.message.chat.id, message.no_result);
            } else sendMessage(req.body.message.chat.id, message.error);
        } else if (req.body.message.text && req.body.message.text.includes("/start")) {
            sendMessage(req.body.message.chat.id, "Dime un título y te diré en qué plataforma de streaming puedes encontrarlo.");
        }
    } catch (e) {
        var notification = `ERROR:
        ${e}
        
        REQUEST:
        ${req.body}`;
        https.get(`https://api.telegram.org/bot${process.env.NOTIFIER_TOKEN}/sendMessage?chat_id=${process.env.NOTIFIER_ID}&parse_mode=Markdown&text=${notification}`);
        sendMessage(req.body.message.chat.id, message.error);
    } finally {
        res.end();
    }
});

module.exports = app;
