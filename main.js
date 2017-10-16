// State
var map;
var infowindow;
var type;      
var stations_by_time;
var minutes_past_midnight = 600;
var selected_station = null;
var date;

function isWeekday(date) {
    let day = date.getDay();
    return (day > 0 && day < 6); 
}

function getPriorWeekdays(currentDate, number) {
    var rtn = [];
    var date = new Date(currentDate);
    while (rtn.length < number) {
	date.setDate(date.getDate - 1);
	if (isWeekday(date)) {
	    rtn.push(new Date(date));
	}
    }
    return rtn;
}

function dateToString(date, seperator) {
    return date.getFullYear() + seperator +
	   String(date.getMonth() + 1) + seperator + // Date's month is 0 indexed
	   date.getDate();
}

function getValuesFromQueryParameters() {
    let queryParameters = new URLSearchParams(window.location.search);

    if (queryParameters.has('date')) {
	date = new Date(queryParameters.get('date'));
    } else {
	// Default to yesterday
	date = new Date();
	date.setDate(date.getDate() - 1);
    }

    if (queryParameters.has('type')) {
	type = queryParameters.get('type');
    } else {
	type = 'bike';
    }
    if (type != 'bike' && type != 'dock') {
	console.log("Must set url param type to either bike or dock");
	type = 'bike';
    }
}

function setupPickers() {
    // Type picker to switch between Bikes and Docks
    $( "#typepicker" ).val(type);
    $( "#typepicker" ).on("change", (event, ui) => {
	type = $( "#typepicker" ).val();
	refreshStations();
    });

    // Jquery date picker. Selecting a new day reloads the page
    $( "#datepicker" ).datepicker({dateFormat: 'mm/dd/yy'}).datepicker("setDate", date);
    $( "#datepicker").on("change", (event) => {
	let selectedDate = $( "#datepicker" ).datepicker("getDate");
	var newUrl = "http://ianv.me/citibikeDayMap/index.html";
	newUrl += "?date=" + dateToString(selectedDate, "-") + "&type=" + type;
	window.location.href = newUrl;
    });

    // Select a time in the day. Time string updates while the user is sliding, we don't reload
    // the map until the release the slider.
    $( "#timeslider" ).slider({
	"min":0,
	"max":1410, // 11:30 PM
	"step":30,
	"value":minutes_past_midnight
    });
    $( "#timeslider" ).on("slidechange", (_, ui) => {
	if (ui.value == minutes_past_midnight) {
	    return;
	}
	minutes_past_midnight = ui.value;
	refreshStations();
    });
    $( "#timeslider" ).on("slide", (_, ui) => {
	refreshTimestamp(ui.value);
    });

    $( "#timeslider .ui-slider-handle" ).append("<span id='slideTimestamp'></span>")
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: {lat: 40.7128, lng: -74.0059},
        mapTypeId: 'roadmap',
	mapTypeControl: false,
	fullscreenControl: false,
	streetViewControl: false
    });
    infowindow = new google.maps.InfoWindow({
	content: "<div id='graphcontainer'>" +
	             "<img src='loading.gif' id='graphloading'></img>" +
                     "<div id='graph'></div>" +
	         "</div>"
    });

    $( "#mapLoadingOverlay" ).show();
    
    // Get our json data via jsonp
    var json_url_string = '../citibike.json?callback=parseData&date='; 
    json_url_string += dateToString(date, '-');      
    var script = document.createElement('script');
    script.src = json_url_string;
    document.getElementsByTagName('head')[0].appendChild(script);
}

// Callback from jsonp ajax request for station data
function parseData(data) {
    stations_by_time = data;
    constructMarkers();

    $( "#mapLoadingOverlay" ).hide();
    refreshStations();
}

// new_time is minutes since midnight
function refreshTimestamp(new_time) {
    var hours = Math.floor(new_time / 60);
    let am_pm = hours > 11 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours == 0 ? 12 : hours;
    let minutes = new_time % 60;
    var minutes_string = String(minutes);
    if (minutes_string.length == 1) {
        minutes_string = "0" + minutes_string;
    }
    $( "#slideTimestamp" ).empty();
    $( "#slideTimestamp" ).append(String(hours) + ":" + minutes_string + " " + am_pm); 
}


// We construct a marker of each color for each station, but don't set any of them as visible
var circles_by_station_id = {};
function constructMarkers() {
    let stations = stations_by_time[String(minutes_past_midnight)];
    for(var station_id in stations) {
	let lat = stations[station_id].lat;
	let lon = stations[station_id].lon;

	if (isNaN(lat) || isNaN(lon)) {
            continue;
        }

	circles_by_station_id[station_id] = {
	    'green': constructMapMarker('#4cd964', lat, lon, station_id),
	    'yellow': constructMapMarker('#FFCC00', lat, lon, station_id),
	    'red': constructMapMarker('#FF2D55', lat, lon, station_id)
	};
    }
}

// To set the markers for a specific time we iterate through and set only the appropriate color
// visible, hiding all other markers for that station
function refreshStations() {
    infowindow.close();
    var stations = stations_by_time[String(minutes_past_midnight)];
    
    for (var station_id in circles_by_station_id) {
	let desired_color = getMarkerColor(stations[station_id]);
	let circles = circles_by_station_id[station_id];

	for(var marker_color in circles) {
	    if (marker_color === desired_color) {
		circles[marker_color].setMap(map);
	    } else {
		circles[marker_color].setMap(null);
	    }
	}
    }
}

function getMarkerColor(station_data) {
    var available = null;
    if (type === 'bike') {
	if (!station_data.is_renting) {
	    return null;
	}
	available = station_data.num_bikes_available;
    } else if (type === 'dock') {
        if (!station_data.is_returning) {
	    return null;
	}
        available = station_data.num_docks_available;
    }

    var color = 'green';
    if (available === 0) {
        color = 'red';
    } else if (available < 3) {
	color = 'yellow';
    }
    return color;
}

function constructMapMarker(color, lat, lon, station_id) {
    var circle = new google.maps.Circle({
	strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: 5,
        fillColor: color,
        fillOpacity: 1,
        center: {lat: lat, lng: lon},
        radius: 20.0
    });

    // On click we show a graph of bikes at that station for the hour before and after the current time
    circle.addListener('click', function(station_id) {
	return function(event) {
	    selected_station = station_id;
	    
	    infowindow.setPosition(event.latLng);
	    infowindow.open(map);

	    // Show loading indicator
	    $( "#graph" ).empty();
	    $( "#graph" ).hide();
	    $( "#graphloading" ).show();

	    var ajax_url = "../citibike.json";
	    ajax_url += "?date=" + dateToString(date, '-');
	    ajax_url += "&start_time=" + String(minutes_past_midnight - 60);
	    ajax_url += "&end_time=" + String(minutes_past_midnight + 60);
	    ajax_url += "&step=6";
	    ajax_url += "&station=" + station_id;

	    $.ajax({ url: ajax_url, success: function(station_id) {
		return function(result) {
		    // If the user has selected a new marker throw this result away
		    if (station_id != selected_station) {
			return;
		    }

		    var key_for_type = (type == 'dock') ? 'num_docks_available' : 'num_bikes_available';
		    var data_array = [];
		    for (let time in result) {
			data_array.push({"time": convertMinutesAfterMidnightToDate(time),
					 "available": result[time][key_for_type]})
		    }
		    data_array.sort((x, y) => { return (x.time > y.time) ? 1 : -1; }); // accending time
		    displayLineGraphFromJson(data_array);
		};
	    }(station_id)});
	};
    }(station_id)); // currying station_id

    return circle;
}

function convertMinutesAfterMidnightToDate(minutes) {
    var dateTime = new Date(date);
    dateTime.setHours(0);
    dateTime.setMinutes(minutes);
    return dateTime;
}

function displayLineGraphFromJson(data) {   
    let width = 250;
    let height = 100;
    let padding = 20;
    
    // Set the ranges
    var startTime = convertMinutesAfterMidnightToDate(minutes_past_midnight - 60);
    var endTime = convertMinutesAfterMidnightToDate(minutes_past_midnight + 60);
    var x = d3.scaleTime().range([0, width]).domain([startTime, endTime]);
    var y = d3.scaleLinear().range([height, 0])
	.domain([0, Math.max(d3.max(data, (d) => { return d.available; }), 5)]);
    
    // Define the axes
    var formatyAxis = d3.format('.0f');
    var xAxis = d3.axisBottom(x).ticks(5);
    var yAxis = d3.axisLeft(y).tickFormat(formatyAxis).ticks(5);

    // Define the line
    var valueline = d3.line()
        .x(function(d) { return x(d.time); })
	.y(function(d) { return y(d.available); });

    // Clear any existing graph
    $( "#graph" ).empty();

    
    // Adds the svg canvas
    $( "#graphloading" ).hide();
    $( "#graph" ).show();
    var svg = d3.select("#graph")
        .append("svg")
          .attr("width", width + 2 * padding)
          .attr("height", height + 2 * padding)
	.append("g")
          .attr("transform",
	        "translate(" + padding + "," + padding + ")");;

    // Add the valueline path.
    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("stroke", "blue")
        .attr("fill", "none")
        .attr("d", valueline(data));

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
}

// Initialize
getValuesFromQueryParameters();
setupPickers();
refreshTimestamp(minutes_past_midnight);
