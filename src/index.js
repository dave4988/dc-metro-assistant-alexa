/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var https = require('https');

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

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

MetroAssistant.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("MetroAssistant onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

MetroAssistant.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("MetroAssistant onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

MetroAssistant.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("MetroAssistant onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

/**
 * override intentHandlers to map intent handling functions.
 */

MetroAssistant.prototype.intentHandlers = {
    // register custom intent handlers
    "OneshotNextTrainIntent": function (intent, session, response) {
        console.log("response: " + handleOneshotNextTrainRequest(intent, session, response));
        handleOneshotNextTrainRequest(intent, session, response);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the MetroAssistant skill.
    var metroAssistant = new MetroAssistant();
    metroAssistant.execute(event, context);
};

/*
* App specific business logic
*/

function handleWelcomeRequest(response) {
    var whichStationPrompt = "Which station would you like train information for?",
        speechOutput = {
            speech: "Welcome to DC Metro Assistant. " + whichStationPrompt,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        },
        repromptOutput = {
            speech: " I can lead you through providing a station "
                + "to get information about upcoming trains, "
                + "or you can simply ask me a question like, "
                + "ask the metro when the next train to Rosslyn is coming. "
                + whichStationPrompt,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleHelpRequest(response) {
    var repromptText = "Which station would you like tide information for?";
    var speechOutput = "You can ask me a question like, "
        + "when is the next train for Rosslyn coming?"
        + repromptText;

    response.ask(speechOutput, repromptText);
}

function handleOneshotNextTrainRequest(intent, session, response) {

    // Determine station. reprompt if not understood
    var station = getStationFromIntent(intent),
        repromptText,
        speechOutput;
    if (station.error) {
        // invalid station
        repromptText = "Please try again with a valid station name. Examples are Rosslyn, Chinatown, or Shaw.";
        speechOutput = station.station ? "I'm sorry, I cannot match your input of " + station.station + " with any current metro station. " + repromptText : repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }
    // all slots filled
    getFinalNextTrainResponse(intent, station, response);
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getFinalNextTrainResponse(intent, station, response) {

    // Issue the request, and respond to the user
    makeNextTrainRequest(station, function nextTrainResponseCallback(err, nextTrainResponse) {
        var speechOutput;
        if (err) {
            speechOutput = "Sorry, the DC Metro Service is experiencing a problem. Please try again";
        } else {
            speechOutput = "The next trains arriving at the " + intent.slots.Station.value + " station are as follows. ";
            var trains = nextTrainResponse.Trains;
            for (var i=0 ; i < trains.length ; i++) {
                //TODO add line (it's annoying because its BL instead of blue so will need enum)
                if (trains[i].Min !== null && trains[i].Min && trains[i].Min !== 'ARR' && trains[i].Min !== 'BRD') {
                    speechOutput += " Train to " + trains[i].DestinationName + " arriving in " + trains[i].Min + " minutes.";
                }
            }
        }
        response.tell(speechOutput);
    });
}

function makeNextTrainRequest(station, nextTrainResponseCallback) {
    //TODO go to the metro API and get data based on station
    //TODO store this somewhere that won't get put in github
    var primaryKey = "8a852881d76b4239a4bb08365b8bd114";
    var host = 'api.wmata.com';
    var path = '/StationPrediction.svc/json/GetPrediction/' + station.station

    var options = {
        host: host,
        path: path,
        method: 'GET',
        headers: {
            'api_key': primaryKey
        }
    }

    callback = function(response) {
        var responseString = '';
        response.on('data', function (chunk) {
            responseString += chunk;
        });
        response.on('error', function (e){
            return nextTrainResponseCallback(new Error(e.message));
        });
        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            var responseJson = JSON.parse(responseString);
            return nextTrainResponseCallback(null, responseJson);
        });
    }

    https.request(options, callback).end();
}

function getStationFromIntent(intent) {
    console.log('made it to the getStationFromIntent');
    var stationSlot = intent.slots.Station;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    console.log('the station requested from the intent is ' + intent.slots.Station.value);
    if (!stationSlot || !stationSlot.value) {
        return {
            error: true
        }
    } else {
        // lookup the station
        var stationName = stationSlot.value;
        if (STATIONS[stationName.toLowerCase()]) {
            return {
                station: STATIONS[stationName.toLowerCase()]
            }
        } else {
            return {
                error: true,
                station: stationName
            }
        }
    }
}

//TODO change to grab from API. changes so little that it's not worth it now tho
//found here: https://developer.wmata.com/docs/services/5476364f031f590f38092507/operations/5476364f031f5909e4fe3311
var STATIONS = {
    "metro center": "A01",
    "farragut north": "A02",
    "dupont circle": "A03",
    "woodley park-zoo/adams morgan": "A04",
    "woodley park": "A04",
    "adams morgan": "A04",
    "zoo": "A04",
    "cleveland Park": "A05",
    "van ness-udc": "A06",
    "tenleytown-au": "A07",
    "tenleytown": "A07",
    "friendship heights": "A08",
    "bethesda": "A09",
    "medical center": "A10",
    "grosvenor-strathmore": "A11",
    "grosvenor": "A11",
    "strathmore": "A11",
    "white flint": "A12",
    "twinbrook": "A13",
    "rockville": "A14",
    "shady grove": "A15",
    "gallery pl-chinatown": "B01",
    "gallery place": "B01",
    "chinatown": "B01",
    "judiciary square": "B02",
    "union station": "B03",
    "rhode island ave-brentwood": "B04",
    "rhode island": "B04",
    "rhode island avanue": "B04",
    "brentwood": "B04",
    "brookland-cua": "B05",
    "brookland": "B05",
    "fort totten": "B06",
    "takoma": "B07",
    "silver spring": "B08",
    "forest glen": "B09",
    "wheaton": "B10",
    "glenmont": "B11",
    "noma-gallaudet u": "B35",
    "noma": "B35",
    "gallaudet": "B35",
    "metro center": "C01",
    "mcpherson square": "C02",
    "mcpherson": "C02",
    "farragut west": "C03",
    "foggy bottom": "C04",
    "rosslyn": "C05",
    "arlington cemetery": "C06",
    "pentagon": "C07",
    "pentagon city": "C08",
    "crystal city": "C09",
    "ronald reagan washington national airport": "C10",
    "national": "C10",
    "airport": "C10",
    "reagan": "C10",
    "braddock road": "C12",
    "king st-old town": "C13",
    "king st": "C13",
    "old town": "C13",
    "eisenhower avenue": "C14",
    "huntington": "C15",
    "federal triangle": "D01",
    "smithsonian": "D02",
    "lenfant Plaza": "D03",
    "federal center sw": "D04",
    "federal center": "D04",
    "capitol south": "D05",
    "cap south": "D05",
    "eastern market": "D06",
    "potomac ave": "D07",
    "stadium-armory": "D08",
    "minnesota ave": "D09",
    "minnesota": "D09",
    "deanwood": "D10",
    "cheverly": "D11",
    "landover": "D12",
    "new carrollton": "D13",
    "mount vernon square": "E01",
    "mount vernon": "E01",
    "convention center": "E01",
    "shaw-howard u": "E02",
    "shaw": "E02",
    "howard university": "E02",
    "u street": "E03",
    "columbia heights": "E04",
    "georgia ave-petworth": "E05",
    "georgia ave": "E05",
    "fort totten": "E06",
    "west hyattsville": "E07",
    "prince george's plaza": "E08",
    "college park-u of md": "E09",
    "college park": "E09",
    "greenbelt": "E10",
    "archives": "F02",
    "waterfront": "F04",
    "navy yard": "F05",
    "anacostia": "F06",
    "congress heights": "F07",
    "southern avenue": "F08",
    "naylor road": "F09",
    "suitland": "F10",
    "branch ave": "F11",
    "benning road": "G01",
    "capitol heights": "G02",
    "addison road": "G03",
    "morgan boulevard": "G04",
    "largo town center": "G05",
    "largo": "G05",
    "van dorn street": "J02",
    "franconia springfield": "J03",
    "court house": "K01",
    "clarendon": "K02",
    "virginia square": "K03",
    "ballston": "K04",
    "east falls church": "K05",
    "west falls church": "K06",
    "dunn loring": "K07",
    "vienna": "K08",
    "mclean": "N01",
    "tysons corner": "N02",
    "greensboro": "N03",
    "spring hill": "N04",
    "wiehle-reston": "N06",
    "wiehle": "N06" 
};