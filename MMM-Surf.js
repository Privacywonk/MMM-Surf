/* global Module */
/* Magic Mirror
 * Module: MMM-Surf 
 * Forked from RedNax's MMM-Wunderground module
 * By PrivacyWonk 
 * CC BY-NC 4.0 Licensed.
 */

//var WaterTemp = null;

Module.register("MMM-Surf", {

    // Default module config.
    defaults: {
        MagicSeaweedSpotID: "", //spot ID from magic seaweed URL (e.g. 319 from http://magicseaweed.com/Ocean-City-NJ-Surf-Report/391/)
        MagicSeaweedSpotName: "", // shorthand name for your spot...e.g. Secret Spot / Lowers / The End / etc
	spotCoast: "",		//what coast the spot sits on values are "N, E, S, W"
	spotSwellHold: [],	//best swell direction for spot. Accepts multiple cardinal directions, e.g. "N","S","SSW","ESE" see: https://en.wikipedia.org/wiki/Compass_rose#/media/File:Kompassrose.svg 
	spotWind: [],		//best wind direction for spot. Accepts multiple cardinal directions, e.g. "N","S","SSW","ESE"
	spotSwellMin: "",	//minimum swell size that works at the spot
	spotSwellMax: "",	//maximum swell size that works at the spot
        eastSpotBadWinds: ["NNE", "NE", "ENE", "E", "ESE", "SE", "SSE"],
        westSpotBadWinds: ["SSW", "SW", "WSW", "W", "WNS", "NW", "NNW"],
        northSpotBadWinds: ["WNW", "NW", "NNW", "N", "NNE", "NE", "ENE"],
	southSpotBadWinds: ["ESE", "SE", "SSW", "S", "SSE", "SE", "WSW"],
	greenWindMax: "", //in MPH
	orangeWindMax: "", //in MPH
	redWindMax: "", //in MPH
	MagicAPI: "",
        debug: 0,
        Wuapikey: "",
        WuPWS: "",
        station_id: "", //Numeric station ID from NOAA
        noaatz: "", // gmt, lst, lst_ldt (Local Standard Time or Local Daylight Time) of station
        units: config.units,
        windunits: "bft", // choose from mph, bft
	updateInterval: 30*60*1000, // conversion to milliseconds (Minutes * 60 Seconds * 1000). Only change minutes. Be kind, don't hammer APIs.
	animationSpeed: 1000,
        timeFormat: config.timeFormat,
        lang: config.language,
        showWindDirection: true,
        fade: true,
        fadePoint: 0.25, // Start on 1/4th of the list.
        roundTmpDecs: 1,
        iconset: "VCloudsWeatherIcons",
        retryDelay: 2500,
        //Wunderground API Base
        WuapiBase: "http://api.wunderground.com/api/",
        // Magicseaweed API Configuration
        MagicSeaweedAPIBase: "http://magicseaweed.com/api/",
        forecastEndpoint: "/forecast/?spot_id=",
        // NOAA API Configuration
        NOAAapiBase: "https://tidesandcurrents.noaa.gov/api/",
        iconTableDay: {
            "chanceflurries": "wi-day-snow-wind",
            "chancerain": "wi-day-showers",
            "chancesleet": "wi-day-sleet",
            "chancesnow": "wi-day-snow",
            "chancetstorms": "wi-day-storm-showers",
            "clear": "wi-day-sunny",
            "cloudy": "wi-cloud",
            "flurries": "wi-snow-wind",
            "fog": "wi-fog",
            "haze": "wi-day-haze",
            "hazy": "wi-day-haze",
            "mostlycloudy": "wi-cloudy",
            "mostlysunny": "wi-day-sunny-overcast",
            "partlycloudy": "wi-day-cloudy",
            "partlysunny": "wi-day-cloudy-high",
            "rain": "wi-rain",
            "sleet": "wi-sleet",
            "snow": "wi-snow",
            "tstorms": "wi-thunderstorm"
        },

        iconTableNight: {
            "chanceflurries": "wi-night-snow-wind",
            "chancerain": "wi-night-showers",
            "chancesleet": "wi-night-sleet",
            "chancesnow": "wi-night-alt-snow",
            "chancetstorms": "wi-night-alt-storm-showers",
            "clear": "wi-night-clear",
            "cloudy": "wi-night-alt-cloudy",
            "flurries": "wi-night-alt-snow-wind",
            "fog": "wi-night-fog",
            "haze": "wi-night-alt-cloudy-windy",
            "hazy": "wi-night-alt-cloudy-windy",
            "mostlycloudy": "wi-night-alt-cloudy",
            "mostlysunny": "wi-night-alt-partly-cloudy",
            "partlycloudy": "wi-night-alt-partly-cloudy",
            "partlysunny": "wi-night-alt-partly-cloudy",
            "rain": "wi-night-alt-rain",
            "sleet": "wi-night-alt-sleet",
            "snow": "wi-night-alt-snow",
            "tstorms": "wi-night-alt-thunderstorm"
        },

        iconTableCompliments: {
            "chanceflurries": "13",
            "chancerain": "10",
            "chancesleet": "13",
            "chancesnow": "13",
            "chancetstorms": "11",
            "clear": "01",
            "cloudy": "02",
            "flurries": "13",
            "fog": "50",
            "haze": "50",
            "hazy": "50",
            "mostlycloudy": "03",
            "mostlysunny": "02",
            "partlycloudy": "02",
            "partlysunny": "02",
            "rain": "10",
            "sleet": "13",
            "snow": "13",
            "tstorms": "11"
        }

    },



    // Define required translations.
    getTranslations: function() {
        return {
            en: "translations/en.json",
            nl: "translations/nl.json",
            de: "translations/de.json",
            dl: "translations/de.json",
            fr: "translations/fr.json",
            pl: "translations/pl.json"

        };
    },

    // Add moment.js functionality.
    getScripts: function() {
        return ["moment.js"];
    },

    // Import CSS files.
    getStyles: function() {
        return ["weather-icons.css", "weather-icons-wind.css", "font-awesome.css", "MMM-Surf.css"];
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);

        // Set locale.
        moment.locale(config.language);
        this.forecast = [];
        this.hourlyforecast = [];
        this.loaded = false;
        this.error = false;
        this.errorDescription = "";
	this.getNOAA();
	this.getWunder();
        this.getMagicseaweed();
	//this.updateTimer = null;
	this.lastUpdatedTime = ""; 
        this.haveforecast = 0;
    },

    getNOAA: function() {
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " SOCKET(SEND TO HELPER): GET_NOAA (1):"); }
        this.sendSocketNotification("GET_NOAA", this.config);
    }, //end getNOAA function

    getWunder: function() {
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " SOCKET(SEND TO HELPER): GET_WUNDERGROUND (1):"); }
        this.sendSocketNotification("GET_WUNDERGROUND", this.config);
    }, //end GetWunder

    getMagicseaweed: function() {
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " SOCKET(SEND TO HELPER): GET_MAGIC (1):"); }
        this.sendSocketNotification("GET_MAGIC", this.config);
    }, //end getMagicseaweed function


    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");
        var f;
        var forecast;
        var iconCell;
        var icon;
        var popCell;
        var mmCell;
        var hourCell;
        var dayCell;
        var startingPoint;
        var currentStep;
        var steps;

        if (this.config.Wuapikey === "") {
            wrapper.innerHTML = this.translate("APIKEY") + this.name + ".";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (this.error) {
            wrapper.innerHTML = "Error: " + this.errorDescription;
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (!this.loaded) {
            wrapper.innerHTML = this.translate("LOADING");
            wrapper.className = "dimmed light small";
            return wrapper;
        }

		//Build CURRENT WEATHER row
		var small = document.createElement("div");
		small.className = "normal medium";

		var spacer = document.createElement("span");
		spacer.innerHTML = "&nbsp;";

		var table_sitrep = document.createElement("table");

		var row_sitrep = document.createElement("tr");
		var spot_row = document.createElement("tr");

		if (this.config.MagicSeaweedSpotName != "") {
			var row = document.createElement("tr");
			var spotTextCell = document.createElement("td");
			//display spot name from config
			spotTextCell.className = "spotName";
			spotTextCell.setAttribute("colSpan", "10");
			spotTextCell.innerHTML = this.config.MagicSeaweedSpotName;

			spot_row.appendChild(spotTextCell);
			table_sitrep.appendChild(spot_row);
		}

		var weatherIcon = document.createElement("td");
		weatherIcon.className = "wi " + this.weatherType;
		row_sitrep.appendChild(weatherIcon);

		var temperature = document.createElement("td");
		temperature.className = "bright";
		temperature.innerHTML = " " + this.temperature + "&deg;";
		row_sitrep.appendChild(temperature);

		var windIcon = document.createElement("td");
		if (this.config.windunits == "mph") {
			windIcon.innerHTML = this.windSpeedMph + "<sub>mph</sub>";
		} else {
			windIcon.className = "wi " + this.windSpeed;
		}
		row_sitrep.appendChild(windIcon);
		row_sitrep.className = "pop";

		var windDirectionIcon = document.createElement("td");
		windDirectionIcon.className = "wi wi-wind " + this.windDirection;
		windDirectionIcon.innerHTML = "&nbsp;";

		row_sitrep.appendChild(windDirectionIcon);

		var HumidityIcon = document.createElement("td");
		HumidityIcon.className = "wi wi-humidity lpad";
		row_sitrep.appendChild(HumidityIcon);

		var HumidityTxt = document.createElement("td");
		HumidityTxt.innerHTML = this.Humidity + "&nbsp;";
		HumidityTxt.className = "vcen left";
		row_sitrep.appendChild(HumidityTxt);

		var sunriseSunsetIcon = document.createElement("td");
		sunriseSunsetIcon.className = "wi " + this.sunriseSunsetIcon;
		row_sitrep.appendChild(sunriseSunsetIcon);

		var sunriseSunsetTxt = document.createElement("td");
		sunriseSunsetTxt.innerHTML = this.sunriseSunsetTime;
		sunriseSunsetTxt.className = "vcen left";
		row_sitrep.appendChild(sunriseSunsetTxt);

		var moonPhaseIcon = document.createElement("td");
		moonPhaseIcon.innerHTML = this.moonPhaseIcon;
		row_sitrep.appendChild(moonPhaseIcon);

		//close current weather conditions row (top)
		table_sitrep.appendChild(row_sitrep);
		small.appendChild(table_sitrep);

		// CURRENT WATER CONDITIONS
		var small2 = document.createElement("div");
		small2.className = "normal medium test";

		var spacer = document.createElement("span");
		spacer.innerHTML = "&nbsp;";

		//add divider
		var divider = document.createElement("hr");
		divider.className = "hrDivider";
		small2.appendChild(divider);

		// Current Water Conditions (second row)
		var table_watersitrep = document.createElement("table");
		var row_watersitrep = document.createElement("tr");
		row_watersitrep.className = "pop";

		/* Display Water Temperature & Gear Choices
		 * wetsuit/gear choice evals water temp and makes a recommendation
		 * Not a science...weather conditions will influence your choice
		 */
                gear = "";
                WaterEval = Math.round(this.WaterTemp);
                if (WaterEval >= 73) {gear = "Boardies!";}
                if (WaterEval >= 65 && WaterEval <= 72) { gear = "2mm";}
                if (WaterEval >= 59 && WaterEval <= 64) { gear = "3/2";}
                if (WaterEval >= 54 && WaterEval <= 58) { gear = "4/3";}
                if (WaterEval >= 47 && WaterEval <= 53) { gear = "5/4/3";}
                if (WaterEval <= 46) {gear = "6/5/4";}
		

		var WaterTxt = document.createElement("td");
		WaterTxt.innerHTML = Math.round(this.WaterTemp) + "&deg; <br>" + "<span class=\"smaller\"> Gear: <br>" + gear + "</span>"; //round to nearest whole because 50.2 degrees doesn't make a  difference
		WaterTxt.className = "water";


		row_watersitrep.appendChild(WaterTxt);

		//Display Tide Data
		var TideIcon = document.createElement("td");
	    	if (this.DeltaPerc >= 0 && this.DeltaPerc <= 33) {
			TideIcon.innerHTML = "<img src='./modules/MMM-Surf/img/" + this.TideTypeCurrent + "Tide1.png" + "'>";}
	        if (this.DeltaPerc >= 34 && this.DeltaPerc <= 66) {
			TideIcon.innerHTML = "<img src='./modules/MMM-Surf/img/" + this.TideTypeCurrent + "Tide2.png" + "'>";}
		if (this.DeltaPerc >= 67) {
			TideIcon.innerHTML = "<img src='./modules/MMM-Surf/img/" + this.TideTypeCurrent + "Tide3.png" + "'>";}
	    	TideIcon.className = "wi";
		row_watersitrep.appendChild(TideIcon);

		var TideTxt = document.createElement("td");
		if (this.TideTypeCurrent == "Low") {
			TideTxt.innerHTML = this.TideHeightCurrent + "' @ " + moment(this.TideTimeCurrent).format('LT') + " <br> " + this.DeltaPerc + "% out";
		} else {
			TideTxt.innerHTML = this.TideHeightCurrent + "'@ " + moment(this.TideTimeCurrent).format('LT') + " <br> " + this.DeltaPerc + "% in";
		}
		TideTxt.className = "small vcen left";
		row_watersitrep.appendChild(TideTxt);

		//Display Next Tide Data and Time
		var nextTideIcon = document.createElement("td");
		nextTideIcon.innerHTML = "<img src='./modules/MMM-Surf/img/" + this.TideTypeNext + ".png" + "'>";
		nextTideIcon.className = "wi";
		row_watersitrep.appendChild(nextTideIcon);

		var nextTideTxt = document.createElement("td");
		nextTideTxt.innerHTML = this.TideHeightNext + "' @ " + moment(this.TideTimeNext).format('LT');
		nextTideTxt.className = "small vcen left";
		row_watersitrep.appendChild(nextTideTxt);

		//Close Water Conditions Row in table (second row)
		table_watersitrep.appendChild(row_watersitrep);
		small2.appendChild(table_watersitrep);

		//Write Current Weather and Current Water
		wrapper.appendChild(small);
		wrapper.appendChild(small2);


        // ------------------ 12 HOUR SURF FORECAST ------------------
        //TODO: Make Vertical format work with Surf Forecast! Currently only horizontal
		//TODO: Add vertical v. horizontal test?
        var table = document.createElement("table");

            var fctable = document.createElement("div");
            var divider = document.createElement("hr");
            divider.className = "hrDivider";
            fctable.appendChild(divider);
            table = document.createElement("table");
            table.className = "small";
            table.setAttribute("width", "25%");
	    //table.setAttribute("border", 1); // for layout testing only

			row_forecastDay = document.createElement("tr"); 			//layout row for Day and Time
			row_forecastRating = document.createElement("tr"); 			//layout row for Magicseaweed star rating
			row_swellCharacteristics = document.createElement("tr"); 	// layout row for swell height and periodicity
			row_swell = document.createElement("tr"); 					// layout row for swell direction icon and text
			row_wind = document.createElement("tr"); 					//layout row for wind direction icon and text

			for (f in this.magicforecast12hrs) {
				dayTimeCell = document.createElement("td");
				dayTimeCell.setAttribute('style', 'text-align: center;');
				dayTimeCell.className = "hour";
				dayTimeCell.innerHTML = this.magicforecast12hrs[f].day + " " + this.magicforecast12hrs[f].hour;
				row_forecastDay.appendChild(dayTimeCell);
				//Render Magicseaweed star rating
				magicseaweedStarRating = document.createElement("td");
				magicseaweedStarRating.setAttribute('style', 'text-align: center;');
				magicseaweedStarRating.className = "align-center bright weather-icon";
				icon = document.createElement("span");
				if (this.magicforecast12hrs[f].rating.length == 0) {
					//icon.className = "wi wi-na"; //old NA icon
					icon.innerHTML = "<span class=\"swellred\"><i class=\"fa fa-times-circle\"></i></span>";	
				} else {
					icon.innerHTML = this.magicforecast12hrs[f].rating.join(" ");
				}
				magicseaweedStarRating.appendChild(icon);
				row_forecastRating.appendChild(magicseaweedStarRating);
				//swell height and period
				swellConditionsCell = document.createElement("td");
				swellConditionsCell.setAttribute('style', 'text-align: center;');
                                /* Evaluate periodicity of swell and pop an indicator color
                                *  red = not surfable
                                *  orange = surfable but sloppy
                                *  green = go go go
                                *  source: https://magicseaweed.com/help/forecast-table/wave-period-overview
				*  Evaluate wave height for spot from config. If between Min and Max, pop green
                                */
                                if (this.magicforecast12hrs[f].swellHeight >= this.config.spotSwellMin && this.magicforecast12hrs[f].swellHeight <= this.config.spotSwellMax) {
                                        swellHeightRender = "<span class=\"swellgreen\">" + this.magicforecast12hrs[f].swellHeight +"'</span> @ "; }
                                else {
                                        swellHeightRender = this.magicforecast12hrs[f].swellHeight + "' @ ";}

                                if (this.magicforecast12hrs[f].swellPeriod >= 0 && this.magicforecast12hrs[f].swellPeriod <= 6)
                                        {swellPeriodRender = "<span class=\"swellred\">" + this.magicforecast12hrs[f].swellPeriod + "s</span>";}

                                if (this.magicforecast12hrs[f].swellPeriod >= 7 && this.magicforecast12hrs[f].swellPeriod <= 9)
                                        {swellPeriodRender = "<span class=\"swellorange\">" + this.magicforecast12hrs[f].swellPeriod + "s</span>";}

                                if (this.magicforecast12hrs[f].swellPeriod >= 10)
                                        {swellPeriodRender = "<span class=\"swellgreen\">" + this.magicforecast12hrs[f].swellPeriod + "s</span>";}
				swellConditionsCell.innerHTML = swellHeightRender.concat(swellPeriodRender);
				swellConditionsCell.className = "hour";
				row_swellCharacteristics.appendChild(swellConditionsCell);
				//swell direction
				swellInfo = document.createElement("td");
				swellInfoCell = document.createElement("strong");
				swellInfo.setAttribute('style', 'text-align: center;');
				swellInfoCell.innerHTML = "Swell: &nbsp;";
				swellInfoCell.className = "hour";
				swellInfo.appendChild(swellInfoCell);

				swellInfoCell = document.createElement("i");

			for (i = 0, count = this.config.spotSwellHold.length; i < count; i++) {
					if (this.config.debug === 1) { 
						//Log.info("SWELL (forecast/spothold): "+ this.magicforecast12hrs[f].swellCompassDirection+"/"+this.config.spotSwellHold[i]);
					}

					if (this.config.spotSwellHold[i] === this.magicforecast12hrs[f].swellCompassDirection) {
						//Swell direction is the direction the swell is coming from, as opposed to the direction it is heading toward. 
						//The arrow displayed will have the small point facing the origin of the swell
						swellInfoCell.className = "wi wi-wind from-" + Math.round(this.magicforecast12hrs[f].swellDirection) + "-deg swellgreen";
						break;
					} else{
						swellInfoCell.className = "wi wi-wind from-" + Math.round(this.magicforecast12hrs[f].swellDirection) + "-deg";
					}
					} // end swell colorization loop	

				swellInfo.appendChild(swellInfoCell);

				swellInfoCell = document.createElement("i");
				swellInfoCell.innerHTML = "&nbsp;&nbsp;" + this.magicforecast12hrs[f].swellCompassDirection;
				swellInfoCell.className = "hour";
				swellInfo.appendChild(swellInfoCell);
				row_swell.appendChild(swellInfo);

				//wind direction
				windInfo = document.createElement("td");
				windInfo.setAttribute('style', 'text-align: center;');
				windInfoCell = document.createElement("strong");
				windInfoCell.innerHTML = "Wind: &nbsp;";
				windInfoCell.className = "hour";
				windInfo.appendChild(windInfoCell);
				windInfoCell = document.createElement("i");
			
				for (i = 0, count = this.config.spotWind.length; i < count; i++) {
					//if (this.config.debug === 1) { Log.info("WIND: " + this.magicforecast12hrs[f].windCompassDirection + " / " + this.config.spotWind[i]);}
						if (this.config.spotWind[i] === this.magicforecast12hrs[f].windCompassDirection) {
						//Wind direction is reported by the direction from which it originates. 
						//For example, a northerly wind blows from the north to the south.
						//The arrow displayed will have the small point facing the origin of the wind
							windInfoCell.className = "wi wi-wind " + this.magicforecast12hrs[f].windDirection + " swellgreen";
							break;
					} else {
						// If statements to pop-color on sideshore and onshore winds determined - roughly - by the spot orientation
						// if the spot is on the east coast, then any winds coming from the east, blowing west, are on shore and ugly (red)
						// Wind directions have alreadybeen set in *SpotBadWinds in the config stanza
                                                if (this.config.spotCoast === "E") {
                                                                if (this.config.eastSpotBadWinds.indexOf(this.magicforecast12hrs[f].windCompassDirection) != -1) {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecast12hrs[f].windDirection + " swellred";
                                                                } else {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecast12hrs[f].windDirection + " swellorange";
                                                                }
                                                        }
                                                if (this.config.spotCoast === "W") {
                                                                if (this.config.westSpotBadWinds.indexOf(this.magicforecast12hrs[f].windCompassDirection) != -1) {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecast12hrs[f].windDirection + " swellred";
                                                                } else {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecast12hrs[f].windDirection + " swellorange";
                                                                }
                                                        }
                                                if (this.config.spotCoast === "N") {
                                                                if (this.config.northSpotBadWinds.indexOf(this.magicforecast12hrs[f].windCompassDirection) != -1) {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecast12hrs[f].windDirection + " swellred";
                                                                } else {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecast12hrs[f].windDirection + " swellorange";
                                                                }
                                                        }
                                                if (this.config.spotCoast === "S") {
                                                                if (this.config.southSpotBadWinds.indexOf(this.magicforecast12hrs[f].windCompassDirection) != -1) {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecast12hrs[f].windDirection + " swellred";
                                                                } else {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecast12hrs[f].windDirection + " swellorange";
                                                                }
                                                        }
                                                } // end else loop
                                } // end wind colorization loop


				windInfo.appendChild(windInfoCell);

				windInfoCell = document.createElement("i");

                                if (this.magicforecast12hrs[f].windGusts <=this.config.greenWindMax) {
                                	windInfoCell.innerHTML = "&nbsp;" + this.magicforecast12hrs[f].windCompassDirection + "<br>" + "Steady: " + this.magicforecast12hrs[f].windSpeed + "mph<br>"  +"<span class=\"swellgreen\">Gusts: </span>" +this.magicforecast12hrs[f].windGusts + "mph";
                                }
                                if (this.magicforecast12hrs[f].windGusts > this.config.greenWindMax && this.magicforecast12hrs[f].windGusts <= this.config.orangeWindMax) {
                                         windInfoCell.innerHTML = "&nbsp;" + this.magicforecast12hrs[f].windCompassDirection + "<br>" + "Steady: " + this.magicforecast12hrs[f].windSpeed + "mph<br>"  +"<span class=\"swellorange\">Gusts: </span>" +this.magicforecast12hrs[f].windGusts + "mph";
                                }
                                if (this.magicforecast12hrs[f].windGusts >= this.config.redWindMax) {
                                        windInfoCell.innerHTML = "&nbsp;" + this.magicforecast12hrs[f].windCompassDirection + "<br>" + "Steady: " + this.magicforecast12hrs[f].windSpeed + "mph<br>"  +"<span class=\"swellred\">Gusts: </span>" +this.magicforecast12hrs[f].windGusts + "mph";
				}

				//windInfoCell.innerHTML = "&nbsp;" + this.magicforecast12hrs[f].windCompassDirection + "<br>" + "Steady: " + this.magicforecast12hrs[f].windSpeed + "mph<br>"  +"Gusts: " +this.magicforecast12hrs[f].windGusts + "mph";
				windInfoCell.className = "hour";
				windInfo.appendChild(windInfoCell);
				row_wind.appendChild(windInfo);

				var nl = Number(f) + 1;
				if ((nl % 4) === 0) {
					table.appendChild(row_forecastDay);
					table.appendChild(row_forecastRating);
					table.appendChild(row_swellCharacteristics);
					table.appendChild(row_swell);
					table.appendChild(row_wind);
					row_forecastDay = document.createElement("tr");
					row_forecastRating = document.createElement("tr");
					row_swellCharacteristics = document.createElement("tr");
					row_swell = document.createElement("tr");
					row_wind = document.createElement("tr");
				}
				//Force 12-hour row to stay on one line...not entirely sure how this works.	
				if (f > 2) {
					break;
				}


			} //end magicforecast12hrs for loop

			//write out Forecast table (every 3 hours)
			table.appendChild(row_forecastDay);
			table.appendChild(row_forecastRating);
			table.appendChild(row_swellCharacteristics);
			table.appendChild(row_swell);
			table.appendChild(row_wind);
			fctable.appendChild(table);
			fctable.appendChild(divider.cloneNode(true));



            // ------------------ DAILY SURF FORECAST ------------------
            table = document.createElement("table");
            table.className = "small";
            table.setAttribute("width", "25%");

            row_forecastDay = document.createElement("tr");
            row_forecastRating = document.createElement("tr");
            row_swellCharacteristics = document.createElement("tr");
            row_swell = document.createElement("tr");
            row_wind = document.createElement("tr");
	    row_lastUpdated = document.createElement("tr");

			for (f in this.magicforecastDaily) {
				dayCell = document.createElement("td");
				dayCell.setAttribute('style', 'text-align: center;');
				dayCell.className = "hour";
				dayCell.innerHTML = this.magicforecastDaily[f].day + " " + this.magicforecastDaily[f].hour;
				row_forecastDay.appendChild(dayCell);
				//rating
				magicseaweedStarRating = document.createElement("td");
				magicseaweedStarRating.setAttribute('style', 'text-align: center;');
				magicseaweedStarRating.className = "align-center bright weather-icon";
				icon = document.createElement("span");
				if (this.magicforecastDaily[f].rating.length == 0) {
					//icon.className = "wi wi-na";
					icon.innerHTML = "<span class=\"swellred\"><i class=\"fa fa-times-circle\"></i></span>";
				} else {
					icon.innerHTML = this.magicforecastDaily[f].rating.join(" ");
				}
				magicseaweedStarRating.appendChild(icon);
				row_forecastRating.appendChild(magicseaweedStarRating);
				//swell height and period
				swellConditionsCell = document.createElement("td");
				swellConditionsCell.setAttribute('style', 'text-align: center;');
                                /* Evaluate periodicity of swell and pop an indicator color
                                *  red = not surfable
                                *  orange = surfable but sloppy
                                *  green = go go go
                                *  source: https://magicseaweed.com/help/forecast-table/wave-period-overview
                                *  Evaluate wave height for spot from config. If between Min and Max, pop green
                                */
                                if (this.magicforecastDaily[f].swellHeight >= this.config.spotSwellMin && this.magicforecastDaily[f].swellHeight <= this.config.spotSwellMax) {
                                        swellHeightRender = "<span class=\"swellgreen\">" + this.magicforecastDaily[f].swellHeight +"'</span> @ "; }
                                else {
                                        swellHeightRender = this.magicforecastDaily[f].swellHeight + "' @ ";}

                                if (this.magicforecastDaily[f].swellPeriod >= 0 && this.magicforecastDaily[f].swellPeriod <= 6)
                                        {swellPeriodRender = "<span class=\"swellred\">" + this.magicforecastDaily[f].swellPeriod + "s</span>";}

                                if (this.magicforecastDaily[f].swellPeriod >= 7 && this.magicforecastDaily[f].swellPeriod <= 9)
                                        {swellPeriodRender = "<span class=\"swellorange\">" + this.magicforecastDaily[f].swellPeriod + "s</span>";}

                                if (this.magicforecastDaily[f].swellPeriod >= 10)
                                        {swellPeriodRender = "<span class=\"swellgreen\">" + this.magicforecastDaily[f].swellPeriod + "s</span>";}
				swellConditionsCell.innerHTML = swellHeightRender.concat(swellPeriodRender);
				swellConditionsCell.className = "hour";
				row_swellCharacteristics.appendChild(swellConditionsCell);
				//swell direction
				swellInfo = document.createElement("td");
				swellInfo.setAttribute('style', 'text-align: center;');
				swellInfoCell = document.createElement("strong");
				swellInfoCell.innerHTML = "Swell: &nbsp;";
				swellInfoCell.className = "hour";
				swellInfo.appendChild(swellInfoCell);
				swellInfoCell = document.createElement("i");
				for (i = 0, count = this.config.spotSwellHold.length; i < count; i++) {
					//Log.info("Swell Compass Direction: "+ this.magicforecastDaily[f].swellCompassDirection);
					//Log.info("Spot Best Swell: " +this.config.spotSwellHold[i]);

					if (this.config.spotSwellHold[i] === this.magicforecastDaily[f].swellCompassDirection) {
							//Swell direction is the direction the swell is coming from, as opposed to the direction it is heading toward.
							//The arrow displayed will have the small point facing the origin of the swell
							swellInfoCell.className = "wi wi-wind from-" + Math.round(this.magicforecastDaily[f].swellDirection) + "-deg swellgreen";
							break;
					} else{
							swellInfoCell.className = "wi wi-wind from-" + Math.round(this.magicforecastDaily[f].swellDirection) + "-deg";
					}
				} // end swell colorization loop
				swellInfo.appendChild(swellInfoCell);

				swellInfoCell = document.createElement("i");
				swellInfoCell.innerHTML = "&nbsp;&nbsp;" + this.magicforecastDaily[f].swellCompassDirection;
				swellInfoCell.className = "hour";
				swellInfo.appendChild(swellInfoCell);

				row_swell.appendChild(swellInfo);
				//wind direction
				windInfo = document.createElement("td");
				windInfo.setAttribute('style', 'text-align: center;');
				windInfoCell = document.createElement("strong");
				windInfoCell.innerHTML = "Wind: &nbsp;";
				windInfoCell.className = "hour";
				windInfo.appendChild(windInfoCell);

				windInfoCell = document.createElement("i");
				for (i = 0, count = this.config.spotWind.length; i < count; i++) {

					if (this.config.spotWind[i] === this.magicforecastDaily[f].windCompassDirection) {
							//Wind direction is reported by the direction from which it originates. For example, a northerly wind blows from the north to the south.
							//The arrow displayed will have the small point facing the origin of the wind
							windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection + " swellgreen";
							break;
					} else {
						// If statements to pop-color on sideshore and onshore winds determined - roughly - by the spot orientation
						// if the spot is on the east coast, then any winds coming from the east, blowing west, are on shore and ugly (red)
						// Wind directions have alreadybeen set in *SpotBadWinds in the config stanza
						if (this.config.spotCoast === "E") {
								if (this.config.eastSpotBadWinds.indexOf(this.magicforecastDaily[f].windCompassDirection) != -1) {
									windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection + " swellred";
								} else {
									windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection + " swellorange";
								}
							}
                                                if (this.config.spotCoast === "W") {
                                                                if (this.config.westSpotBadWinds.indexOf(this.magicforecastDaily[f].windCompassDirection) != -1) {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection + " swellred";
                                                                } else {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection + " swellorange";
                                                                }
                                                        }
                                                if (this.config.spotCoast === "N") {
                                                                if (this.config.northSpotBadWinds.indexOf(this.magicforecastDaily[f].windCompassDirection) != -1) {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection + " swellred";
                                                                } else {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection + " swellorange";
                                                                }
                                                        }														
                                                if (this.config.spotCoast === "S") {
                                                                if (this.config.southSpotBadWinds.indexOf(this.magicforecastDaily[f].windCompassDirection) != -1) {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection + " swellred";
                                                                } else {
                                                                        windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection + " swellorange";
                                                                }
                                                        }
						} // end else loop
				} // end wind colorization loop
				windInfo.appendChild(windInfoCell);

				windInfoCell = document.createElement("i");
				if (this.magicforecastDaily[f].windGusts <=this.config.greenWindMax) {
				windInfoCell.innerHTML = "&nbsp;" + this.magicforecastDaily[f].windCompassDirection + "<br>" + "Steady: " + this.magicforecastDaily[f].windSpeed + "mph<br>"  +"<span class=\"swellgreen\">Gusts: </span>" +this.magicforecastDaily[f].windGusts + "mph";
				}
				if (this.magicforecastDaily[f].windGusts > this.config.greenWindMax && this.magicforecastDaily[f].windGusts <= this.config.orangeWindMax) {
					 windInfoCell.innerHTML = "&nbsp;" + this.magicforecastDaily[f].windCompassDirection + "<br>" + "Steady: " + this.magicforecastDaily[f].windSpeed + "mph<br>"  +"<span class=\"swellorange\">Gusts: </span>" +this.magicforecastDaily[f].windGusts + "mph";
				}
				if (this.magicforecastDaily[f].windGusts >= this.config.redWindMax) {
					windInfoCell.innerHTML = "&nbsp;" + this.magicforecastDaily[f].windCompassDirection + "<br>" + "Steady: " + this.magicforecastDaily[f].windSpeed + "mph<br>"  +"<span class=\"swellred\">Gusts: </span>" +this.magicforecastDaily[f].windGusts + "mph";
				}

				windInfoCell.className = "hour";
				windInfo.appendChild(windInfoCell);
				row_wind.appendChild(windInfo);

				var nl = Number(f) + 1;
				if ((nl % 4) === 0) {
					table.appendChild(row_forecastDay);
					table.appendChild(row_forecastRating);
					table.appendChild(row_swellCharacteristics);
					table.appendChild(row_swell);
					table.appendChild(row_wind);
					row_forecastDay = document.createElement("tr");
					row_forecastRating = document.createElement("tr");
					row_swellCharacteristics = document.createElement("tr");
					row_swell = document.createElement("tr");
					row_wind = document.createElement("tr");
				}

                               //Force Daily row to stay on one line...not entirely sure how this works.
			        if (f > 2) {
			        break;
			        }
			} //end magicForecastDaily loop
			
			//Close forecast table for rendering to UI
			table.appendChild(row_forecastDay);
			table.appendChild(row_forecastRating);
			table.appendChild(row_swellCharacteristics);
			table.appendChild(row_swell);
			table.appendChild(row_wind);
			fctable.appendChild(table);
			wrapper.appendChild(fctable);
	    		
	    		//lastupdated indicator
	    var table_lastUpdated = document.createElement("table");
	    var row_lastUpdated = document.createElement("tr");
	    lastUpdatedCell = document.createElement("td");
		lastUpdatedCell.setAttribute('style', "display:flex; flex-wrap: nowrap; align-items: center;font-size: 40%");
	    lastUpdatedCell.setAttribute("colSpan", "10");
	   // lastUpdatedCell.className = "weathericon";
	    lastUpdatedCell.innerHTML = "last updated at: " + this.lastUpdatedTime + "&nbsp; &nbsp; &nbsp; &nbsp;<img src='https://im-5.msw.ms/md/themes/msw_built/3/i/logo.png'>";
	    row_lastUpdated.appendChild(lastUpdatedCell);
	    table_lastUpdated.appendChild(row_lastUpdated);
	    wrapper.appendChild(table_lastUpdated);

        return wrapper; //return the wrapper to browser for rendering
    }, //end getDom function


    /* processWeather(data)
     * 
     * Processes Wunderground data for current conditions data only. 
     * this feeds the first row of icons
     */

    processWeather: function(data) {
        if (this.config.debug === 1) { Log.info(data); } //print Object to browser console
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " Processing Data: Wunderground (6)") };
        if (data.current_observation.estimated.hasOwnProperty("estimated") && this.haveforecast == 1) {
            if (this.config.debug === 1) { console.log("WeatherUnderground served us an estimated forecast. Skipping update..."); }
            return;
        }

        this.haveforecast = 1;

        if (data.response.hasOwnProperty("error")) {
            this.errorDescription = data.response.error.description;
            this.error = true;
            this.updateDom(this.config.animationSpeed);
        } else {
            this.error = false;
            var forecast;
            var i;
            var count;
            var iconTable = this.config.iconTableDay;
            this.alerttext = "";
            this.alertmsg = "";
            var sunrise = new Date();
            this.sunrhour = Number(data.sun_phase.sunrise.hour);
            sunrise.setHours(data.sun_phase.sunrise.hour);
            sunrise.setMinutes(data.sun_phase.sunrise.minute);

            var sunset = new Date();
            this.sunshour = Number(data.sun_phase.sunset.hour);
            sunset.setHours(data.sun_phase.sunset.hour);
            sunset.setMinutes(data.sun_phase.sunset.minute);

            // The moment().format("h") method has a bug on the Raspberry Pi.
            // So we need to generate the timestring manually.
            // See issue: https://github.com/MichMich/MagicMirror/issues/181
	    var now = new Date(); // pull in T/D for processing
            var sunriseSunsetDateObject = (sunrise < now && sunset > now) ? sunset : sunrise;
            var timeString = moment(sunriseSunsetDateObject).format("HH:mm");

            if (this.config.timeFormat !== 24) {
                if (this.config.showPeriod) {
                    if (this.config.showPeriodUpper) {
                        timeString = moment(sunriseSunsetDateObject).format("h:mm A");
                    } else {
                        timeString = moment(sunriseSunsetDateObject).format("h:mm a");
                    }
                } else {
                    timeString = moment(sunriseSunsetDateObject).format(
                        "h:mm");
                }
            } // end timeFormat if

            this.sunriseSunsetTime = timeString;
            this.sunriseSunsetIcon = (sunrise < now && sunset > now) ? "wi-sunset" : "wi-sunrise";
            this.iconTable = (sunrise < now && sunset > now) ? this.config
                .iconTableDay : this.config.iconTableNight;


            this.weatherType = this.iconTable[data.current_observation.icon];
            this.windDirection = this.deg2Cardinal(data.current_observation.wind_degrees);
            this.windDirectionTxt = data.current_observation.wind_dir;
            this.Humidity = data.current_observation.relative_humidity;
            this.Humidity = this.Humidity.substring(0, this.Humidity.length - 1);
            this.windSpeed = "wi-wind-beaufort-" + this.ms2Beaufort(data.current_observation.wind_kph);
            this.windSpeedMph = data.current_observation.wind_mph;
            this.moonPhaseIcon = "<img class='moonPhaseIcon' src='https://www.wunderground.com/graphics/moonpictsnew/moon" + data.moon_phase.ageOfMoon + ".gif'>";

            if (this.config.units == "metric") {
                this.temperature = data.current_observation.temp_c;
                var fc_text = data.forecast.txt_forecast.forecastday[0].fcttext_metric.replace(/(.*\d+)(C)(.*)/gi, "$1°C$3");
            } else {
                this.temperature = data.current_observation.temp_f;
                var fc_text = data.forecast.txt_forecast.forecastday[0].fcttext;
            }

            this.temperature = this.roundValue(this.temperature);
            this.weatherTypeTxt = "<img src='./modules/MMM-WunderGround/img/" + this.config.iconset + "/" +
                data.current_observation.icon_url.replace('http://icons.wxug.com/i/c/k/', '').replace('.gif', '.png') +
                "' style='vertical-align:middle' class='currentWeatherIcon'>";

            this.loaded = true;
            this.updateDom(this.config.animationSpeed);
            if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' Rendering Wunderground data to UI (7)'); }
            if (this.config.debug === 1) { Log.info('-------------------------------------------------------------------'); }
        } //end if/else clause
    }, //end processWunderground

    /* processNOAA_TIDE_DATA(data)
     *
     * Processes NOAA Tide Data to find previous, current, immediate next, and future tides
     * 
     */
    processNOAA_TIDE_DATA: function(data) {
        //JSON Structure - { "predictions" : [{"t":"2017-11-24 04:28", "v":"0.845", "type":"L"}
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " Processing Data: NOAA_TIDE (6)") };
        if (this.config.debug === 1) { Log.info(data); } //print Object to browser console

        var previousTideCount = 0;
        var NextTide = ""; //flag for IDing the next tide after Current
        var CurrentTide = ""; //flag for IDing the current tide given current time compared to previous and next tide
        for (i = 0, count = data.predictions.length; i < count; i++) {
            var len = data.predictions.length;
            var current = data.predictions[i];
            var previous = data.predictions[(i + len - 1) % len];
            var next = data.predictions[(i + 1) % len];
            //Modulus to itterate through Object to get next tide

            var TideTableTime = new Date(current.t); //get current tide date element [i]
            var NextTideTime = new Date(next.t); //get next tide date element [i+1] 
            var PrevTideTime = new Date(previous.t); //get previous tide date element [i-1]
            if (current.type == "H") { data.predictions[i].type = "High"; } //change Object element from H to High
            if (current.type == "L") { data.predictions[i].type = "Low"; } //change Object element from L to Low
	    var now = new Date(); //define current time/date for processing

            if ((CurrentTide == "" || CurrentTide == "false") && (TideTableTime >= now && TideTableTime <= NextTideTime)) {
                //Evaluate if the Tide is current, if so skip. If no, evaluate time of tide
                //if the tide time provided by NOAA is between now (current date/time) and the next tide...we're in the current tide!
                NextTide = 'false'; //set flag
                CurrentTide = 'true'; //set flag
                data.predictions[i].TideStatus = 'CURRENT'; //add indicator to NOAA Tide Object

                var TideDelta = Math.abs(TideTableTime - PrevTideTime) / 36e5;
                //returns in miliseconds 36e5 is the scientific notation for 60*60*1000, dividing by which converts the milliseconds difference into hours 
                //delta between Current Tide and Previous Tide, returns hours
                var TideDeltaNow = Math.abs(now - PrevTideTime) / 36e5;
                //delta between current Time and Previous Tide in Object[i-1]
                this.DeltaPerc = Math.round(Math.abs(TideDeltaNow / TideDelta) * 100);
                //divide two deltas to get percentage of action for current tide

                continue;
            }

            if (TideTableTime < now) {
                //if NOAA provided time is less than current date/time, it's in the past

                NextTide = "false";
                CurrentTide = "false";
                data.predictions[i].TideStatus = "PREVIOUS"; //add indicator to NOAA Tide Object
                continue;
            }
            if (CurrentTide == "true" && NextTide == "false" && NextTideTime > TideTableTime) {
                //if the NextTideTime is greater than the current TideTableTime[i] under eval, it's the next one
                NextTide = "true";
                data.predictions[i].TideStatus = "NEXT"; //add indicator to NOAA Tide Object
                continue;
            }
            if (CurrentTide == "true" && NextTide == "true") {
                //if all flags are true, then we're in the future
                data.predictions[i].TideStatus = "FUTURE"; //add indicator to NOAA Tide Object
                continue;
            }
        } //end for loop
        const currentKey = Object.keys(data.predictions).find(key => data.predictions[key].TideStatus === 'CURRENT');
        //find the Object ID based on the TideStatus key
        var CurTide = 0;
        var PTide = 0;
        var NTide = 0;
        CurTide = currentKey;
        PTide = CurTide; //solving for javascript math weirdness
        PTide--; //subtrack one from CurTide to get Previous Tide
        NTide = CurTide;
        NTide++; //Add one to CurTide to get next tide

        var TideTypePrevious = data.predictions[PTide].type;
        var TideHeightPrevious = data.predictions[PTide].v;
        var TideTimePrevious = new Date(data.predictions[PTide].t);
        if (this.config.debug === 1) {
            Log.info("---PREVIOUS TIDE--- " + TideTypePrevious + " tide was at: " + TideTimePrevious + " with a height of " + TideHeightPrevious + " ft.");
        }
        this.TideTimeCurrent = new Date(data.predictions[CurTide].t); //Object variable t for time
        this.TideHeightCurrent = this.roundValue(data.predictions[CurTide].v); // Current tide height
        this.TideTypeCurrent = data.predictions[CurTide].type; // High or Low
        if (this.config.debug === 1) {
            Log.info("***CURRENT TIDE*** " + this.DeltaPerc + "% into " + this.TideTypeCurrent + " tide. Full tide @ " + this.TideTimeCurrent.getHours() + ":" + this.TideTimeCurrent.getMinutes() + "with a height of " + this.TideHeightCurrent + "ft.");
        }
        this.TideTimeNext = new Date(data.predictions[NTide].t);
        this.TideHeightNext = this.roundValue(data.predictions[NTide].v);
        this.TideTypeNext = data.predictions[NTide].type;
        if (this.config.debug === 1) {
            Log.info("+++NEXT TIDE+++ " + this.TideTypeNext + " tide is at: " + this.TideTimeNext + " with a height of " + this.TideHeightNext + " ft.");
        }
        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' Rendering NOAA Tide data to UI (7)'); }
        if (this.config.debug === 1) { Log.info('-------------------------------------------------------------------'); }
    }, // end processNOAA_TIDE_DATA function

    /* processNOAA_WATERTEMP(data)
     *
     * Processes NOAA Water Temperature data to find 
     * current water temperature
     * 
     */

    processNOAA_WATERTEMP: function(data) {
        //Example JSON structure:
        //"metadata":{"id":"8534720","name":"Atlantic City","lat":"39.3550","lon":"-74.4183"}, 
        //"data": [{"t":"2017-11-24 00:00", "v":"50.7", "f":"0,0,0"}
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " Processing Data: NOAA Water Temp (6)") };
        if (this.config.debug === 1) { Log.info(data); } //print Object to browser console
        var stationID = data.metadata.id; //only used in debug mode currently
        var stationName = data.metadata.name; //only used in debug mode currently
        //var coords_lat = data.metadata.lat; //not used
        //var coords_lon = data.metadata.lon; //not used

        //Effeciency assumption: most current reading will always be last element
        //NOAA provides 13 measurements. Object counts start at 0...need to subtract 1 to get to item 12, the most recent measurement
	var now = new Date();
        var CurrentHour = now.getHours();
        var WaterTempLength = data.data.length - 1;
        var WaterTempTime = new Date(data.data[WaterTempLength].t);
        var WaterTempHour = WaterTempTime.getHours();

	this.WaterTemp = data.data[WaterTempLength].v; // pull current water temp from data.
        if (this.config.debug === 1) {
            Log.info("***CURRENT WATER*** temperature at " + stationName + " is: " + this.WaterTemp + " at " + WaterTempTime + ".");
        }

        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' Rendering NOAA Water Temp data to UI (7)'); }
        if (this.config.debug === 1) { Log.info('-------------------------------------------------------------------'); }
    }, // end processNOAA_WATERTEMP function


    /* processMAGICSEAWEED (data)
     *
     * Uses the received Magicseaweed Forecast to display wave and swell data
     * 
     */

    processMAGICSEAWEED: function(data) {
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " Processing Data: Magicseaweed (6)") };
        //if (this.config.debug === 1) {Log.info(data);}	//print Object to browser console 

        for (i = 0, count = data.length; i < count; i++) {
           	// identify the forecasts in the next 12 hours for rendering in 12hr
		// forecast row
		// Capture the forecast that is in the current window of 3 hours
		var currentForecast = moment.unix(data[i].localTimestamp);
		var now = new Date(); //current time/date for processing
		var firstForecast = moment(now).subtract(3, 'hours');
		var lastForecast = moment(firstForecast).add(12, 'hours'); 
	   if (currentForecast >= firstForecast && currentForecast <= lastForecast ) { 
                data[i].next12hrs = "true";
            } else {
                data[i].next12hrs = "false";
            }
	   if (currentForecast < firstForecast) {data[i].localTimestamp = "IGNORE";} //ignore things far in the past	
        } //end for loop


        for (i = 0, count = data.length; i < count; i++) {
		/* STEP 0
		 * Forecast score for displaying each day's best possible time to surf
		 * Crude but effective...remember, this is to make you look on the
		 * forecast websites for more data not SCIENCE!
		 */

		var forecastScore = 0;
		// MS star rating forms basis of score
		if (data[i].solidRating > 0) {forecastScore = data[i].solidRating;} 
		// +1 if the swell height is within bounds for the spot set in the config
		if (data[i].swell.components.primary.height >= this.config.spotSwellMin && data[i].swell.components.primary.height <= this.config.spotSwellMax) {forecastScore++;}
		// +1 if the period is over 8s
		if (data[i].swell.components.primary.period >=8) {forecastScore++;} 
		// +1 if swell direction is good for the spot as defined in config
                for (z = 0, countz = this.config.spotSwellHold.length; z < countz; z++) {
			if (this.config.spotSwellHold[z] == data[i].swell.components.primary.compassDirection) {forecastScore++;}
		} 
		// +1 if Wind direction is good for the spot as defined in config
                for (x = 0, countx = this.config.spotWind.length; x < countx; x++) {
			if (this.config.spotWind[x] == data[i].wind.compassDirection) {forecastScore++;}
		}
		// +1 is there are only 1 or 2 swells. 3 swells gets no points as it may be slop
		if (Object.keys(data[i].swell.components).length <=2) {forecastScore++;}
		// +1 if wind speed is less than 15mph
		if (data[i].wind.speed < 15) {forecastScore++;} 
		// -1 if wind speed is greater than or equal 15mph
		if (data[i].wind.speed >= 15) {forecastScore--;}
		// -1 if gusts are over 20 mph
		if (data[i].wind.gusts >= 20) {forecastScore--;}
		// -1 for generally unsurfable times 1am, 7pm, and 10pm
		if (moment.unix(data[i].localTimestamp).format('HH') == 01 || 
			moment.unix(data[i].localTimestamp).format('HH') == 19 ||
			moment.unix(data[i].localTimestamp).format('HH') == 22) {forecastScore--;}
		data[i].forecastScore = forecastScore;
		data[i].forecastDay = moment.unix(data[i].localTimestamp).format('ddd');	
	} // end forecast score loop


	/*
	 * STEP 1 to find best forecast day:
	 * Build array with limited info from our raw Magicseaweed table
	 * Includes: Day, time (hour), score from above, and timestamp
	 */
	var forecastsByDateSortable = [];
	var forecastsByDateSorted = [];
	for (i = 0, count = data.length; i < count; i++) {
		if (data[i].localTimestamp != "IGNORE" && data[i].next12hrs == "false") {
                if(forecastsByDateSortable[data[i].forecastDay] == null) {
			forecastsByDateSortable.push({
			day: data[i].forecastDay,
			time: moment.unix(data[i].localTimestamp).format('hh:mm A'), 
                        score: data[i].forecastScore,
                        timestamp: data[i].localTimestamp});
                        
                } else {
                        forecastsByDateSortable.push({
			day: data[i].forecastDay,
			time: moment.unix(data[i].localTimestamp).format('hh:mm A'),
                        score: data[i].forecastScore,
                        timestamp: data[i].localTimestamp});
                }//end else
        	}//end if
	} //end for
	
	/*
	 * STEP 2: Sort Array created in Step 1 
	 * dynamicSort & dynamicSortMultiple from  
	 * StackOverflow user: https://stackoverflow.com/users/300011/ege-%c3%96zcan 
	 * https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value-in-javascript/4760279#4760279
	 */ 
	function dynamicSort(property) {
		var sortOrder = 1;
		if(property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		} //end if
		return function (a,b) {
			var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
			return result * sortOrder;
		} //end return function
	} //end dynamicSort function
	function dynamicSortMultiple() {
		/*
		 * save the arguments object as it will be overwritten
		 * note that arguments object is an array-like object
		 * consisting of the names of the properties to sort by
		 */
		var props = arguments;
		return function (obj1, obj2) {
			var i = 0, result = 0, numberOfProperties = props.length;
			/* try getting a different result from 0 (equal)
			 * as long as we have extra properties to compare
			 */
			while(result === 0 && i < numberOfProperties) {
				result = dynamicSort(props[i])(obj1, obj2);
				i++;
			} //end while
			return result;
		} // end return function
	} //end dynamicSortMultiple function


	//STEP 3 - Create new, sorted, array
	forecastsByDateSorted = forecastsByDateSortable.sort(dynamicSortMultiple("day", "-score"));

	//STEP 4 - Create new Object keyed by Day of week. The first entry per day is the "best".
	var forecastsByDate = {};
	for (i = 0, count = forecastsByDateSorted.length; i < count; i++) {
		if (forecastsByDate[forecastsByDateSorted[i].day] == null) {
			forecastsByDate[forecastsByDateSorted[i].day] = [];
		} //end if
		forecastsByDate[forecastsByDateSorted[i].day].push(forecastsByDateSorted[i]);
	} //end for

	//STEP 5 - Pull the timestamp(s) for the identified best days into an array.
	var bestTimestamps = [];
	for(var key in forecastsByDate) {
		bestTimestamps.push(forecastsByDate[key][0].timestamp);
	} //end for		

	//STEP 6 - match values in bestTimestamps array with timestamp values in data[]
	// set dailybest flag when values match 
	for (i = 0, count = data.length; i < count; i++) {		
		for (xz = 0, countxz = bestTimestamps.length; xz < countxz; xz++) {
			if (bestTimestamps[xz] == data[i].localTimestamp) {
				data[i].dailyBest = "true";
			} //end if
		} //end nested for
        } //end for	

	if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " Magicseaweed API Response:") };
        if (this.config.debug === 1) { Log.info(data) }; //show data after manipulations above

        this.magicforecast12hrs = []; // rebuild MagicSeaweed hourly data to shape our needs
        this.magicforecastDaily = []; //daily
        for (i = 0, count = data.length; i < count; i++) {
            if (data[i].localTimestamp != "IGNORE") {
                this.magicday = moment.unix(data[i].localTimestamp).format('ddd');
                this.magichour = moment.unix(data[i].localTimestamp).format('hh:mm A');
                this.solidRating = data[i].solidRating;
                this.fadedRating = data[i].fadedRating;
                //build star rating object based on https://magicseaweed.com/developer/forecast-api
                this.rating = [];
                // Loop the solid rating on a single forecast object.
                for (var j = 0; j < this.solidRating; j++) {
                   // this.rating.push('<img src="http://cdnimages.magicseaweed.com/star_filled.png" />');
			this.rating.push('<span class=\"swellgreen\"><i class="fa fa-small fa-star"></i></span>');
		}

                // Loop the faded rating on a single forecast object.
                for (var j = 0; j < this.fadedRating; j++) {
                    //this.rating.push('<img src="http://cdnimages.magicseaweed.com/star_empty.png" />');
                        //this.rating.push('<span class=\"swellblue\"><i class="fa fa-small fa-star-o"></i></span>'); //Star outline
			this.rating.push('<span class=\"swellorange\"><i class="fa fa-small fa-star"></i></span>');
		}
                // PROCESS SWELL INFO
                // set Multiple swell flag (indicator for viewer to goto site)
                this.swellCount = Object.keys(data[i].swell.components).length;
                if (this.swellCount >= 2) {
                    this.multipleSwell = "true";
                } else {
                    this.multipleSwell = "false";

                }
				
                //Pull Primary swell info only. ignore combined, secondary, and tertiary 
                //Ignored for screen space considerations
                this.swellMaxBreakingHeight = data[i].swell.maxBreakingHeight;
                this.swellMinBreakingheight = data[i].swell.minBreakingHeight;
                this.swellDirection = data[i].swell.components.primary.direction;
		this.swellCompassDirection = data[i].swell.components.primary.compassDirection;
                this.swellHeight = data[i].swell.components.primary.height;
                this.swellPeriod = data[i].swell.components.primary.period;
                this.winddirection = this.deg2Cardinal(data[i].wind.direction);
		this.windCompassDirection = data[i].wind.compassDirection; 
                this.windgusts = data[i].wind.gusts;
                this.windspeed = data[i].wind.speed;
                this.windunit = data[i].wind.unit;
                this.dailyBest = data[i].dailyBest;
                //Build next 12-hours forecast 
                if (data[i].next12hrs == "true") {
                    this.magicforecast12hrs.push({
                        day: this.magicday,
                        hour: this.magichour,
                        best: this.dailyBest,
                        solidRating: this.solidRating,
                        fadedRating: this.fadedRating,
                        rating: this.rating,
                        multipleSwell: this.multipleSwell,
                        swellCount: this.swellCount,
                        maxHeight: this.swellMaxBreakingHeight,
                        minHeight: this.swellMinBreakingheight,
                        swellDirection: this.swellDirection,
			swellCompassDirection: this.swellCompassDirection,
                        swellHeight: this.swellHeight,
                        swellPeriod: this.swellPeriod,
                        windDirection: this.winddirection,
			windCompassDirection: this.windCompassDirection,
                        windGusts: this.windgusts,
                        windSpeed: this.windspeed,
                        windUnit: this.windunit,
                    });
                } // end hourly forecast creation

                //Create daily forecast based on "dailyBest" declared variable
                if (data[i].dailyBest == "true") {
                    this.magicforecastDaily.push({
                        day: this.magicday,
                        hour: this.magichour,
                        best: this.dailyBest,
                        solidRating: this.solidRating,
                        fadedRating: this.fadedRating,
                        rating: this.rating,
                        multipleSwell: this.multipleSwell,
                        swellCount: this.swellCount,
                        maxHeight: this.swellMaxBreakingHeight,
                        minHeight: this.swellMinBreakingheight,
                        swellDirection: this.swellDirection,
			swellCompassDirection: this.swellCompassDirection,
                        swellHeight: this.swellHeight,
                        swellPeriod: this.swellPeriod,
                        windDirection: this.winddirection,
			windCompassDirection: this.windCompassDirection,
                        windGusts: this.windgusts,
                        windSpeed: this.windspeed,
                        windUnit: this.windunit,
                    });
                } //end magicforecastDaily
            } // end IGNORE if statement	
        } //end for loop

	if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " Magicseaweed 12 Hours Forecast:") };
        if (this.config.debug === 1) { Log.info(this.magicforecast12hrs); } //print Object to browser console
	if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " Magicseaweed Daily Forecast:") };
        if (this.config.debug === 1) { Log.info(this.magicforecastDaily); } //print Object to browser console

        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
        if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' Rendering Magicseaweed data to UI (7)'); }
        if (this.config.debug === 1) { Log.info('-------------------------------------------------------------------'); }
    }, //end processMAGICSEAWEED

    // ------------------------------------ DATA SHAPING ROUTINES ----------------------------

    /* ms2Beaufort(ms)
     * Converts m2 to beaufort (windspeed).
     *
     * see:
     *  http://www.spc.noaa.gov/faq/tornado/beaufort.html
     *  https://en.wikipedia.org/wiki/Beaufort_scale#Modern_scale
     *
     * argument ms number - Windspeed in m/s.
     *
     * return number - Windspeed in beaufort.
     */
    ms2Beaufort: function(kmh) {
        var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102,
            117, 1000
        ];
        for (var beaufort in speeds) {
            var speed = speeds[beaufort];
            if (speed > kmh) {
                return beaufort;
            }
        }
        return 12;
    },

    wordwrap: function(str, width, brk) {

        brk = brk || "n";
        width = width || 75;


        if (!str) {
            return str;
        }

        var re = new RegExp(".{1," + width +
            "}(\\s|$)|\\ S+?(\\s|$)", "g");

        var wordwrapped = str.trim().match(RegExp(re));
        for (var i in wordwrapped) {
            wordwrapped[i] = wordwrapped[i].trim();
        }

        return wordwrapped.join(brk);

    },

    /* function(deg2Cardinal)
     * 
     * takes decimal degree and returns wind direction
     * 
     * note: direction returned is where the wind is blowing FROM 
     * 
     */

    deg2Cardinal: function(deg) {
        if (deg > 11.25 && deg <= 33.75) {
            return "wi-from-nne";
        } else if (deg > 33.75 && deg <= 56.25) {
            return "wi-from-ne";
        } else if (deg > 56.25 && deg <= 78.75) {
            return "wi-from-ene";
        } else if (deg > 78.75 && deg <= 101.25) {
            return "wi-from-e";
        } else if (deg > 101.25 && deg <= 123.75) {
            return "wi-from-ese";
        } else if (deg > 123.75 && deg <= 146.25) {
            return "wi-from-se";
        } else if (deg > 146.25 && deg <= 168.75) {
            return "wi-from-sse";
        } else if (deg > 168.75 && deg <= 191.25) {
            return "wi-from-s";
        } else if (deg > 191.25 && deg <= 213.75) {
            return "wi-from-ssw";
        } else if (deg > 213.75 && deg <= 236.25) {
            return "wi-from-sw";
        } else if (deg > 236.25 && deg <= 258.75) {
            return "wi-from-wsw";
        } else if (deg > 258.75 && deg <= 281.25) {
            return "wi-from-w";
        } else if (deg > 281.25 && deg <= 303.75) {
            return "wi-from-wnw";
        } else if (deg > 303.75 && deg <= 326.25) {
            return "wi-from-nw";
        } else if (deg > 326.25 && deg <= 348.75) {
            return "wi-from-nnw";
        } else {
            return "wi-from-n";
        }
    },

	cardinalOpposite: function(card) {
        if (card === "NNE") {
            return "SSW";
        } else if (card === "NE") {
            return "SW";
        } else if (card === "ENE") {
            return "WSW";
        } else if (card === "E") {
            return "W";
        } else if (card === "ESE") {
            return "WNW";
        } else if (card === "SE") {
            return "NW";
        } else if (card === "SSE") {
            return "NNW";
        } else if (card === "S") {
            return "N";
        } else if (card === "SSW") {
            return "NNE";
        } else if (card === "SW") {
            return "NE";
        } else if (card === "WSW") {
            return "ENE";
        } else if (card === "W") {
            return "E";
        } else if (card === "WNW") {
            return "ESE"; //ORANGE
        } else if (card === "NW") {
            return "SE"; //ORANGE
        } else if (card === "NNW") {
            return "SSE"; // ORANGE
        } else {
            return "S";
        }
    },

    /* function(temperature)
     * Rounds a temperature to 1 decimal.
     *
     * argument temperature number - Temperature.
     *
     * return number - Rounded Temperature.
     */
    roundValue: function(temperature) {
        return parseFloat(temperature).toFixed(this.config.roundTmpDecs);
    },

    // ------------------ SOCKET CONFIGURATION --------------------------
    socketNotificationReceived: function(notification, payload) {
            var self = this;

            if (notification === 'WUNDERGROUND') {
                if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' SOCKET(RECEIVED FROM HELPER) (5): ' + notification + ' Payload data'); }
                self.processWeather(JSON.parse(payload));
            }
            if (notification === 'NOAA_TIDE_DATA') {
                if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' SOCKET(RECEIVED FROM HELPER) (5): ' + notification + ' Payload data'); }
                self.processNOAA_TIDE_DATA(JSON.parse(payload));
            }
            if (notification === 'NOAA_WATERTEMP') {
                if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' SOCKET(RECEIVED FROM HELPER) (5): ' + notification + ' Payload data'); }
		Log.info(payload);
		    self.processNOAA_WATERTEMP(JSON.parse(payload));
            }
            if (notification === 'MAGICSEAWEED') {
                if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' SOCKET(RECEIVED FROM HELPER) (5): ' + notification + ' Payload data'); }
                self.processMAGICSEAWEED(JSON.parse(payload));
		    	if (this.config.debug === 1) { Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + " SOCKET(SEND TO HELPER): UPDATE_TIMER"); }
		    	this.sendSocketNotification("UPDATE_TIMER", this.config);
		    
            }
            if (notification === 'HELPER_MESSAGE') {
                if (this.config.debug === 1) { Log.info(payload); }
		}
	    if (notification === 'LAST_UPDATED') {
		this.lastUpdatedTime = payload; //set last update time.
		if (this.config.debug === 1) {Log.info(moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ') + ' SOCKET(RECEIVED FROM HELPER) (8): ' + notification + ' ' +this.lastUpdatedTime);
		}
	    }

        } // end socketNotificationReceived function

}); // End Module
