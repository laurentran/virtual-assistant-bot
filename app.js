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
server.get('/', restify.serveStatic({
    'directory' : '.',
    'default'   : 'static/index.html'
}));

//=========================================================
// Bots Dialogs
//=========================================================

// Create LUIS recognizer that points at our model
var model = nconf.get("LUIS_model_URL");
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

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
    .matches('OfficeHours', '/officehours')
    .matches('SupportRequest', '/support')
    .matches('Documentation', '/documentation')
    .matches('Rude', '/rude')
    .onDefault(builder.DialogAction.send("I'm sorry. I didn't understand, but I'm learning."));

bot.dialog('/compliance', function (session, args) {
    session.send("You asked about Azure Compliance.");
    session.endDialog();
});
bot.dialog('/officehours', function (session, args) {
    session.send("It seems like you want to schedule office hours.");
    session.endDialog();
});
bot.dialog('/support', function (session, args) {
    session.send("Sounds like you're having a problem. This is a support request.");
    session.endDialog();
});
bot.dialog('/documentation', function (session, args) {
    session.send("It sounds like you're asking for documentation.");
    session.endDialog();
});
bot.dialog('/rude', function (session, args) {
    session.send("Well, you're just being rude.");
    session.endDialog();
});