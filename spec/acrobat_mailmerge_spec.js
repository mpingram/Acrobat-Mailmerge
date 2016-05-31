'use strict';

var mailmerge = require('../acrobat_mailmerge.js');
var mockApi = require('../mock_api/mock_api.js');
var mockData = require('../mock_api/mock_api.js');

// initialize api
// ------------------
var api; 
var app;
var doc;
var util; 
// stores initialized mailmerge object
// needs to be reinitialized after
// changes are made to mock api's state
var merge;

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

// helper function - needs to be called
// after api's state is changed
var init = function(){
	doc.updateNumFields();
	merge = mailmerge(api);
};

// exceptions
var userCancelException = new Error('UserCancelException');
var formFieldsException = new Error('No valid form fields.');



// TESTING
// ==================

// components
// ------------------
describe('components: ', function(){



	// done for now
	describe('merge.getTextBoxes', function(){
		

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
		

		it('should stop the function on user cancellation', function(){
			util.readFileIntoStream = function(){
				// simulates user clicking cancel button
				// on acrobat file browser
				return null;
			};
			init();
			expect(merge.getData).toThrow(userCancelException);
		});

		it('should return a valid response for simple data', function(){
			init();
			expect(merge.getData()).toEqual(util.mockDataValidResult);
		});

	});

	describe('merge.csvToJson', function(){

	});

	describe('merge.setPrintParams', function(){

	});


	describe('mailmerge.print', function(){
	});

});