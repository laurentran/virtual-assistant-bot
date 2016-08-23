var http = require('http');
var request = require('request');

var query = 'pokemon';
var count = 1;
var url = 'https://api.cognitive.microsoft.com/bing/v5.0/search?q='+query+'&count=1&mkt=en-us&safesearch=Strict'; 
var apiKey = 'API_KEY';

request({
    url: url,
    headers: { 
        'Ocp-Apim-Subscription-Key': apiKey
    }
}, function(error, response, body){
    if(error) {
        console.log(error);
    } else {
        result = JSON.parse(body);
        resultName = result['webPages']['value'][0]['name'];
        resultUrl = result['webPages']['value'][0]['url'];
        console.log(response.statusCode, resultName, resultUrl);
    }
});