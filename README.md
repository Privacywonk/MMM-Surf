# MMM-Surf

MMM-Surf is a [Magic Mirror](https://github.com/MichMich/MagicMirror) module that will display weather (DarkySky), tides, water temp, and Magicseaweed forecast data for your favorite spot. It is currently North America centric, pulling tide and water temperature from the National Oceanic and Atmospheric Administration (NOAA). I am actively searching international data sources for tide and water temps, please open an issue if you know of sources that provide publicly accessible APIs.

The surf forecast data is minimized from the normal Magicseaweed interface to focus on "at-a-glance" information only: The [Magicseaweed star rating system](https://magicseaweed.com/help/forecast-table/star-rating), height of swell at periodicity, swell direction, wind direction, and speed. These bits of information are color coded based on certain configurable items (see below): Green means the condition is right for the spot, orange means acceptable, red is slop. If I see all green, I go.  

![image](https://user-images.githubusercontent.com/9799911/39096515-0dd16c7e-461f-11e8-8b14-8f64dbe41bc5.png)

### Prerequisites

To get MMM-Surf up and running, you will need to do some scouting.


* [DarkySky API key](https://darksky.net/dev)

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

3. DarkySky Latitude and Longtitude config items. 
[Search DarkySky](https://darksky.net/) for the area you want a current weather forecast
* Once found, look at the URL: `https://darksky.net/forecast/37.7661,-122.5107/us12/en` (SF example)
* After /forecast/ you can find the values you need for "Latitude, Longtitude"
* Copy each value (exclude the comma) into appropriate config elements: DarkySkyLat and DarkySkyLong


```
module: "MMM-Surf",
debug: "0",
position: "top_left",
config: {
        MagicAPI: "",                   //REQUIRED: magicseaweed API Key
        MagicSeaweedSpotID: "",         //REQUIRED: numeric spot ID from magicseaweed, e.g. "390"
        MagicSeaweedSpotName: "",       //REQUIRED: shorthand name for your spot...(e.g. Secret Spot, Lowers, Ocean Beach, OCNJ)
	spotCoast: "", 			//REQUIRED: N,E,S.W orientation of the coast line
        spotSwellHold: [],      	//OPTIONAL: Best swell direction that your spot handles. Accepts multiple cardinal directions, e.g. ["N"] or ["S","SSW","ESE"]
        spotWind: [],          		//OPTIONAL: Best wind direction for spot. Accepts multiple cardinal directions, e.g. ["N"] or["S","SSW","ESE"]
	spotSwellMin: "",       	//OPTIONAL: Define minimum swell size that works at the spot, e.g. "3"
        spotSwellMax: "",       	//OPTIONAL: Define maximum swell size that works at the spot, e.g. "10"
	greenWindMax: "10", 		//REQUIRED: Upper end of acceptable winds (in MPH)
	orangeWindMax: "20", 		//REQUIRED: Upper end of "I can deal with this" winds (in MPH)
	redWindMax: "21", 		//REQUIRED: Low end of "Oh hell no" winds (in MPH)
        station_id: "",                 //REQUIRED: NOAA Tide and Currents monitoring, e.g. 9415020 for Point Reyes
        noaatz: "lst_ldt",              //NOAA time zone requests. Local Standard Time / Daylight time.
	DarkSkyAPI: "",			//REQUIRED: DarkSky API Key
	DarkySkyLat: "",		//REQUIRED: DarkSky Latitude
	DarkySkyLong: "",		/?REQUIRED: DarkSky Longtitude
        roundTmpDecs: "1",
        UseCardinals: "0",
        layout: "horizontal",
	debug: 0			//OPTIONAL: If having problems, turn this to 1 and look @ dev console in browser for verbose messages
        }
},
```


## Versioning

For the versions available, see the [tags on this repository](https://github.com/Privacywonk/MMM-Surf/tags). 

## Authors

* **me** - *Initial work* - [PrivacyWonk](https://github.com/PrivacyWonk)

## Contributors
* **[CaptainJimmy](https://github.com/CaptainJimmy)** - Code optimization and beautification.  
* **[sh3rp](https://github.com/sh3rp)** - Education and pointers around the process for identifying the best forecast for each day
## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) license  - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Magicseaweed Tech Team 
* MagicMirror community for inspiring me to make a thing for the first time in many years
* **Xinh Studio** - *High and Low Tid Icons by Xinh Studio from the Noun Project* - [Xinh Studio](https://thenounproject.com/xinhstudio/)
* **Erik Flowers** - *Weather Icons Project* - [Weather Icons](https://erikflowers.github.io/weather-icons/)
* **RedNax 67** - *Magic Mirror Wunderground Module that served as layout inspiration and provided some code direction* - [RedNax67's MMM-Wunderground module](https://github.com/RedNax67/MMM-WunderGround)

