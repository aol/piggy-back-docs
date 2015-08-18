var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var app     = express();

app.get('/scrape', function(req, res){
        
        //All the web scraping magic will happen here
        
        })

app.use(express.static(__dirname + '/'));
app.listen('8081')

console.log('Magic happens on port 8081');

exports = module.exports = app;