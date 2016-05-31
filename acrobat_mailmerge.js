// FOR DEVELOPMENT
// --------------------
try{ // home
var csvParser = require('../../Utils/CSV_parser/lightweight-csv-parser.js');
} catch(e) {
	try{ // work
		var csvParser = require('../lightweight-csv-parser/lightweight-csv-parser.js');
	} catch(e) {
		console.log(e);
	}
}
var parser = csvParser();
// --------------------


// Init for acrojs environment
// ----------------------------
// binds a reference to active document
// TODO: make sure this doesn't cause weird bugs when multiple
// docs are open.
var doc = this;



// factory function
// ============================
var AcrobatMailMerge =  function(mockApi){

	// DEVELOPMENT
	// ---------------------------------
	// injects mock API if it's passed as an argument
	// to the factory
	if (mockApi) {
		// verify api is ok
		if (	typeof mockApi 		!== 'object' ||
					mockApi.app 	=== undefined ||
					mockApi.doc 	=== undefined ||
					mockApi.util 	=== undefined){
			throw new Error('Incomplete mock API');

		} else {
			// establish mock API
			var app = mockApi.app;
			var doc = mockApi.doc;
			var util = mockApi.util;
		}
	}
	// otherwise, assume we're running in AcroJS environment
	// and we don't need to inject anything.
	// ----------------------------------

	var self = {};

	// private vars
	// ----------------------
	var targetFieldsRegexNoFlags = /<<(.+?)>>/;
	var targetFieldsRegex = new RegExp(targetFieldsRegexNoFlags.toString(),'g');
	var conditionalBlocksRegex = /\[[^\[]*?<>[^\]]*?\]|<|>|\[|\]/g;

	// flag marks whether multiple fields each map to one record (false)
	// or multiple fields map to multiple records (true)
	var splitFields = false;
	var lastPrinterName = undefined;
	var lastIndexPrinted = undefined;
	// ---------------------------

	// searches document for valid form fields.
	self.getTextBoxes = function(){

		var textBoxes = [];
		var thisBox;

		// helper function which compares text inside textBoxes
		var haveDifferentValues = function(array){
			if (array.length === 1 ){
				return false;
			}
			for (var i = 1; i < array.length; i++){
				
				if (array[i].value !== array[i-1].value){
						return true;
				}
			}
			return false;
		};
		
		
		// identifying valid text boxes
		// ------------------------------------
		if (doc.numFields === 0 ){
			app.alert('No form fields in document. (Make sure you\'re using form fields and not simple text.)');
			throw new Error('No valid form fields.');
		}
		
		for (var i = 0; i < doc.numFields; i++){
			
			thisBox = doc.getField(doc.getNthFieldName(i));	
			
			// if the text box's content matches the pattern, store that field.
			if (targetFieldsRegexNoFlags.test(thisBox.value)) {
				textBoxes.push(thisBox);
			}
		}
		
		
		
		// if the search didn't find anything, throw an error.
		if (textBoxes.length === 0){
			app.alert('The program did not identify any valid fields. ' +
			'Please double-check your formatting and try again.');
			throw new Error('No valid form fields.');
		}
		
		// if the search finds more than one field, we
		// need to know whether they are split fields are not - ie,
		// if the replace-print loop should assign one record to 
		// each field or if multiple records should be split over multiple fields.
		// So we check if each field has the exact same text, and if it doesn't,
		// we assume it's a split field and alert the user what we're doing.

		var userReport = 'The program identified ' + textBoxes.length + ' valid field(s). ';

		if (textBoxes.length > 1){

			// set splitFields flag to true if any of the valid text boxes are different.
			splitFields = haveDifferentValues( textBoxes );
			
			if (splitFields === true) {
				userReport += 	'These fields are NOT identical. ' + 
							'The program will print the contents of one data record to ALL of them.';
			} else if (splitFields === false) {
				userReport += 	'These fields ARE identical. '+
							'The program will print the contents of one data record to EACH of them.';
			}
		}
		
		// alerting the user.
		userReport += '\nIf anything is wrong with this, please click \'Cancel,\' check your formatting, and try again.';
		var userResponse = app.alert(userReport, 4, 1);
		// if user clicks 'cancel', end program.
		if (userResponse === 2){
			throw new Error('UserCancelException');
		}
		
		
		// returning array of valid text boxes.
		// --------------------------------------
		return textBoxes;
	};

	// Opens and parses csv or tsv data using user input.
	// TODO: choose tsv or csv, or find a way to implementat
	// sth like papa parse's guessing.
	self.getData = function(){
		
		var binData;
		var stringData;
		var jsonData;
		
		app.alert(	'Please locate the data you want to merge. Files must be in Tab Delimited Values(tsv) format.' + 
					' Excel commonly saves this as a .txt file; if you open it up and it looks like '+
					'a file separated by a bunch of tabs, you\'re probably fine.' + 
					'\n Pressing \'Ok\' will open a file browser.', 4 );
		
		// util.readFileIntoStream method opens a file browser.
		// If the user clicks 'cancel', method returns null and program terminates.
		
		// DEBUG: !!!! seems to read only the first character of the file
		// UPDATE: bug due to windows native UTF-16 encoding; acroJS expects utf-8,
		// in which null byte corresponds to end of input. In utf-16, ascii characters
		// have two bytes and guess what the second one is
		binData = util.readFileIntoStream();
		
		if (binData === null){
			throw new Error('UserCancelException');
		}
		// stringifies binary stream
		stringData = util.stringFromStream(binData);
		// parses csv and converts to json
		jsonData = self.csvToJson(stringData, '\t');

		return jsonData;
	};
	
	// helper function	
	self.csvToJson = function(input, separator, quote){
		// DEVELOPMENT ONLY
		return parser.parseData(input, separator, quote).toJSON();

	};

	// configures acrobat printing settings with user input
	self.setPrintParams = function(){
	
		// get acroJs print parameters object
		var pp = doc.getPrintParams();
		// get the names of all the available printer drivers.
		var printers = app.printerNames;
		// user's choice of printer.
		var printerSelection;
		
		
		// check for previous job's printer if any
		if (lastPrinterName !== undefined){
			
			printerSelection = app.alert(	'You printed the previous job to printer: ' + printerName + '. ' +
						'\nClick \'Yes\' to use this printer again and \'No\' to use a different printer.', 4, 3);
			switch (printerSelection){
				// cancel
				case 2: 
					throw new Error('UserCancelException');
				// yes
				case 4:
					pp.printerName = lastPrinterName;
					break;
				// no
				case 3:
					lastPrinterName = undefined;
					break;
			}
			
		} 
		
		// wonky logic so that previous if statement takes effect.
		if( lastPrinterName === undefined ){
		
			// app.popUpMenu uses first element of array as menu title.
			printers.unshift('Print to...');
			printerSelection = app.popUpMenu(printers);
			
			// if user clicks outside the popup menu,
			// popupmenu returns null and program terminates.
			if (printerSelection === null){
				throw new Error('UserCancelException');
			
			// else set printParams name to user's selection
			} else {
				pp.printerName  = printerSelection;
				lastPrinterName = printerSelection;
			}
		}
		
		// these params turn off the print box which usually appears
		// when a pdf is printed. 
		// This should be used in conjunction with a printer driver
		// that does also not generate popup boxes on a print event
		// for uninterrupted (ie silent) printing of each document. 
		pp.bUI = false;
		pp.bSilent=true;
		pp.interactive = pp.constants.interactionLevel.automatic;	

		return (pp);	
	};

	// Point of entry for program
	self.run = function(batchSize, startIndex, endIndex){
		// setting parameter defaults
		// ---------------------------------------
		// user can pass 'none' as batchSize parameter to bypass batch printing.
		var batchFlag = true;
		batchSize = batchSize || 150;
		if (batchSize === 'none'){
			batchFlag = false;
		}
		// this startIndex value can be overridden by locals.lastIndexPrinted.
		startIndex = startIndex || 0;
		
		// checking for unprinted pages
		if (lastIndexPrinted !== undefined && typeof lastIndexPrinted === 'number'){
			var userChoice = app.alert('You halted the previous printing job after printing ' + (lastIndexPrinted + 1) +
					' documents. Would you like to continue printing from the last document printed?' +
					' Pressing \'No\' will run the print job from the start document ' + 
					'(document ' + ( startIndex + 1) + ').',3,2);

			// yes
			if (userChoice === 3){
				startIndex = lastIndexPrinted + 1;
				
			// no
			} else {
				lastIndexPrinted = undefined;
			}
		}
		

		// Get json data, text boxes to merge to, and print params.
		// ----------------------------------------------------
		// debug: may have to use apply.
		// actually maybe not.
		var data = self.getData();
		var textBoxes = self.getTextBoxes();
		var pp = self.setPrintParams();
		console.println('set printparams');
		

		// Merge and print document
		// --------------------------
		// debug
		console.println(data.length);
		var numRecords = data.length;
		endIndex = endIndex || numRecords - 1;
		var batchCounter = 0;
		var batchPromptChoice;
		var initialValues = [];

		function replacer(match, p1){
			return '<' + data[i][p1] + '>';
		}

		
		for (var i = startIndex; i < endIndex + 1; i++){

			// pauses printing when each batch is completed,
			// if batches are enabled.
			if (batchFlag !== false){
				
				batchCounter = i - startIndex;
				if ( batchCounter % batchSize === 0 && batchCounter !== 0 ){
					batchPromptChoice = app.alert( 	batchCounter + ' out of ' + (numRecords - startIndex) +
													' documents have been printed. Press \'Ok\' to continue' +
													' or \'Cancel\' to cancel job.',4,1);
					
					// if user cancels, set lastIndexPrinted and exit program
					if (batchPromptChoice === 2){
						lastIndexPrinted = i;
						throw new Error('UserCancelException');
					}
					// otherwise continue
				}	
			}
			
			// debug
			console.println('beginning loop through textBoxes');
			console.println(textBoxes.length);
			
			for (var k=0; k < textBoxes.length; k++){
				
				// the first time the loop runs, 
				// save a copy of each text box's value
				// for re-initializing.
				if (batchCounter === 0) {
					initialValues[k] = textBoxes[k].value;
				}
				
				// replace <<fieldnames>> with <values>
				textBoxes[k].value = textBoxes[k].value.replace( targetFieldsRegex , replacer);				
				// delete any empty conditional blocks. '[ So <> empty ]'.
				textBoxes[k].value = textBoxes[k].value.replace( conditionalBlocksRegex, '' );
				
				// if each text box corresponds to one record,
				// we need to advance the counter to the next record.
				if (splitFields){
					i++;
				}
			}

			// print document once all text boxes
			// have been replaced.
			doc.print(pp);

			// re-initialize text boxes' values.
			for (var j = 0; j < textBoxes.length; j++){

				// DEBUG
				console.println(textBoxes[j].value);

				textBoxes[j] = initialValues[k];
			}

			// on to the next step of the loop...

		}
		
		//debug
		console.println('concluded loop');
		
		// once loop is done,
		// clear globals and terminate program.
		lastIndexPrinted = undefined;
		return 'Finished';		
	};

	return self;
};
// ============================


// exporting 
// ------------------------------

// if we're in the node env, we want to export
// as a module for testing.
try {
	module.exports = AcrobatMailMerge;
} catch (e){
	// if that code can't execute,
	// assume we're in the acrojs environment
	var mailmerge = AcrobatMailMerge();
}