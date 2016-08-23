var restify = require('restify'),
    builder = require('botbuilder'),
    nconf   = require('nconf');

// Create nconf environment to load keys and connections strings
// which should not end up on GitHub
    nconf 
        .file({ file: './config.json' }) 
        .env(); 

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: nconf.get("MICROSOFT_APP_ID"),
    appPassword: nconf.get("MICROSOFT_APP_PASSWORD")
});

var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());
server.get(/.*/, restify.serveStatic({
    'directory' : '.',
    'default'   : 'index.html'
}));

//=========================================================
// Bots Dialogs
//=========================================================

// Create LUIS recognizer that points at our model
var model = nconf.get("LUIS_model_URL");
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IzntentDialog({ recognizers: [recognizer] });

bot.dialog('/', intents);

intents
    .onBegin(builder.DialogAction.send("Hi, I'm your startup assistant!"))
    // Simple regex commands
    .matches(/^hello/i, function (session) {
        session.send("Hi there!");
    })
    .matches(/^help/i, function (session) {
        session.send("You asked for help.");
    })
    //LUIS intent matches
    .matches('AzureCompliance', '/compliance')
    //.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand, but I'm learning."));

bot.dialog('/compliance', function (session, args) {
    session.send("You asked about Azure Compliance.");
    session.endDialog();
});