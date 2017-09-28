'use strict';

var Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
var marshalItem = require('dynamodb-marshaler').marshalItem;

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
	alexa.appId = "amzn1.ask.skill.f63c8bdf-dce3-43a8-abd0-c6e712218eb3";
	//alexa.dynamoDBTableName = 'MPIInspection';
	alexa.registerHandlers(handlers);
	alexa.execute();
};

function getNewInspectionObject(customer, vehicle) {
	var inspectionObject = {};
	var date = new Date();
  	var inspectionId = Math.floor(Math.random() * 1000);
    inspectionObject = {"id":inspectionId, "customer":customer, "vehicle":vehicle, "date":date, "inspections": {}};
    return inspectionObject;
}

function markVehicleCondition(sessionAttributes, inspectionItem, condition) {
	var inspection = sessionAttributes["mpiInspection"];
	var inspectionMap = inspection['inspections'];
	inspectionMap[inspectionItem] = condition;
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
        
        return this.emit(':ask', 'Starting new inspection, please start registering vehicle condition',
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
    	
    	return this.emit(':ask', 'Done');
    },
    
    'CheckAllInspection': function() {
    		
    },
    
    'AMAZON.StopIntent': function() {
        var sessionAttributes = this.event.session.attributes;
    	var inspectionObject = sessionAttributes["mpiInspection"];  
    	var customer = inspectionObject.customer;
    	var vehicle = inspectionObject.vehicle;
    	var date = inspectionObject.date;
    	var inspectionMap = inspectionObject.inspections;
    	
	var item = {
			'Customer': {
		       'S': customer
			},
			'Date': {
				'S': date
			}
			
		};
	if(vehicle) {
		item.vehicle = {'S':vehicle};
	}
	if(inspectionMap) {
		var marshalled = marshalItem(inspectionMap);
		console.log("Marshalled obj" + marshalled);
	    item.inspectionItem = {'M':marshalled};
	}
	console.log('InspectionMap:' + JSON.stringify(inspectionMap, null, '  '));
	dynamodb.putItem({
	    
		'TableName': 'MPIInspection',
		'Item': item}, 
		function(err, data) {
        	if (err) {
            	console.log('error','putting item into dynamodb failed: '+err);
        	}
        	else {
            	console.log('great success: '+JSON.stringify(data, null, '  '));
        	}
    	}); 	
    	
    			return this.emit(':tell', 'Multi point inspection saved successfully');
    },
    
    'LinkAccount' : function() {
    	return this.emit(':tellWithLinkAccountCard', 'Hello there');
    }

};