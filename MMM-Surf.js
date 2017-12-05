/* global Module */
/* Magic Mirror
 * Module: MMM-Surf 
 * Forked from RedNax's MMM-Wunderground module
 * By PrivacyWonk 
 * MIT Licensed.
 */

//define some globals
var spotText = "";
var now = new Date();
//TODO: Move more variables to global place and stop using "this." construct
var WaterTemp = "";

Module.register("MMM-Surf", {

    // Default module config.
    defaults: {
        MagicSeaweedSpotID: "", //spot ID from magic seaweed URL (e.g. 319 from http://magicseaweed.com/Ocean-City-NJ-Surf-Report/391/)
        MagicSeaweedSpotName: "", // shorthand name for your spot...e.g. Secret Spot / Lowers / The End / etc
        MagicAPI: "",
        debug: 0,
        Wuapikey: "",
        WuPWS: "",
        station_id: "", //Numeric station ID from NOAA
        noaatz: "", // gmt, lst, lst_ldt (Local Standard Time or Local Daylight Time) of station
        currentweather: 1,
        coloricon: false,
        units: config.units,
        windunits: "bft", // choose from mph, bft
        updateInterval: 3600000, //60 minutes in miliseconds
        animationSpeed: 1000,
        timeFormat: config.timeFormat,
        lang: config.language,
        showWindDirection: true,
        fade: true,
        fadePoint: 0.25, // Start on 1/4th of the list.
        tz: "",
        fcdaycount: "5",
        fcdaystart: "0",
        layout: "horizontal",
        daily: "1",
        hourly: "0",
        hourlyinterval: "3",
        hourlycount: "2",
        fctext: "1",
        alerttime: 5000,
        roundTmpDecs: 1,
        UseCardinals: 0,
        layout: "vertical",
        sysstat: 0,
        scaletxt: 1,
        iconset: "VCloudsWeatherIcons",
        enableCompliments: 0,
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

    // Define required scripts.
    getScripts: function() {
        return ["moment.js"];
    },

    // Define required scripts.
    getStyles: function() {
        return ["weather-icons.css", "weather-icons-wind.css", "MMM-Surf.css"];
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
        this.getWunder();
        this.getNOAA();
        this.getMagicseaweed();
        this.updateTimer = null;
        this.haveforecast = 0;

    },

    getNOAA: function() {
        if (this.config.debug === 1) { Log.info(moment().format() + " SOCKET(SEND TO HELPER): GET_NOAA (1):"); }
        this.sendSocketNotification("GET_NOAA", this.config);
    }, //end getNOAA function

    getWunder: function() {
        if (this.config.debug === 1) { Log.info(moment().format() + " SOCKET(SEND TO HELPER): GET_WUNDERGROUND (1):"); }
        this.sendSocketNotification("GET_WUNDERGROUND", this.config);
    }, //end GetWunder


    getMagicseaweed: function() {
        if (this.config.debug === 1) { Log.info(moment().format() + " SOCKET(SEND TO HELPER): GET_MAGIC (1):"); }
        this.sendSocketNotification("GET_MAGIC", this.config);
    }, //end getMagicseaweed function


    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");
        var f;
        var forecast;
        var iconCell;
        var icon;
        var maxTempCell;
        var minTempCell;
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

        if (this.config.currentweather === 1) {
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
                spotTextCell.className = "forecastText";
                spotTextCell.setAttribute("colSpan", "10");
                //spotTextCell.innerHTML = this.config.MagicSeaweedSpotName + "&nbsp; <img src='https://im-5.msw.ms/md/themes/msw_built/3/i/logo.png'>";
                spotTextCell.innerHTML = this.config.MagicSeaweedSpotName;

                spot_row.appendChild(spotTextCell);
                table_sitrep.appendChild(spot_row);
            }


            var weatherIcon = document.createElement("td");
            if (this.config.coloricon) {
                weatherIcon.innerHTML = this.weatherTypeTxt;
            } else {
                weatherIcon.className = "wi " + this.weatherType;
            }
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
            if (this.config.UseCardinals === 0) {
                windDirectionIcon.className = "wi wi-wind " + this.windDirection;
                windDirectionIcon.innerHTML = "&nbsp;";
            } else {
                windDirectionIcon.innerHTML = this.windDirectionTxt;
            }
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

            // New section for water
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

            // Display Water Temperature
            var WaterIcon = document.createElement("td");
            WaterIcon.className = "wi";
            row_watersitrep.appendChild(WaterIcon);

            var WaterTxt = document.createElement("td");
            WaterTxt.innerHTML = Math.round(WaterTemp) + "&deg;"; //round to nearest whole because 50.2 degrees doesn't make any fucking difference
            WaterTxt.className = "vcen left";
            row_watersitrep.appendChild(WaterTxt);

            //Display Tide Data
            var TideIcon = document.createElement("td");
            TideIcon.innerHTML = "<img src='./modules/MMM-Surf/img/" + this.TideTypeCurrent + ".png" + "'>";
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


            wrapper.appendChild(small);
            wrapper.appendChild(small2);

        } // end currentweather

        // Forecast table
        //TODO: Make Vertical format work with Surf Forecast! Currently only horizontal
        // ------------------ Vertical Layout ------------------
        var table = document.createElement("table");
        table.className = "small";
        table.setAttribute("width", "25%");

        if (this.config.layout == "vertical") {

            var row = document.createElement("tr");
            table.appendChild(row);

            if (this.config.fctext == 1) {
                var forecastTextCell = document.createElement("td");
                // forecastTextCell.className = "forecastText";
                forecastTextCell.setAttribute("colSpan", "10");
                forecastTextCell.innerHTML = this.forecastText;

                row.appendChild(forecastTextCell);
            }

            row = document.createElement("tr");

            var dayHeader = document.createElement("th");
            dayHeader.className = "day";
            dayHeader.innerHTML = "";
            row.appendChild(dayHeader);

            var iconHeader = document.createElement("th");
            iconHeader.className = "tableheader icon";
            iconHeader.innerHTML = "";
            row.appendChild(iconHeader);

            var maxtempHeader = document.createElement("th");
            maxtempHeader.className = "align-center bright tableheader";
            row.appendChild(maxtempHeader);

            var maxtempicon = document.createElement("span");
            maxtempicon.className = "wi wi-thermometer";
            maxtempHeader.appendChild(maxtempicon);


            var mintempHeader = document.createElement("th");
            mintempHeader.className = "align-center bright tableheader";
            row.appendChild(mintempHeader);

            var mintempicon = document.createElement("span");
            mintempicon.className = "wi wi-thermometer-exterior";
            mintempHeader.appendChild(mintempicon);


            var popiconHeader = document.createElement("th");
            popiconHeader.className = "align-center bright tableheader";
            popiconHeader.setAttribute("colSpan", "10");
            row.appendChild(popiconHeader);

            var popicon = document.createElement("span");
            popicon.className = "wi wi-umbrella";
            popicon.setAttribute("colSpan", "10");
            popiconHeader.appendChild(popicon);

            table.appendChild(row);

            if (this.config.hourly == 1) {
                for (f in this.forecast) {
                    forecast = this.hourlyforecast[f * this.config.hourlyinterval];

                    row = document.createElement("tr");
                    table.appendChild(row);

                    hourCell = document.createElement("td");
                    hourCell.className = "hourv";
                    hourCell.innerHTML = forecast.hour;
                    row.appendChild(hourCell);

                    iconCell = document.createElement("td");
                    iconCell.className =
                        "align-center bright weather-icon";
                    row.appendChild(iconCell);

                    icon = document.createElement("span");
                    if (this.config.coloricon) {
                        icon.innerHTML = forecast.icon_url;
                    } else {
                        icon.className = "wi " + forecast.icon;
                    }
                    iconCell.appendChild(icon);

                    maxTempCell = document.createElement("td");
                    maxTempCell.innerHTML = forecast.maxTemp + "&deg;";
                    maxTempCell.className = "align-right max-temp";
                    row.appendChild(maxTempCell);

                    minTempCell = document.createElement("td");
                    minTempCell.innerHTML = forecast.minTemp + "&deg;";
                    minTempCell.className = "align-right min-temp";
                    row.appendChild(minTempCell);

                    popCell = document.createElement("td");
                    popCell.innerHTML = forecast.pop + "%";
                    popCell.className = "align-right pop";
                    row.appendChild(popCell);

                    mmCell = document.createElement("td");
                    mmCell.innerHTML = forecast.mm;
                    mmCell.className = "align-right mm";
                    row.appendChild(mmCell);

                    if (f > this.config.hourlycount) {
                        break;
                    }

                    if (this.config.daily == 0) {

                        if (this.config.fade && this.config.fadePoint < 1) {
                            if (this.config.fadePoint < 0) {
                                this.config.fadePoint = 0;
                            }
                            startingPoint = this.forecast.length * this.config.fadePoint;
                            steps = this.forecast.length - startingPoint;
                            if (f >= startingPoint) {
                                currentStep = f - startingPoint;
                                row.style.opacity = 1 - (1 / steps *
                                    currentStep);
                            }
                        }
                    }

                } //end for loop
            } // end hourly forecast


            if (this.config.daily == 1) {
                for (f in this.forecast) {
                    forecast = this.forecast[f];

                    row = document.createElement("tr");
                    table.appendChild(row);

                    dayCell = document.createElement("td");
                    dayCell.className = "day";
                    dayCell.innerHTML = forecast.day;
                    row.appendChild(dayCell);

                    iconCell = document.createElement("td");
                    iconCell.className = "align-center bright weather-icon";
                    row.appendChild(iconCell);

                    icon = document.createElement("span");
                    if (this.config.coloricon) {
                        icon.innerHTML = forecast.icon_url;
                    } else {
                        icon.className = "wi " + forecast.icon;
                    }
                    iconCell.appendChild(icon);

                    maxTempCell = document.createElement("td");
                    maxTempCell.innerHTML = forecast.maxTemp + "&deg;";
                    maxTempCell.className = "align-right max-temp";
                    row.appendChild(maxTempCell);

                    minTempCell = document.createElement("td");
                    minTempCell.innerHTML = forecast.minTemp + "&deg;";
                    minTempCell.className = "align-right min-temp";
                    row.appendChild(minTempCell);

                    popCell = document.createElement("td");
                    popCell.innerHTML = forecast.pop + "%";
                    popCell.className = "align-right pop";
                    row.appendChild(popCell);

                    mmCell = document.createElement("td");
                    mmCell.innerHTML = forecast.mm;
                    mmCell.className = "align-right mm";
                    row.appendChild(mmCell);

                    if (this.config.fade && this.config.fadePoint < 1) {
                        if (this.config.fadePoint < 0) {
                            this.config.fadePoint = 0;
                        }
                        startingPoint = this.forecast.length * this.config.fadePoint;
                        steps = this.forecast.length - startingPoint;
                        if (f >= startingPoint) {
                            currentStep = f - startingPoint;
                            row.style.opacity = 1 - (1 / steps *
                                currentStep);
                        }
                    }
                } // end for loop
            } //end daily


            wrapper.appendChild(table);

        } else {
            // ------------------ Horizontal Layout ------------------

            var fctable = document.createElement("div");
            var divider = document.createElement("hr");
            divider.className = "hrDivider";
            fctable.appendChild(divider);
            table = document.createElement("table");
            table.className = "small";
            table.setAttribute("width", "25%");

            if (this.config.hourly == 1) {

                row_time = document.createElement("tr");
                row_icon = document.createElement("tr");
                row_temp = document.createElement("tr");
                row_pop = document.createElement("tr");
                row_wind = document.createElement("tr");

                for (f in this.magicforecast) {
                    hourCell = document.createElement("td");
                    hourCell.className = "hour";
                    hourCell.innerHTML = this.magicforecast[f].day + " " + this.magicforecast[f].hour;
                    row_time.appendChild(hourCell);
                    //rating
                    iconCell = document.createElement("td");
                    iconCell.className = "align-center bright weather-icon";
                    icon = document.createElement("span");
                    if (this.magicforecast[f].rating.length == 0) {
                        icon.className = "wi wi-na";
                    } else {
                        icon.innerHTML = this.magicforecast[f].rating.join(" ");
                    }
                    iconCell.appendChild(icon);
                    row_icon.appendChild(iconCell);
                    //swell height and period
                    maxTempCell = document.createElement("td");
                    maxTempCell.innerHTML = this.magicforecast[f].swellHeight + "' @ " + this.magicforecast[f].swellPeriod + "s"
                    maxTempCell.className = "hour";
                    row_temp.appendChild(maxTempCell);
                    //swell direction
                    swellInfo = document.createElement("td");
                    swellInfoCell = document.createElement("i");
                    swellInfoCell.innerHTML = "Swell: &nbsp;";
                    swellInfoCell.className = "hour";
                    swellInfo.appendChild(swellInfoCell);

                    swellInfoCell = document.createElement("i");
                    //Note: Important that swell is going TOWARD a direction not blowing FROM a direction like wind. 
                    swellInfoCell.className = "wi wi-wind towards-" + Math.round(this.magicforecast[f].swellDirection) + "-deg";

                    swellInfo.appendChild(swellInfoCell);
                    row_pop.appendChild(swellInfo);

                    //wind direction
                    windInfo = document.createElement("td");
                    windInfoCell = document.createElement("i");
                    windInfoCell.innerHTML = "Wind: &nbsp;";
                    windInfoCell.className = "hour";
                    windInfo.appendChild(windInfoCell);

                    windInfoCell = document.createElement("i");
                    windInfoCell.className = "wi wi-wind " + this.magicforecast[f].windDirection;
                    windInfo.appendChild(windInfoCell);

                    windInfoCell = document.createElement("i");
                    windInfoCell.innerHTML = "&nbsp;&nbsp;" + this.magicforecast[f].windSpeed + "/" + this.magicforecast[f].windGusts + "mph";
                    windInfoCell.className = "smaller";
                    windInfo.appendChild(windInfoCell);
                    row_wind.appendChild(windInfo);

                    var nl = Number(f) + 1;
                    if ((nl % 4) === 0) {
                        table.appendChild(row_time);
                        table.appendChild(row_icon);
                        table.appendChild(row_temp);
                        table.appendChild(row_pop);
                        table.appendChild(row_wind);
                        row_time = document.createElement("tr");
                        row_icon = document.createElement("tr");
                        row_temp = document.createElement("tr");
                        row_pop = document.createElement("tr");
                        row_wind = document.createElement("tr");
                    }

                    if (f > this.config.hourlycount) {
                        break;
                    }
                } //end Magicforecast for loop

                //write out Forecast table (every 3 hours)
                table.appendChild(row_time);
                table.appendChild(row_icon);
                table.appendChild(row_temp);
                table.appendChild(row_pop);
                table.appendChild(row_wind);
                fctable.appendChild(table);
                fctable.appendChild(divider.cloneNode(true));

            } //end this.config.hourly = 1 hourly forecast

            // Create daily forecast
            table = document.createElement("table");
            table.className = "small";
            table.setAttribute("width", "25%");

            row_time = document.createElement("tr");
            row_icon = document.createElement("tr");
            row_temp = document.createElement("tr");
            row_pop = document.createElement("tr");
            row_wind = document.createElement("tr");


            if (this.config.daily == 1) {
                for (f in this.magicforecastDaily) {
                    dayCell = document.createElement("td");
                    dayCell.className = "hour";
                    dayCell.innerHTML = this.magicforecastDaily[f].day + " " + this.magicforecastDaily[f].hour;
                    row_time.appendChild(dayCell);
                    //rating
                    iconCell = document.createElement("td");
                    iconCell.className = "align-center bright weather-icon";
                    icon = document.createElement("span");
                    if (this.magicforecastDaily[f].rating.length == 0) {
                        icon.className = "wi wi-na";
                    } else {
                        icon.innerHTML = this.magicforecastDaily[f].rating.join(" ");
                    }
                    iconCell.appendChild(icon);
                    row_icon.appendChild(iconCell);
                    //swell height and period
                    maxTempCell = document.createElement("td");
                    maxTempCell.innerHTML = this.magicforecastDaily[f].swellHeight + "' @ " + this.magicforecastDaily[f].swellPeriod + "s"
                    maxTempCell.className = "hour";
                    row_temp.appendChild(maxTempCell);
                    //swell direction
                    swellInfo = document.createElement("td");
                    swellInfoCell = document.createElement("i");
                    swellInfoCell.innerHTML = "Swell: &nbsp;";
                    swellInfoCell.className = "hour";
                    swellInfo.appendChild(swellInfoCell);
                    swellInfoCell = document.createElement("i");
                    swellInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].swellDirection;
                    swellInfo.appendChild(swellInfoCell);
                    row_pop.appendChild(swellInfo);
                    //wind direction
                    windInfo = document.createElement("td");
                    windInfoCell = document.createElement("i");
                    windInfoCell.innerHTML = "Wind: &nbsp;";
                    windInfoCell.className = "hour";
                    windInfo.appendChild(windInfoCell);

                    windInfoCell = document.createElement("i");
                    windInfoCell.className = "wi wi-wind " + this.magicforecastDaily[f].windDirection;
                    windInfo.appendChild(windInfoCell);

                    windInfoCell = document.createElement("i");
                    windInfoCell.innerHTML = "<br>&nbsp;&nbsp;" + this.magicforecastDaily[f].windSpeed + "/" + this.magicforecastDaily[f].windGusts + "mph";
                    windInfoCell.className = "smaller";
                    windInfo.appendChild(windInfoCell);
                    row_wind.appendChild(windInfo);

                    var nl = Number(f) + 1;
                    if ((nl % 4) === 0) {
                        table.appendChild(row_time);
                        table.appendChild(row_icon);
                        table.appendChild(row_temp);
                        table.appendChild(row_pop);
                        table.appendChild(row_wind);
                        row_time = document.createElement("tr");
                        row_icon = document.createElement("tr");
                        row_temp = document.createElement("tr");
                        row_pop = document.createElement("tr");
                        row_wind = document.createElement("tr");
                    }

                } //end magicForecastDaily loop

                table.appendChild(row_time);
                table.appendChild(row_icon);
                table.appendChild(row_temp);
                table.appendChild(row_pop);
                table.appendChild(row_wind);
                fctable.appendChild(table);
                wrapper.appendChild(fctable);
            } // end this.config.daily if statement

        } //end Else statement 
        return wrapper; //return the wrapper to browser for rendering
    }, //end getDom function


    /* processWeather(data)
     * 
     * Processes Wunderground data for current conditions data only. 
     * this feeds the first row of icons
     */

    processWeather: function(data) {
        if (this.config.debug === 1) { Log.info(data); } //print Object to browser console
        if (this.config.debug === 1) { Log.info(moment().format() + " Processing Data: Wunderground (6)") };
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

            var sunriseSunsetDateObject = (sunrise < now && sunset > now) ? sunset : sunrise;

            if (this.config.enableCompliments === 1) {
                var complimentIconSuffix = (sunrise < now && sunset > now) ? "d" : "n";
                var complimentIcon = '{"data":{"weather":[{"icon":"' + this.config.iconTableCompliments[data.current_observation.icon] + complimentIconSuffix + '"}]}}';
                var complimentIconJson = JSON.parse(complimentIcon);
                this.sendNotification("CURRENTWEATHER_DATA", complimentIconJson);
            }

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
            if (this.config.debug === 1) { Log.info(moment().format() + ' Rendering Wunderground data to UI (7)'); }
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
        if (this.config.debug === 1) { Log.info(moment().format() + " Processing Data: NOAA_TIDE (6)") };
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
        if (this.config.debug === 1) { Log.info(moment().format() + ' Rendering NOAA Tide data to UI (7)'); }
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
        if (this.config.debug === 1) { Log.info(moment().format() + " Processing Data: NOAA Water Temp (6)") };
        if (this.config.debug === 1) { Log.info(data); } //print Object to browser console
        var stationID = data.metadata.id; //only used in debug mode currently
        var stationName = data.metadata.name; //only used in debug mode currently
        //var coords_lat = data.metadata.lat; //not used
        //var coords_lon = data.metadata.lon; //not used

        //Effeciency assumption: most current reading will always be last element
        //NOAA provides 13 measurements. Object counts start at 0...need to subtract 1 to get to item 12, the most recent measurement
        var CurrentHour = now.getHours();
        var WaterTempLength = data.data.length - 1;
        var WaterTempTime = new Date(data.data[WaterTempLength].t);
        var WaterTempHour = WaterTempTime.getHours();
        WaterTemp = data.data[WaterTempLength].v; // pull current water temp from data.
        if (this.config.debug === 1) {
            Log.info("***CURRENT WATER*** temperature at " + stationName + " is: " + WaterTemp + " at " + WaterTempTime + ".");
        }

        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
        if (this.config.debug === 1) { Log.info(moment().format() + ' Rendering NOAA Water Temp data to UI (7)'); }
        if (this.config.debug === 1) { Log.info('-------------------------------------------------------------------'); }
    }, // end processNOAA_WATERTEMP function


    /* processMAGICSEAWEED (data)
     *
     * Uses the received Magicseaweed Forecast to display wave and swell data
     * 
     */

    processMAGICSEAWEED: function(data) {
        if (this.config.debug === 1) { Log.info(moment().format() + " Processing Data: Magicseaweed (6)") };
        //if (this.config.debug === 1) {Log.info(data);}	//print Object to browser console 

        for (i = 0, count = data.length; i < count; i++) {
            //set IGNORE flag for forecast times we don't care about (1am, 7pm, 10pm)
            //Focusing on surfable hours...dawn patrol through sunset. 
            //TODO: Make config item to allow user customization...?
            var msHours = moment.unix(data[i].localTimestamp).format('HH');
            if (msHours == 01 ||
                msHours == 19 ||
                msHours == 22) {
                data[i].localTimestamp = "IGNORE";
            }
            //set IGNORE flag for forecast data in the past...
            //TODO: refine to include most recent forecast in the past need to mimic the tide data... 
            if (moment.unix(data[i].localTimestamp) < now) {
                data[i].localTimestamp = "IGNORE";
            }
            // Set flag for working on current day. Influences hourly forecast and Daily forecast object creationbelow
            if (moment.unix(data[i].localTimestamp).format('ddd') == moment(now).format('ddd')) {
                data[i].today = "true";
            } else {
                data[i].today = "false";
            }
        } //end for loop

        for (i = 0, count = data.length; i < count; i++) {
            //Identify best Daily forecast for daily forecast table
            //TODO: This is super hacky but just for testing...
            if (data[i].localTimestamp != "IGNORE" && data[i].today == "false") {
                if (moment.unix(data[i].localTimestamp).format('HH') == 10) {
                    data[i].dailyBest = "true";
                }

            } //end if
        } //end for	

        if (this.config.debug === 1) { Log.info(data) }; //show data after manipulations above

        this.magicforecast = []; // rebuild MagicSeaweed hourly data to shape our needs
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
                    this.rating.push('<img src="http://cdnimages.magicseaweed.com/star_filled.png" />');
                }

                // Loop the faded rating on a single forecast object.
                for (var j = 0; j < this.fadedRating; j++) {
                    this.rating.push('<img src="http://cdnimages.magicseaweed.com/star_empty.png" />');
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
                this.swellHeight = data[i].swell.components.primary.height;
                this.swellPeriod = data[i].swell.components.primary.period;
                this.winddirection = this.deg2Cardinal(data[i].wind.direction);
                this.windgusts = data[i].wind.gusts;
                this.windspeed = data[i].wind.speed;
                this.windunit = data[i].wind.unit;
                this.dailyBest = data[i].dailyBest;
                //Build "hourly" forecast for today
                if (data[i].today == "true") {
                    this.magicforecast.push({
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
                        swellHeight: this.swellHeight,
                        swellPeriod: this.swellPeriod,
                        windDirection: this.winddirection,
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
                        swellHeight: this.swellHeight,
                        swellPeriod: this.swellPeriod,
                        windDirection: this.winddirection,
                        windGusts: this.windgusts,
                        windSpeed: this.windspeed,
                        windUnit: this.windunit,
                    });
                } //end magicforecastDaily
            } // end IGNORE if statement	
        } //end for loop

        if (this.config.debug === 1) { Log.info(this.magicforecast); } //print Object to browser console
        if (this.config.debug === 1) { Log.info(this.magicforecastDaily); } //print Object to browser console

        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
        if (this.config.debug === 1) { Log.info(moment().format() + ' Rendering Magicseaweed data to UI (7)'); }
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
                if (this.config.debug === 1) { Log.info(moment().format() + ' SOCKET(RECEIVED FROM HELPER) (5): ' + notification + ' Payload data'); }
                self.processWeather(JSON.parse(payload));
            }
            if (notification === 'NOAA_TIDE_DATA') {
                if (this.config.debug === 1) { Log.info(moment().format() + ' SOCKET(RECEIVED FROM HELPER) (5): ' + notification + ' Payload data'); }
                self.processNOAA_TIDE_DATA(JSON.parse(payload));
            }
            if (notification === 'NOAA_WATERTEMP') {
                if (this.config.debug === 1) { Log.info(moment().format() + ' SOCKET(RECEIVED FROM HELPER) (5): ' + notification + ' Payload data'); }
                self.processNOAA_WATERTEMP(JSON.parse(payload));
            }
            if (notification === 'MAGICSEAWEED') {
                if (this.config.debug === 1) { Log.info(moment().format() + ' SOCKET(RECEIVED FROM HELPER) (5): ' + notification + ' Payload data'); }
                self.processMAGICSEAWEED(JSON.parse(payload));
            }
            if (notification === 'HELPER_MESSAGE') {
                if (this.config.debug === 1) { Log.info(payload); }
            }

        } // end socketNotificationReceived function

}); // End Module