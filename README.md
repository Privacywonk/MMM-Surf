# MMM-Surf

MMM-Surf is a Magic Mirror module that will display weather, tides, water temp, and Magicseaweed forecast data for your favorite spot. It is currently North America centric, pulling tide and water temperature from the National Oceanic and Atmospheric Administration (NOAA). 

The surf forecast data is minimized from the normal Magicseaweed interface to focus on "at-a-glance" information only: The Magicseaweed star rating system, height of swell at periodicity, swell direction, wind direction, and speed.

![image](https://user-images.githubusercontent.com/9799911/33715450-84683e04-db20-11e7-8698-4d69221b8314.png)

### Prerequisites

To get MMM-Surf up and running, you will need to do some scouting.


* [Wunderground API key](https://www.wunderground.com/weather/api/d/pricing.html)

* [Magicseaweed API key](https://magicseaweed.com/developer/api)

**Note: Magicseaweed's API is in beta mode and does not have an automated sign up process; however, the people are awesome and very responsive via email.

### Installing

Clone the repo into the MagicMirror modules directory

```
cd ./MagicMirror/modules/
```
```
git clone https://github.com/Privacywonk/MMM-Surf
```

## Config 
You will need to source a few bits of information to configure the MMM-Surf module:
1. Magicseaweed spot ID for the MagicSeaweedSpotID config item. For example, 391 from https://magicseaweed.com/Ocean-City-NJ-Surf-Report/391/

2. [NOAA Tide and Current](https://tidesandcurrents.noaa.gov) for the station_id config item
Find the closest measuring station to your spot. Click the map pin to open the details of the station. Copy the station_id number that appears before the location. 9415020 for the point Reyes, CA example below.

![image](https://user-images.githubusercontent.com/9799911/33579008-504e3b70-d916-11e7-9911-679720264106.png)

3. Wunderground Location for WuPWS config item. Multiple acceptable formats can be accepted:
* CA/San_Francisco - US state/city	
* 60290 - US zipcode
* Australia/Sydney - country/city
* KJFK - airport code
* pws:KCASANFR70 - Personal Weather Station id

I prefer the pws:STATIONID format as it can provide hyper localized conditions for a particular spot; however, be warned that Personal Weather Stations vary in quality. 

To find a PWS ID:
* [Search Wunderground](https://www.wunderground.com/) for a major city name
* Next to the City name there is a "CHANGE" menu item
* Zoom around on the map to find the closest weather station and note the ID in parenthesis
* If we wanted to use Kelly's Cove @ Ocean Beach, our config item would be pws:KCASANFR99 for the example below


![image](https://user-images.githubusercontent.com/9799911/33579383-a7cc39d2-d917-11e7-8133-4de5b43f9833.png)


```
module: "MMM-Surf",
debug: "0",
position: "top_left",
config: {
        MagicSeaweedSpotID: "",         //REQUIRED: numeric spot ID from magicseaweed, e.g. "390"
        MagicSeaweedSpotName: "",       //REQUIRED: shorthand name for your spot...(e.g. Secret Spot, Lowers, Ocean Beach, OCNJ)
        spotSwellHold: [],      	//OPTIONAL: Best swell direction that your spot handles. Accepts multiple cardinal directions, e.g. ["N"] or ["S","SSW","ESE"]
        spotWind: [],          		//OPTIONAL: Best wind direction for spot. Accepts multiple cardinal directions, e.g. ["N"] or["S","SSW","ESE"]
        MagicAPI: "",                   //REQUIRED: magicseaweed API Key
        station_id: "",                 //REQUIRED: NOAA Tide and Currents monitoring, e.g. 9415020 for Point Reyes
        Wuapikey: "",                   //REQUIRED: Wunderground API
        WuPWS: "",                      //REQUIRED: Wunderground Location, e.g. "pws:KCASANFR99" or "CA/San_Francisco" or "60290" or "PHL"
        noaatz: "lst_ldt",              //NOAA time zone requests. Local Standard Time / Daylight time.
        hourly: "1",
        fctext: "1",
        fcdaycount: "4",
        fcdaystart: "0",
        hourlyinterval: "3",
        hourlycount: "2",
        alerttime: "10000",
        alerttruncatestring: "english:",
        roundTmpDecs: "1",
        UseCardinals: "0",
        layout: "horizontal"
        }
},
```


## Versioning

For the versions available, see the [tags on this repository](https://github.com/Privacywonk/MMM-Surf/tags). 

## Authors

* **me** - *Initial work* - [PrivacyWonk](https://github.com/PrivacyWonk)

## Contributors
* **[CaptainJimmy](https://github.com/CaptainJimmy)** - Code optimization and beautification.  

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Magicseaweed Tech Team 
* MagicMirror community for inspiring me to make a thing for the first time in many years
* **Xinh Studio** - *High and Low Tid Icons by Xinh Studio from the Noun Project* - [Xinh Studio](https://thenounproject.com/xinhstudio/)
* **Erik Flowers** - *Weather Icons Project* - [Weather Icons](https://erikflowers.github.io/weather-icons/)
* **RedNax 67** - *Magic Mirror Wunderground Module that served as layout inspiration and provided some code direction* - [RedNax67's MMM-Wunderground module](https://github.com/RedNax67/MMM-WunderGround)

