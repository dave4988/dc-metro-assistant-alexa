# dc-metro-assistant-alexa
An Alexa skill to access the DC Metro API


# NextTrain:
    * When's the next train at {station}
        * tell: The next trains are while (response.hasNext()) {
                    {response.train.color} line to {response.train.destination} in {response.train.arrival} minutes
                }
    * When's the next train 
        * ask: Which Station?
            * {station}
                * tell: The next trains are loop {
                    {train.color} line to {train.destination} in {train.arrival} minutes
                }

# NextBus:
    TODO

# MetroAlerts
    * How fucked is the metro?
        * tell: The metro is {not, kinda, very} fucked. there are {response.alerts.count} metro alerts. they are loop for each alert {
            tell: alert at {response.alert.time}. {alert.message}
        }
