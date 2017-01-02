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
            speech: "I can lead you through providing a station "
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
        + "when is the next train for Rosslyn coming"
        + repromptText;

    response.ask(speechOutput, repromptText);
}

function handleOneshotNextTrainRequest(intent, session, response) {

    // Determine station. reprompt if not understood
    var station = getStationFromIntent(intent, true),
        repromptText,
        speechOutput;
    console.log("station parsed to be " + station);
    if (station.error) {
        // invalid station. move to the dialog
        repromptText = "I did not understand the station you requested. "
            + "Which station would you like train information for?";
        response.ask(speechOutput, repromptText);
        return;
    }
    // all slots filled
    getFinalNextTrainResponse(station, response);
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getFinalNextTrainResponse(station, response) {

    // Issue the request, and respond to the user
    makeNextTrainRequest(station, function nextTrainResponseCallback(err, nextTrainResponse) {
        var speechOutput;
        if (err) {
            speechOutput = "Sorry, the DC Metro Service is experiencing a problem. Please try again";
        } else {
            //TODO use actual response data
            speechOutput = "The next trains are as follows. Blue line train to Largo arrives in 6 minutes. "
            + "Orange line train to Vienna arrives in 3 minutes";
        }
        response.tell(speechOutput);
    });
}

function makeNextTrainRequest(station, nextTrainResponseCallback) {
    //TODO go to the metro API and get data based on station
    nextTrainResponseCallback(null, "doesnt matter for now");
}

function getStationFromIntent(intent, assignDefault) {


    //TODO i don't think the station fetch is actually working
    var stationSlot = intent.slots.Station;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!stationSlot || !stationSlot.value) {
        if (!assignDefault) {
            return {
                error: true
            }
        } else {
            // For sample , default to Rosslyn.
            return {
                station: STATIONS.Rosslyn
            }
        }
    } else {
        // lookup the station
        var stationName = stationSlot.value;
        console.log("Station slot parsed to be " + stationName);
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
    "Metro Center": "A01",
    "Farragut North": "A02",
    "Dupont Circle": "A03",
    "Woodley Park-Zoo/Adams Morgan": "A04",
    "Cleveland Park": "A05",
    "Van Ness-UDC": "A06",
    "Tenleytown-AU": "A07",
    "Friendship Heights": "A08",
    "Bethesda": "A09",
    "Medical Center": "A10",
    "Grosvenor-Strathmore": "A11",
    "White Flint": "A12",
    "Twinbrook": "A13",
    "Rockville": "A14",
    "Shady Grove": "A15",
    "Gallery Pl-Chinatown": "B01",
    "Judiciary Square": "B02",
    "Union Station": "B03",
    "Rhode Island Ave-Brentwood": "B04",
    "Brookland-CUA": "B05",
    "Fort Totten": "B06",
    "Takoma": "B07",
    "Silver Spring": "B08",
    "Forest Glen": "B09",
    "Wheaton": "B10",
    "Glenmont": "B11",
    "NoMa-Gallaudet U": "B35",
    "Metro Center": "C01",
    "McPherson Square": "C02",
    "Farragut West": "C03",
    "Foggy Bottom-GWU": "C04",
    "rosslyn": "C05",
    "Arlington Cemetery": "C06",
    "Pentagon": "C07",
    "Pentagon City": "C08",
    "Crystal City": "C09",
    "Ronald Reagan Washington National Airport": "C10",
    "Braddock Road": "C12",
    "King St-Old Town": "C13",
    "Eisenhower Avenue": "C14",
    "Huntington": "C15",
    "Federal Triangle": "D01",
    "Smithsonian": "D02",
    "L'Enfant Plaza": "D03",
    "Federal Center SW": "D04",
    "Capitol South": "D05",
    "Eastern Market": "D06",
    "Potomac Ave": "D07",
    "Stadium-Armory": "D08",
    "Minnesota Ave": "D09",
    "Deanwood": "D10",
    "Cheverly": "D11",
    "Landover": "D12",
    "New Carrollton": "D13",
    "Mt Vernon Sq 7th St-Convention Center": "E01",
    "Shaw-Howard U": "E02",
    "U Street/African-Amer Civil War Memorial/Cardozo": "E03",
    "Columbia Heights": "E04",
    "Georgia Ave-Petworth": "E05",
    "Fort Totten": "E06",
    "West Hyattsville": "E07",
    "Prince George's Plaza": "E08",
    "College Park-U of MD": "E09",
    "Greenbelt": "E10",
    "Gallery Pl-Chinatown": "F01",
    "Archives-Navy Memorial-Penn Quarter": "F02",
    "L'Enfant Plaza": "F03",
    "Waterfront": "F04",
    "Navy Yard-Ballpark": "F05",
    "Anacostia": "F06",
    "Congress Heights": "F07",
    "Southern Avenue": "F08",
    "Naylor Road": "F09",
    "Suitland": "F10",
    "Branch Ave": "F11",
    "Benning Road": "G01",
    "Capitol Heights": "G02",
    "Addison Road-Seat Pleasant": "G03",
    "Morgan Boulevard": "G04",
    "Largo Town Center": "G05",
    "Van Dorn Street": "J02",
    "Franconia-Springfield": "J03",
    "Court House": "K01",
    "Clarendon": "K02",
    "Virginia Square-GMU": "K03",
    "Ballston-MU": "K04",
    "East Falls Church": "K05",
    "West Falls Church-VT/UVA": "K06",
    "Dunn Loring-Merrifield": "K07",
    "Vienna/Fairfax-GMU": "K08",
    "McLean": "N01",
    "Tysons Corner": "N02",
    "Greensboro": "N03",
    "Spring Hill": "N04",
    "Wiehle-Reston East": "N06" 
};