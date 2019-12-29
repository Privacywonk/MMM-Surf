/* Magic Mirror
 * Module: MMM-Surf
 *
 * By PrivacyWonk 
 * CC BY-NC 4.0 Licensed.
 */


var NodeHelper = require('node_helper');
var request = require('request');
var moment = require('moment');
const exec = require('child_process').exec;
var helperDebug = "";
var tempTime = "";

module.exports = NodeHelper.create({
    start: function() {
        console.log(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' MMM-Surf helper started ...');
	//DarkSky Forecast
	this.DSfetcherRunning = false;
	this.DSPayload = "";
        //NOAA Water Temp and Tides
        this.NOAAfetcherRunning = false;
        this.NOAATidePayload = "";
	this.NOAATempPayload = "";
        //Magicseaweed Surf Forecast
        this.MAGICfetcherRunning = false;
        this.magicseaweed = "";
	//NOAA Global SST
	this.SSTfetcherRunning = false;
	this.noaaSST = "";
	this.started = false;
    },

	scheduleUpdate: function() {
		var nextload = this.config.updateInterval;
		tempTime = moment();
		tempTime.add(nextload, 'ms'); 
		console.log ("INITIAL LOAD - NEXT LOAD TIME: " +tempTime.format('YYYY-MM-DD >> HH:mm:ss.SSSZZ'));
		var self = this;
                if (this.config.debug === 1) {
			apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' UPDATE: Next update set for: ' + tempTime.format('YYYY-MM-DD >> HH:mm:ss.SSSZZ');
		        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
		}
		this.updateTimer = setInterval(function() {
			if (self.config.debug === 1) { 
				apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' UPDATE: scheduleUpdate() triggered. Fetching new data'; 
				self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
			}
			self.fetchNOAAData(self);
			self.fetchDarkSky(self);
			self.fetchMagicseaweedData(self);
			self.fetchNOAASSTData(self);
			tempTime = moment();
			tempTime.add(nextload, 'ms');
			console.log ("UPDATE LOAD - NEXT LOAD TIME: " +tempTime.format('YYYY-MM-DD >> HH:mm:ss.SSSZZ'));
	}, nextload); //define update setInterval timer
}, //end scheduleUpdate function

    /*
     * build DarkSky API request
     * 
     */
    fetchDarkSky: function() {
        var self = this;
        this.DSfetcherRunning = true;
        var apiMessage = "";

        var wulang = this.config.lang.toUpperCase();
        if (wulang == "DE") {
            wulang = "DL";
        }
        var DarkSkyURL = encodeURI(this.config.DarkSkyAPIBase + this.config.DarkSkyAPI + "/" + this.config.DarkSkyLat + "," + this.config.DarkSkyLong);

        if (this.config.debug === 1) {
            apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " HELPER: DarkSky Data API REQUEST (3):  " + DarkSkyURL;
            self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
        }
        request({
                url: DarkSkyURL,
                method: 'GET'
            },
            function(error, response, body) {

                if (!error && response.statusCode == 200) {
                    //this.DSPayload = body;
                        DSPayload = body;
                        //for some reason, when inside function(error, response, body) we lose the ability to see this.config.debug...
                    //but with declaration of self = this...we change to self.config.debug et voila.
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + '  HELPER: DarkSky Data API RESPONSE (4): Received';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                    self.sendSocketNotification('DARKSKY', body);
                } else {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + '  HELPER: DarkSky Data API ERROR (5):  ' + error;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                }
            } // end request(function())
        ); // end request()
        this.DSfetcherRunning = false; // turn our running flag off.

    }, //end fetchDarkSky

    /* 
     * 
     * build NOAA API requests for Tide and Water Temp
     *
     */

    fetchNOAAData: function() {
        var self = this;
        this.NOAAfetcherRunning = true;
        var apiMessage = "";
        var station_id = this.config.station_id;
        var noaatz = this.config.noaatz;
        var todayString = moment().format('YYYYMMDD');
        var tomorrowString = moment().add(1, 'day').format('YYYYMMDD');
        //NOAA Water Temperature
        //NOAA asks us to send the application name when making API requests


        var NOAAWaterTempURL = encodeURI(this.config.NOAAapiBase + "datagetter?product=water_temperature&application=MMM-Surf&begin_date=" + todayString + "&end_date=" + tomorrowString + "&station=" + station_id + "&time_zone=" + noaatz + "&units=english&interval=h&format=json");
        if (this.config.debug === 1) {
            apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " HELPER: NOAA Water Temp API REQUEST(3): " + NOAAWaterTempURL;
            self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
        }

        request({
                url: NOAAWaterTempURL,
                method: 'GET'
            }, function(error, response, body) {

                if (!error && response.statusCode == 200) {
                    //this.NOAATempPayload = body;
			NOAATempPayload = body;
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER: NOAA Water Temp API RESULT(4): Received';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }

			self.sendSocketNotification('NOAA_WATERTEMP', body);
                } else {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER: NOAA Water Temp API ERROR (5):  ' + error;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                }
            } //end request(function())
        ); //end request() for Water Temp
	
        //NOAA Tide Data
        //NOAA asks us to send the application name when making API requests
        var NOAAtideURL = encodeURI(this.config.NOAAapiBase + "datagetter?product=predictions&application=MMM-Surfer&begin_date=" + todayString + "&end_date=" + tomorrowString + "&datum=MLLW&station=" + station_id + "&time_zone=" + noaatz + "&units=english&interval=hilo&format=json");
        if (this.config.debug === 1) {
            apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " HELPER: NOAA Tide Data API REQUEST(3): " + NOAAtideURL;
            self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
        }
        request({
                url: NOAAtideURL,
                method: 'GET'
            },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    //this.NOAATidePayload = body;
			NOAATidePayload = body;
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER: NOAA Tide Data API RESULT(4): Received';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                    self.sendSocketNotification('NOAA_TIDE_DATA', body);
                } else {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER: NOAA Tide API ERROR (5):  ' + error;

                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                }

            } //end request(function())
        ); //end request() for NOAA Tides
        this.NOAAfetcherRunning = false;
    }, // end fetchNOAA function

	//NOAA Global SST Query
    fetchNOAASSTData: function() {
        var self = this;
        var apiMessage = "";
		var dateISO8601=moment().format('YYYY-MM-DD');
		var NOAAGlobalSSTDate=dateISO8601+"T00:00:00Z";
        this.SSTfetcherRunning = true;
        //Sample URL:https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncepRtofsG2DNowDailyProg_LonPM180.json?sst[(2019-12-28T00:00:00Z):1:(2019-12-28T00:00:00Z)][(1.0):1:(1.0)][(-36.00216):1:(-36.00216)][(160.65654):1:(160.65654)]"

        var noaaSSTURL = encodeURI(this.config.noaaGlobalSSTBase + "[("+NOAAGlobalSSTDate+"):1:("+NOAAGlobalSSTDate+")][(1.0):1:(1.0)][("+this.config.sstLatitude+"):1:("+this.config.sstLatitude+")][("+this.config.sstLongtitude+"):1:("+this.config.sstLongtitude+")]");
        if (this.config.debug === 1) {
            apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " HELPER: NOAA Global SST API REQUEST(3): " + noaaSSTURL;
            self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
        }
        request({
                url: noaaSSTURL,
                method: 'GET'
            },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    //this.noaaSST = body;
                        noaaSST = body;
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER: NOAA Global SST API RESULT(4): Received';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                        self.sendSocketNotification('NOAAGLOBALSST', body);
                        this.sendCachedTime = "";
                        sendCachedTime = moment().format('YYYY-MM-DD >> HH:mm:ss.SSSZZ');
                        self.sendSocketNotification('LAST_UPDATED', sendCachedTime); //send notification back to MMM-Surf.js to set update time


                } else {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER: NOAA Global SST API ERROR(4):  ' + error;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                }
            } // end request(function())
        ); //end NOAA Global SST request
        this.SSTfetcherRunning = false;
    }, //end NOAA Global SST function

    fetchMagicseaweedData: function() {
        var self = this;
        var apiMessage = "";
        this.MAGICfetcherRunning = true;
        //Magicseaweed URL

        var magicseaweedURL = encodeURI(this.config.MagicSeaweedAPIBase + this.config.MagicAPI + this.config.forecastEndpoint + this.config.MagicSeaweedSpotID);
        if (this.config.debug === 1) {
            apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " HELPER: Magicseaweed API REQUEST(3): " + magicseaweedURL;
            self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
        }
        request({
                url: magicseaweedURL,
                method: 'GET'
            },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    //this.magicseaweed = body;
			magicseaweed = body;
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER: Magicseaweed API RESULT(4): Received';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
			self.sendSocketNotification('MAGICSEAWEED', body);
			this.sendCachedTime = "";
			sendCachedTime = moment().format('YYYY-MM-DD >> HH:mm:ss.SSSZZ');
			self.sendSocketNotification('LAST_UPDATED', sendCachedTime); //send notification back to MMM-Surf.js to set update time


		} else {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER: Magicseaweed API ERROR(4):  ' + error;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                }
            } // end request(function())
        ); //end Magicseaweed request
        this.MAGICfetcherRunning = false;
    }, //end Magicseaweed function

    // ------------------ SOCKET CONFIGURATION --------------------------
    socketNotificationReceived: function(notification, payload) {
            var self = this;
            var apiMessage = "";
            if (notification === 'UPDATE_TIMER') {
                this.config = payload;
		if (this.started !== true) {
		      this.started = true;
		      this.scheduleUpdate();    
                      if (this.config.debug === 1) {
	                    apiMessage = moment().format('YYYY-MM-DDHH:mm:ss.SSSZZ') + ' UPDATE: ' + notification + ': Setting update schedule';
	                    self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                      }
		} else {
                    var self = this;
                    if (this.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' UPDATE:  scheduleUpdate already set. Next update at: '+ tempTime.format('YYYY-MM-DD >> HH:mm:ss.SSSZZ');
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    }
                }
            } //end UPDATE_TIMER Socket Config
	    
	    
	    
	    if (notification === 'GET_NOAA' && this.started == false) {
		    // if we haven't started, go fetch data. Otherwise dont & send cached data back
                this.config = payload;
                if (this.config.debug === 1) {
                    apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Fetching Data (2)';
                    self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                }
                if (!this.NOAAfetcherRunning) {
                    this.fetchNOAAData();
                } else {
                    var self = this;
                    if (this.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(ERROR)(2): ' + self.name + ': NOAAfetcherRunning = ' + this.NOAAfetcherRunning;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    }
                } // end get live data if clause
            } else if (notification === 'GET_NOAA' && this.started == true) {
		    //send cached NOAA data back to module for new client to load
		self.sendSocketNotification('LAST_UPDATED', sendCachedTime); //send notification back to MMM-Surf.js to set update time

		    if (this.config.debug === 1) {
                    	apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Sending cached data: NOAA_WATERTEMP'};
                    	self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
		    	self.sendSocketNotification('NOAA_WATERTEMP', NOAATempPayload); // send previously fetched data
	            if (this.config.debug === 1) {
	            	apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Sending cached data: NOAA_TIDE_DATA'};
	            	self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    	self.sendSocketNotification('NOAA_TIDE_DATA', NOAATidePayload); // send previously fetched data		
					
	    }    //end NOAA Socket Config


            if (notification === 'GET_NOAASST' && this.started == false) {
                    // if we haven't started, go fetch data. Otherwise dont & send cached data back
                this.config = payload;
                if (this.config.debug === 1) {
                    apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Fetching Data (2)';
                    self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                }
                if (!this.SSTfetcherRunning) {
                    this.fetchNOAASSTData();
                } else {
                    var self = this;
                    if (this.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(ERROR)(2): ' + self.name + ': SSTfetcherRunning = ' + this.SSTfetcherRunning;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    }
                } //end get live data if clause
            } else if (notification === 'GET_NOAASST' && this.started == true) {
                    //send cached NOAA SST data back to module for new client to load
                if (this.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Sending cached data';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                        self.sendSocketNotification('NOAAGLOBALSST', noaaSST); //send previously fetched data
               }

            } //end NOAA SST Socket config

	
            if (notification === 'GET_MAGIC' && this.started == false) {
		    // if we haven't started, go fetch data. Otherwise dont & send cached data back
                this.config = payload;
                if (this.config.debug === 1) {
                    apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Fetching Data (2)';
                    self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                }
                if (!this.MAGICfetcherRunning) {
                    this.fetchMagicseaweedData();
                } else {
                    var self = this;
                    if (this.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(ERROR)(2): ' + self.name + ': MAGICfetcherRunning = ' + this.MAGICfetcherRunning;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    }
                } //end get live data if clause
            } else if (notification === 'GET_MAGIC' && this.started == true) {
		    //send cached Magicseaweed data back to module for new client to load
                if (this.config.debug === 1) {
                    apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Sending cached data';
                    self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    self.sendSocketNotification('MAGICSEAWEED', magicseaweed); //send previously fetched data
                }
	    } //end Magicseaweed Socket config

            if (notification === 'GET_DARKSKY' && this.started == false) {
                    // if we haven't started, go fetch data. Otherwise dont & send cached data back
                this.config = payload;
                if (this.config.debug === 1) {
                    apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Fetching Data (2)';
                    self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                }
                if (!this.DSfetcherRunning) {
                    this.fetchDarkSky();
                } else {
                    var self = this;
                    if (this.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(ERROR)(2): ' + self.name + ': DSfetcherRunning = ' + this.DSfetcherRunning;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    }
                } //end get live data if clause
            } else if (notification === 'GET_DARKSKY' && this.started == true) {
                    //send cached DarkSky data back to module for new client to load
                if (this.config.debug === 1) {
                        apiMessage = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Sending cached data';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                        self.sendSocketNotification('DARKSKY', DSPayload); //send previously fetched data
               }

            } //end DARKSKY Socket config


        } // end socketNotification

}); //end helper module

