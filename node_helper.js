/* Magic Mirror
 * Module: MMM-Surf
 *
 * By PrivacyWonk 
 * MIT Licensed.
 */


var NodeHelper = require('node_helper');
var request = require('request');
var moment = require('moment');
const exec = require('child_process').exec;
var helperDebug = "";



module.exports = NodeHelper.create({
    start: function() {
        console.log(moment().format() + ' MMM-Surf helper started ...');
        //Wunderground Forecast
        this.WufetcherRunning = false;
        this.wunderPayload = "";
        //NOAA Water Temp and Tides
        this.NOAAfetcherRunning = false;
        this.NOAAPayload = "";
        //Magicseaweed Surf Forecast
        this.MAGICfetcherRunning = false;
        this.magicseaweed = "";
    },

    /* 
     * build Wunderground API request
     * Original code from RedNax's MMM-Wunderground module
     *
     */
    fetchWunderground: function() {
        var self = this;
        this.WufetcherRunning = true;
        var apiMessage = "";

        var wulang = this.config.lang.toUpperCase();
        if (wulang == "DE") {
            wulang = "DL";
        }
        var Wurl = encodeURI(this.config.WuapiBase + this.config.Wuapikey + "/conditions/hourly/forecast10day/astronomy/alerts/lang:" + wulang + "/q/" + this.config.WuPWS + ".json");

        if (this.config.debug === 1) {
            apiMessage = moment().format() + " HELPER: Wunderground Data API REQUEST (3):  " + Wurl;
            self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
        }
        request({
                url: Wurl,
                method: 'GET'
            },
            function(error, response, body) {

                if (!error && response.statusCode == 200) {
                    this.wunderPayload = body;
                    //for some reason, when inside function(error, response, body) we lose the ability to see this.config.debug...
                    //but with declaration of self = this...we change to self.config.debug et voila.
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + '  HELPER: Wunderground Data API RESPONSE (4): Received';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                    self.sendSocketNotification('WUNDERGROUND', body);
                } else {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + '  HELPER: Wunderground Data API ERROR (5):  ' + error;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                }
                setTimeout(function() {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER: setTimeout called in fetchWunderground: ' + self.config.updateInterval;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                    self.fetchWunderground();
                }, self.config.updateInterval);
            } // end request(function())
        ); // end request()
        this.WufetcherRunning = false; // turn our running flag off.

    }, //end fetchWunderground

    /* 
     * 
     * build NOAA API requests for Tide and Water Temp
     *
     */

    fetchNOAAData: function() {
        var self = this;
        this.NOAAfetcherRunning = true;
        var apiMessage = ""
        var station_id = this.config.station_id;
        var noaatz = this.config.noaatz;
        var todayString = moment().format('YYYYMMDD');
        var tomorrowString = moment().add(1, 'day').format('YYYYMMDD');
        //NOAA Water Temperature
        //NOAA asks us to send the application name when making API requests


        var NOAAWaterTempURL = encodeURI(this.config.NOAAapiBase + "datagetter?product=water_temperature&application=MMM-Surf&begin_date=" + todayString + "&end_date=" + tomorrowString + "&station=" + station_id + "&time_zone=" + noaatz + "&units=english&interval=h&format=json");
        if (this.config.debug === 1) {
            apiMessage = moment().format() + " HELPER: NOAA Water Temp API REQUEST(3): " + NOAAWaterTempURL;
            self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
        }

        request({
                url: NOAAWaterTempURL,
                method: 'GET'
            }, function(error, response, body) {

                if (!error && response.statusCode == 200) {
                    this.NOAAPayload = body;
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER: NOAA Water Temp API RESULT(4): Received';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                    self.sendSocketNotification('NOAA_WATERTEMP', body);
                } else {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER: NOAA Water Temp API ERROR (5):  ' + error;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                }
            } //end request(function())
        ); //end request() for Water Temp
        //NOAA Tide Data
        //NOAA asks us to send the application name when making API requests

        var NOAAtideURL = encodeURI(this.config.NOAAapiBase + "datagetter?product=predictions&application=MMM-Surfer&begin_date=" + todayString + "&end_date=" + tomorrowString + "&datum=MLLW&station=" + station_id + "&time_zone=" + noaatz + "&units=english&interval=hilo&format=json");
        if (this.config.debug === 1) {
            apiMessage = moment().format() + " HELPER: NOAA Tide Data API REQUEST(3): " + NOAAtideURL;
            self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
        }
        request({
                url: NOAAtideURL,
                method: 'GET'
            },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    this.NOAAPayload = body;
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER: NOAA Tide Data API RESULT(4): Received';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                    self.sendSocketNotification('NOAA_TIDE_DATA', body);
                } else {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER: NOAA Tide API ERROR (5):  ' + error;

                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                }

		setTimeout(function() {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER: setTimeout called in fetchNOAAData: ' + self.config.updateInterval;

                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                    self.fetchNOAAData();
                }, self.config.updateInterval);


            } //end request(function())
        ); //end request() for NOAA Tides
        this.NOAAfetcherRunning = false;
    }, // end fetchNOAA function

    fetchMagicseaweedData: function() {
        var self = this;
        var apiMessage = "";
        this.MAGICfetcherRunning = true;
        //Magicseaweed URL

        var magicseaweedURL = encodeURI(this.config.MagicSeaweedAPIBase + this.config.MagicAPI + this.config.forecastEndpoint + this.config.MagicSeaweedSpotID);
        if (this.config.debug === 1) {
            apiMessage = moment().format() + " HELPER: Magicseaweed API REQUEST(3): " + magicseaweedURL;
            self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
        }
        request({
                url: magicseaweedURL,
                method: 'GET'
            },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    this.magicseaweed = body;
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER: Magicseaweed API RESULT(4): Received';
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                    self.sendSocketNotification('MAGICSEAWEED', body);
                } else {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER: Magicseaweed API ERROR(4):  ' + error;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                }
                setTimeout(function() {
                    if (self.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER: setTimeout called in fetchMagicseaweedData: ' + self.config.updateInterval;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage);
                    }
                    self.fetchMagicseaweedData();
                }, self.config.updateInterval);

            } // end request(function())
        ); //end Magicseaweed request
        this.MAGICfetcherRunning = false;
    }, //end Magicseaweed function

    // ------------------ SOCKET CONFIGURATION --------------------------
    socketNotificationReceived: function(notification, payload) {
            var self = this;
            var apiMessage = "";
            if (notification === 'GET_NOAA') {
                this.config = payload;
                if (this.config.debug === 1) {
                    apiMessage = moment().format() + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Fetching Data (2)';
                    self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                }
                if (!this.NOAAfetcherRunning) {
                    this.fetchNOAAData();
                } else {
                    var self = this;
                    if (this.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER_SOCKET(ERROR)(2): ' + self.name + ': NOAAfetcherRunning = ' + this.NOAAfetcherRunning;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    }
                }
            } //end NOAA Socket Config

            if (notification === 'GET_MAGIC') {
                this.config = payload;
                if (this.config.debug === 1) {
                    apiMessage = moment().format() + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Fetching Data (2)';
                    self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                }
                if (!this.MAGICfetcherRunning) {
                    this.fetchMagicseaweedData();
                } else {
                    var self = this;
                    if (this.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER_SOCKET(ERROR)(2): ' + self.name + ': MAGICfetcherRunning = ' + this.MAGICfetcherRunning;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    }
                }
            } //end Magicseaweed Socket config

            if (notification === 'GET_WUNDERGROUND') {
                this.config = payload;
                if (this.config.debug === 1) {
                    apiMessage = moment().format() + ' HELPER_SOCKET(RECEIVED FROM MAIN): ' + notification + ': Fetching Data (2)';
                    self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                }
                if (!this.WufetcherRunnin) {
                    this.fetchWunderground();
                } else {
                    var self = this;
                    if (this.config.debug === 1) {
                        apiMessage = moment().format() + ' HELPER_SOCKET(ERROR)(2): ' + self.name + ': WufetcherRunning = ' + this.WufetcherRunning;
                        self.sendSocketNotification('HELPER_MESSAGE', apiMessage)
                    }
                }
            } //end Wunderground Socket config
        } // end socketNotification

}); //end helper module

