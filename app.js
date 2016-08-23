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
    //.onBegin(builder.DialogAction.send("Hi, I'm your startup assistant!"))
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
    .onDefault('/didnotunderstand');

bot.dialog('/compliance', [
    function (session, args) {
        builder.Prompts.confirm(session, "You asked about Azure Compliance. Is that correct?");
    },
    function (session, results) {
        if (results.response.toLowerCase() == 'y' || results.response.toLowerCase() == 'yes') {
            session.send("Ok, I'm getting the hang of things.");
        } else {
            session.send("Darn. Ok, I've logged this for review.");
        }        
        session.endDialog();
    }
 
]);
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
bot.dialog('/didnotunderstand', [
    function (session, args) {
        builder.Prompts.text(session, "I'm sorry. I didn't understand, but I'm learning. What was your intent here?");
        
    }, 
    function (session, results) {
        console.log(session.message.text);
        session.send("Ok, I've logged this for review. Please ask another question.");
        session.endDialog();
    }
]);

// Install First Run middleware and dialog
bot.use(builder.Middleware.firstRun({ version: 1.0, dialogId: '*:/firstRun' }));
bot.dialog('/firstRun', [
    function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
    },
    function (session, results) {
        // We'll save the users name and send them an initial greeting. All 
        // future messages from the user will be routed to the root dialog.
        session.userData.name = results.response;
        session.endDialog("Hi %s, ask me a startup question and I'll try to correctly map it to an intent.", session.userData.name); 
    }
]);