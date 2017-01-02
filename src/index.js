/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * MetroAssistant is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var MetroAssistant = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
MetroAssistant.prototype = Object.create(AlexaSkill.prototype);
MetroAssistant.prototype.constructor = MetroAssistant;

MetroAssistant.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("MetroAssistant onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

MetroAssistant.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("MetroAssistant onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to DC Metro Assistant. You can ask for the next train.";
    var repromptText = "You can ask for the next train";
    response.ask(speechOutput, repromptText);
};

MetroAssistant.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("MetroAssistant onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

MetroAssistant.prototype.intentHandlers = {
    // register custom intent handlers
    "NextTrainIntent": function (intent, session, response) {
        response.tell("The next train to Largo Town Center will arrive in 5 minutes");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the MetroAssistant skill.
    var metroAssistant = new MetroAssistant();
    metroAssistant.execute(event, context);
};

