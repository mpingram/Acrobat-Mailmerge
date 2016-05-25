var VariableDataPrinter = require('../acrobat_mailmerge.js');



// mock Acrobat JS API constructor
// -----------------------------
var MockApi = function(){};

MockApi.prototype.app = {

	// stores value of mock user response:
	// 1: cancel
	// 2: ok
	// 3: no
	// 4: yes
	alertSelection: 1,

	// mimics acrojs alert box
	alert: function(text){
		// display message in console
		console.log(text);
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
		return popUpMenuSelection;
	}
};

MockApi.prototype.doc = {

	numFields: 4,

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

MockApi.prototype.util = {
	readFileIntoStream: function(){
		return null;
	},
	stringFromStream: function(){
		return mockData;
	}
};
// ----------------------------

// initializing printer instance
var mailMerge = new AcrobatMailMerge();




// Tests
// ==========================

// components
// ------------------
describe('mailMerge.getTextBoxes', function(){

	var mock = new MockApi();
	var app = mock.app;
	var data = mock.data;
	var util = mock.util;



	it('should ', function(){


	});
});

describe('mailMerge.getData', function(){

});

describe('mailMerge.CSVtoJSON', function(){
	// mock CSV data
	var mockData = `test	field 2	field 3	field 4
JUVO	RQNZ	ESNR	OZLY
CMAI	XECU	UXYN	WNUR
YCEE	ADHO	WMCE	WSNK
HUUX	DCEN	DWUX	FCFX
CXAI	XDBT	INNP	MOZM`;

});

describe('mailMerge.setPrintParams', function(){

});


describe('mailMerge.print', function(){
});


// end to end
// ------------------
describe('amm', function(){

});