var express = require('express');
var router = express.Router();
var JustWatch = require('justwatch-api')
var jw = new JustWatch({ locale: 'es_ES' })

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
}

router.get('/', async function (req, res) {
  var providers = await providersDict(await jw.getProviders());
  if (providers !== 500) {
    var searchResult = await jw.search({ query: req.query.q });
    resp = [];
    for (result of searchResult['items']) {
      if (result['title'].toLowerCase() == req.query.q.toLowerCase()) {
        result['offers'].forEach(element => {
          if (!resp.includes(providers[element['provider_id']])) resp.push(providers[element['provider_id']])
        });
        res.json(resp).end();
      };
    };
    if (resp.length < 1) res.sendStatus(404);
  } else {
    res.sendStatus(500);
  }
});

module.exports = router;
