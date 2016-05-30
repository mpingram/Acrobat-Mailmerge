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

module.exports = mockApi;