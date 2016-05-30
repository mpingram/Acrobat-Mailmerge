'use strict';

var mailmerge = require('../acrobat_mailmerge.js');



// mock Acrobat JS API factory
// -----------------------------
var mockApi = function(){
	var self = {};



	self.app = {
		// stores value of mock user response:
		// 1: ok
		// 2: cancel
		// 3: no
		// 4: yes
		alertSelection: 1,

		silentAlerts: false,

		// mimics acrojs alert box
		alert: function(text){
			// display message in console
			if (!this.silentAlerts){
				console.log(text);
			}
			// return mock user response
			return this.alertSelection;
		},

		printerNames: [
			'One Printer',
			'Two Printer',
			'Red Printer',
			'Blue Printer'
		],

		// stores mock user selection to popup
		// menu: value is the 1-based index of selection
		popUpMenuSelection: 1,

		popUpMenu: function(arr){
			for (var i=0; i<arr.length; i++){
				if (i===0){
					// simulates acroJS popup menu behavior,
					// first item in array is menu parent
					console.log(arr[i] + '===>\n');
				} else {
					console.log('\n\t-> ' + arr[i]);
				}
			}
			// selection doesn't really matter, so just
			// choose the first child
			return this.popUpMenuSelection;
		}
	};

	self.doc = {

		// default set of mimic form fields for the doc
		fields: [ 
			{
			 	name: 'One Field',
				value: '<<test>>'
			},
			{ 
				name: 'Two Field',
				value: '<<test>>'
			},
			{ 
				name: 'Red Field',
				value: '<<field 2>>'
			},
			{
				name: 'Blue Field',
			 	value: '<<test>>'
			}
		],


		// NOTE: updateNumFields needs to be called each
		// time doc.fields is changed.
		numFields: 4,

		updateNumFields: function(){
			var num = this.fields.length;
			this.numFields = num;
		},

		getField: function(name){
			for (var i = 0; i < this.fields.length; i++){
				if (this.fields[i].name === name){
					return this.fields[i];
				}
			}
			return null;
		},

		getNthFieldName: function(n){
			return this.fields[n].name;
		},

		getPrintParams: function(){
			return {
				'constants': {
					'interactionLevel': ''
				}
			};
		},
		
		print: function(){
			return 'Printing...';
		}
	};

	self.util = {
		// mock data to be read into stream
		mockData: `test	field 2	field 3	field 4`+
		`JUVO	RQNZ	ESNR	OZLY`+
		`CMAI	XECU	UXYN	WNUR`+
		`YCEE	ADHO	WMCE	WSNK`+
		`HUUX	DCEN	DWUX	FCFX`+
		`CXAI	XDBT	INNP	MOZM`,
		
		readFileIntoStream: function(){
			return null;
		},
		stringFromStream: function(){
			return this.mockData;
		}
	};

	return self;
};
// ----------------------------



// Tests
// ==========================

// components
// ------------------
describe('merge.getTextBoxes', function(){


	// ------------------
	var api; 
	var app;
	var doc;
	var util; 
	// stores initialized mailmerge object
	// needs to be reinitialized after
	// changes are made to mock api's state
	var merge = mailmerge(api);

	// helper function - needs to be called
	// after api's state is changed
	var init = function(){
		doc.updateNumFields();
		merge = mailmerge(api);
	};

	var formFieldsException = new Error('No valid form fields.');

	// -------------------

	beforeEach(function(){
		// reinitialize api
		api = mockApi();
		app = api.app;
		doc = api.doc;
		util = api.util;
		// if active test suite, turn this
		// back off to see app.alert messages.
		app.silentAlerts = true;
	});



	it('should detect if there are no form fields', function(){
		doc.fields = [];
		init();
		expect(merge.getTextBoxes).toThrow(formFieldsException);
	});

	it('should detect if form fields are invalid', function(){

		doc.fields = [{
			'name':'one field',
			'value': 'not valid'
		}];
		init();
		expect(merge.getTextBoxes).toThrow(formFieldsException);

		doc.fields.push({
			'name':'two field',
			'value': 'still not valid'
		});
		init();
		expect(merge.getTextBoxes).toThrow(formFieldsException);
	});

	it('should return the only valid field without further prompting', function(){

		doc.fields = [{
			name: 'red field',
			value: 'This field is <<valid>>'
		},
		{
			name: 'blue field',
			value: '< This Field is >> not < valid.'
		}];
		init();
		expect(merge.getTextBoxes()).toEqual([doc.fields[0]]);
	});

	it('should return the correct number of valid fields', function(){
		doc.fields = [
			{
				'name': 'one field',
				'value': '<<valid>>'
			},
			{
				'name': 'two field',
				'value': 'also <<valid>>'
			},
			{
				'name': 'red field',
				'value': 'invalid',
			},
			{
				'name': 'blue field',
				'value': 'this ones good <<tho>>',
			},
			{
				'name': 'last field',
				'value': 'but it\'s not good.'
			}];

		var validSolution = [
			doc.fields[0],
			doc.fields[1],
			doc.fields[3]
		];

		init();
		expect(merge.getTextBoxes()).toEqual(validSolution);
	});
});

describe('merge.getData', function(){

	// ------------------
	var api; 
	var app;
	var doc;
	var util; 
	// stores initialized mailmerge object
	// needs to be reinitialized after
	// changes are made to mock api's state
	var merge = mailmerge(api);

	// helper function - needs to be called
	// after api's state is changed
	var init = function(){
		doc.updateNumFields();
		merge = mailmerge(api);
	};

	var userCancelException = new Error('UserCancelException');
	// -------------------

	beforeEach(function(){
		// reinitialize api
		api = mockApi();
		app = api.app;
		doc = api.doc;
		util = api.util;
		// if active test suite, turn this
		// back off to see app.alert messages.
		app.silentAlerts = true;
	});

	it('should stop the function on user cancellation', function(){
		app.alertResponse = 2;
		init();
		expect(merge.getData).toThrow(userCancelException);
	});
});

describe('merge.csvToJson', function(){

});

describe('merge.setPrintParams', function(){

});


describe('mailmerge.print', function(){
});


// end to end
// ------------------
describe('mailmerge', function(){

});