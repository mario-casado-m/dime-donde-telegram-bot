var express = require('express');
var router = express.Router();
var JustWatch = require('justwatch-api')
var jw = new JustWatch({locale: 'es_ES'})

function providersDict(object) {
  return new Promise((res, rej) => {
    try {
      let result = {}
      for (provider of object) {
        result[provider['id']] = provider['clear_name']
      }
      res(result)
    } catch (error) {
      throw Error(error)
    }
  })
}

router.get('/', async function (req, res) {
  var providers = await providersDict(await jw.getProviders());
  var searchResult = await jw.search({ query: req.query.q });
  resp = [];
  searchResult['items'][0]['offers'].forEach(element => {
    if (! resp.includes(providers[element['provider_id']])) resp.push(providers[element['provider_id']])
  });
  res.json(resp);
});

module.exports = router;
