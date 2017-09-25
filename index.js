'use strict';

var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
	alexa.appId = "amzn1.ask.skill.f63c8bdf-dce3-43a8-abd0-c6e712218eb3";
	alexa.dynamoDBTableName = 'Inspections';
	alexa.registerHandlers(handlers);
	alexa.execute();
};

function getNewInspectionObject(customer, vehicle) {
	var inspectionObject = {};
	var date = new Date();
  	var inspectionId = Math.floor(Math.random() * 1000);
    inspectionObject = {"id":inspectionId, "customer":customer, "vehicle":vehicle, "date":date, "inspections": []};
    return inspectionObject;
}

function markVehicleCondition(sessionAttributes, inspectionItem, condition) {
	var inspection = sessionAttributes["mpiInspection"];
	var inspectionMap = {};
	inspectionMap[inspectionItem] = condition;
	inspection['inspections'].push(inspectionMap);
    console.log("Marked condition" + JSON.stringify(inspection));
    sessionAttributes['mpiInspection'] = inspection;
}

var handlers = {
    "LaunchRequest": function () {
		this.emit(':ask',
		'Hello. Welcome to Alexa voice enabled multi point inspection. Please say, Start new multi point inspection or Resume inspection');
	},
	'Unhandled': function () {
        this.emit(':ask', "I dint get that", "I dint get that");
	},

    'StartNewMPIInspection': function () {
        var customer = this.event.request.intent.slots.Customer.value;
        var vehicle = this.event.request.intent.slots.Vehicle.value;
        var updatedIntent = this.event.request.intent;
        
        if(customer == null) {
        	return this.emit(':elicitSlot', "Customer", "What is the customer's name?", "Please provide customer's full name", updatedIntent);
        }
        if(vehicle == null) {
        	return this.emit(':elicitSlot', "Vehicle", "What is the vehicle make model year?", "Please provide Vehicle make, model and year", updatedIntent);
        }
        var inspection = getNewInspectionObject(customer, vehicle);
        var sessionAttributes = this.event.session.attributes;
        sessionAttributes["mpiInspection"] = inspection;
        console.log("New inspection object:" + JSON.stringify(inspection));
        
        return this.emit(':ask', 'Starting new multi point inspection for ' + vehicle + ' owned by ' + customer + ', start registering vehicle condition',
        'Please say something like Mark battery condition as good');

    },
    
    'MarkInspectionCondition': function () {
    	var inspectionItem = this.event.request.intent.slots.InspectionItem.value;
    	var condition = this.event.request.intent.slots.Condition.value;
    	var updatedIntent = this.event.request.intent;
    	var sessionAttributes = this.event.session.attributes;
    	if(inspectionItem == null) {
    		return this.emit(':elicitSlot', "InspectionItem", "What is the inspection item name?", "Please provide inspection item name", updatedIntent);
    	}
    	if(condition == null) {
    		return this.emit(':elicitSlot', "Condition", "What is the condition?", "Please provide vehicle condition", updatedIntent);
    	}
    	markVehicleCondition(sessionAttributes, inspectionItem, condition);
    	
    	return this.emit(':ask', 'Marked ' + inspectionItem + ' as ' + condition);
    },
    
    'ResumeInspection': function() {
    	
    },
    
    'AMAZON.StopIntent': function() {
        var sessionAttributes = this.event.session.attributes;
    	var inspectionObject = sessionAttributes["currentInspection"];  
    	this.attributes['yourAttribute'] = 'value';
        console.log("TODO Persist inspection object:" + JSON.stringify(inspection));
    	return this.emit(':tell', 'Multi point inspection saved successfully');
    	
    }

};