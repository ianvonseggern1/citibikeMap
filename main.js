
// Helper Functions

function isWeekday(date) {
  let day = date.getDay();
  return (day > 0 && day < 6);
}

function getPriorWeekdays(currentDate, number) {
  var rtn = [];
  var date = new Date(currentDate);
  while (rtn.length < number) {
    date.setDate(date.getDate() - 1);
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

function minutesToTimeString(minutesPastMidnight) {
  var hours = Math.floor(minutesPastMidnight / 60);
  let am_pm = hours > 11 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours == 0 ? 12 : hours;
  let minutes = minutesPastMidnight % 60;
  var minutes_string = String(minutes);
  if (minutes_string.length == 1) {
    minutes_string = "0" + minutes_string;
  }
  return String(hours) + ":" + minutes_string + " " + am_pm;
}


class CitibikeHistoricalMapController {
  constructor() {
    this.minutes_past_midnight = 600;
    this.selected_station = null;
    this.circles_by_station_id = {};

    this.stationGraphController = new stationGraphController(this);

    this.getValuesFromQueryParameters();
    this.setupPickers();
    this.setupTooltips();
    this.refreshTimestamp(this.minutes_past_midnight);
  }

  getValuesFromQueryParameters() {
    let queryParameters = new URLSearchParams(window.location.search);

    if (queryParameters.has('date')) {
      let dateParts = queryParameters.get('date').split('-');
      this.date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    } else {
      // Default to yesterday
      this.date = new Date();
      this.date.setDate(this.date.getDate() - 1);
    }

    if (queryParameters.has('type')) {
      this.type = queryParameters.get('type');
    } else {
      this.type = 'bike';
    }
    if (this.type != 'bike' && this.type != 'dock') {
      console.log("Must set url param type to either bike or dock");
      this.type = 'bike';
    }
  }

  setupTooltips() {
    let countElements = ["#availableCount", "#lowCount", "#emptyCount"];
    let elementDescriptions = ["3+", "1-2", "no"];

    for(var elementIndex in countElements) {
      let element = countElements[elementIndex];
      let elementDescription = elementDescriptions[elementIndex];
      $( element ).on("mouseenter", (event, ui) => {

        let total = countElements.reduce((accumulation, reduceElement) => {
          return accumulation + parseInt($(reduceElement).text());
        }, 0)
        let elementCount = parseInt($(element).text());

        let tooltipString = elementCount + " of " + total;
        tooltipString += " (" + Math.floor(100 * elementCount / total);
        tooltipString += "%) of stations have ";
        tooltipString += elementDescription;
        tooltipString += " " + this.type + "s available at ";
        tooltipString += minutesToTimeString(this.minutes_past_midnight);

        var locationOfElement = $( element ).offset();
        locationOfElement.top -= 26;
        locationOfElement.left += 32;
        $( "#countTooltip" ).css(locationOfElement);

        $( "#countTooltip" ).empty();
        $( "#countTooltip" ).text(tooltipString);
        $( "#countTooltip" ).show();
      });

      $( element ).on("mouseleave", (event, ui) => {
        $( "#countTooltip" ).hide();
      });
    }
  }

  setupPickers() {
    // Type picker to switch between Bikes and Docks
    $( "#typepicker" ).val(this.type);
    $( "#typepicker" ).on("change", (event, ui) => {
      this.type = $( "#typepicker" ).val();
      this.refreshStations();

      this.heatmapData = undefined;
      this.drawHeatmap();
    });

    // Jquery date picker. Selecting a new day reloads the page
    $( "#datepicker" ).datepicker({
      dateFormat: 'mm/dd/yy',
      minDate: new Date(2017, 8, 23),
      maxDate: -1
    }).datepicker("setDate", this.date);
    $( "#datepicker").on("change", (event) => {
      let selectedDate = $( "#datepicker" ).datepicker("getDate");
      var newUrl = window.location.pathname;
      newUrl += "?date=" + dateToString(selectedDate, "-") + "&type=" + this.type;
      window.location.href = newUrl;
    });

    let sliderMin = 0;
    let sliderMax = 1410; // 11:30 PM
    let sliderStep = 30;
    // Select a time in the day. Time string updates while the user is sliding, we don't reload
    // the map until the release the slider.
    $( "#timeslider" ).slider({
      "min": sliderMin,
      "max": sliderMax,
      "step": sliderStep,
      "value":this.minutes_past_midnight
    });
    $( "#timeslider" ).on("slidechange", (_, ui) => {
      if (ui.value == this.minutes_past_midnight) {
        return;
      }
      this.timesliderChange(ui.value);
    });
    $( "#timeslider" ).on("slide", (_, ui) => {
      this.timesliderSlide(ui.value);
    });
    $( "#timesliderLeftArrow" ).on("click", () => {
      let currentTime = $( "#timeslider" ).slider("option", "value");
      if (currentTime === sliderMin) {
        return;
      }

      let newTime = currentTime - sliderStep;
      this.timesliderSlide(newTime);
      $( "#timeslider" ).slider("value", newTime);
    });
    $( "#timesliderRightArrow" ).on("click", () => {
      let currentTime = $( "#timeslider" ).slider("option", "value");
      if (currentTime === sliderMax) {
        return;
      }

      let newTime = currentTime + sliderStep;
      this.timesliderSlide(newTime);
      $( "#timeslider" ).slider("value", newTime);
    });
    $(window).resize(() => {
      this.drawHeatmap();
    });

    $( "#timeslider .ui-slider-handle" ).append("<span id='slideTimestamp'></span>")

    $( "#infoicon" ).on("click", () => { $( "#explanationModal" ).toggle(); });
  }

  // While the slider is being moved we update the heatmap dots, counts, and
  // timestamp
  timesliderSlide(newTime) {
    this.refreshTimestamp(newTime);
    this.placeHeatmapDots(newTime);
    this.updateCounts(newTime);
  }

  // After the slider has been moved we update the map dots
  timesliderChange(newTime) {
    this.minutes_past_midnight = newTime;
    this.refreshStations();
  }

  initMap() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: {lat: 40.7128, lng: -74.0059},
      mapTypeId: 'roadmap',
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      keyboardShortcuts: false
    });

    this.stationGraphController.initalizeInfowindow(this.map);

    $( "#mapLoadingOverlay" ).show();

    // Get our json data via jsonp
    var json_url_string = 'https://ianv.me/citibike.json?callback=parseData&date=';
    json_url_string += dateToString(this.date, '-');
    var script = document.createElement('script');
    script.src = json_url_string;
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  // Callback from jsonp ajax request for station data
  parseData(data) {
    this.stations_by_time = data.data;
    this.station_locations = data.locations;

    this.constructMarkers();
    this.drawHeatmap();

    $( "#mapLoadingOverlay" ).hide();
    this.refreshStations();
  }

  // new_time is minutes since midnight
  refreshTimestamp(new_time) {
    $( "#slideTimestamp" ).empty();
    $( "#slideTimestamp" ).append(minutesToTimeString(new_time));
  }


  // We construct a marker of each color for each station, but don't set any of them as visible
  constructMarkers() {
    for(var station_id in this.station_locations) {
      let lat = this.station_locations[station_id].lat;
      let lon = this.station_locations[station_id].lon;

      if (isNaN(lat) || isNaN(lon)) {
        continue;
      }

      this.circles_by_station_id[station_id] = {
        'green': this.constructMapMarker('#4cd964', lat, lon, station_id),
        'yellow': this.constructMapMarker('#FFCC00', lat, lon, station_id),
        'red': this.constructMapMarker('#FF2D55', lat, lon, station_id)
      };
    }
  }

  // To set the markers for a specific time we iterate through and set only the appropriate color
  // visible, hiding all other markers for that station
  refreshStations() {
    this.stationGraphController.closeInfowindow();
    let stations = this.stations_by_time[String(this.minutes_past_midnight)];

    for (var station_id in this.circles_by_station_id) {
      var desired_color = null;
      if (stations !== undefined && station_id in stations) {
        desired_color = this.getMarkerColor(stations[station_id]);
      }

      let circles = this.circles_by_station_id[station_id];
      for(var marker_color in circles) {
        if (marker_color === desired_color) {
          circles[marker_color].setMap(this.map);
        } else {
          circles[marker_color].setMap(null);
        }
      }
    }
  }

  getMarkerColor(station_data) {
    var available = null;
    if (this.type === 'bike') {
      if (!station_data.is_renting) {
        return null;
      }
      available = station_data.bikes;
    } else if (this.type === 'dock') {
      if (!station_data.is_returning) {
        return null;
      }
      available = station_data.docks;
    }

    var color = 'green';
    if (available === 0) {
      color = 'red';
    } else if (available < 3) {
      color = 'yellow';
    }
    return color;
  }

  constructMapMarker(color, lat, lon, stationId) {
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
    circle.addListener('click', function(that, stationId) {
      return function(event) {
        that.selected_station = stationId;
        that.stationGraphController.stationSelected(event, stationId);
      };
    }(this, stationId));

    return circle;
  }

  heatmapXTransform() {
    return d3.scaleTime().range([0, this.heatmapWidth()]).domain([0, 1410]);
  }

  // Need to call getHeatmapData first so we can figure out the max Y value
  heatmapYTransform() {
    return d3.scaleLinear().range([this.heatmapHeight(), 0])
    .domain([0, d3.max(this.heatmapData, (d) => { return d.low; })]);
  }

  heatmapWidth() {
    return $("#timeslider").width();
  }

  heatmapHeight() {
    return 80;
  }

  // Displays a heatmap of red and yellow counts over the time slider
  drawHeatmap () {
    $( "#heatmap svg" ).remove();

    let data = this.getHeatmapData();

    $( "#heatmapEmptyDot" ).show();
    $( "#heatmapLowDot" ).show();
    this.placeHeatmapDots(this.minutes_past_midnight);
    this.updateCounts(this.minutes_past_midnight);

    var svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", this.heatmapWidth())
    .attr("height", this.heatmapHeight())
    .append("g");

    let xTransform = this.heatmapXTransform();
    let yTransform = this.heatmapYTransform();

    let emptyLine = d3.line()
    .x(function(d) { return xTransform(d.time); })
    .y(function(d) { return yTransform(d.empty); });

    let emptyArea = d3.area()
    .x(function(d) { return xTransform(d.time); })
    .y0(this.heatmapHeight())
    .y1(function(d) { return yTransform(d.empty); });

    let lowLine = d3.line()
    .x(function(d) { return xTransform(d.time); })
    .y(function(d) { return yTransform(d.low); });

    let lowArea = d3.area()
    .x(function(d) { return xTransform(d.time); })
    .y0(function(d) { return yTransform(d.empty); })
    .y1(function(d) { return yTransform(d.low); });

    svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("stroke-width", 2)
    .attr("stroke", '#FF2D55')
    .attr("fill", "none")
    .attr("d", emptyLine(data));

    svg.append("path")
    .data([data])
    .attr("class", "area")
    .attr("fill", '#FF2D55')
    .attr("fill-opacity", 0.5)
    .attr("d", emptyArea);

    svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("stroke-width", 2)
    .attr("stroke", '#FFCC00')
    .attr("fill", "none")
    .attr("d", lowLine(data));

    svg.append("path")
    .data([data])
    .attr("class", "area")
    .attr("fill", '#FFCC00')
    .attr("fill-opacity", 0.5)
    .attr("d", lowArea);
  }

  placeHeatmapDots(time) {
    let counts = this.getTotalsAtTime(time);
    if (counts === undefined) {
      return;
    }

    let xPosition = this.heatmapXTransform()(time);
    let yTransform = this.heatmapYTransform();
    let lowYPosition = yTransform(counts.low);
    let emptyYPosition = yTransform(counts.empty);

    $( "#heatmapLowDot" ).css({top: lowYPosition, left: xPosition});
    $( "#heatmapEmptyDot" ).css({top: emptyYPosition, left: xPosition});
  }

  updateCounts(time) {
    let counts = this.getTotalsAtTime(time);
    if (counts === undefined) {
      return;
    }

    $( "#totalCounts" ).show();

    $( "#emptyCount" ).text(counts.empty);
    $( "#lowCount" ).text(counts.low - counts.empty); // low includes empty
    $( "#availableCount" ).text(counts.good);
  }

  getTotalsAtTime(time) {
    var dataIndex = 0;
    let lowCount = null;
    let emptyCount = null;
    let goodCount = null;
    while (dataIndex < this.heatmapData.length) {
      if (this.heatmapData[dataIndex].time === String(time)) {
        lowCount = this.heatmapData[dataIndex].low;
        emptyCount = this.heatmapData[dataIndex].empty;
        goodCount = this.heatmapData[dataIndex].good;
        break;
      }
      dataIndex += 1;
    }

    if (lowCount === null || emptyCount === null || goodCount === null) {
      console.log("Couldn't find the time in the data");
      return;
    }

    return {
      "low": lowCount,
      "empty": emptyCount,
      "good": goodCount,
    };
  }

  // Uses stations_by_time to constuct a sorted array of objects containing
  // time, empty (0 bikes/docks), low (2 or fewer bikes/docks), good (3+ bikes)
  // Note empty stations are also counted under low since we stack those lines
  // graphs. To get purely stations with 1-2 bikes use (low - empty)
  getHeatmapData() {
    if (this.heatmapData !== undefined) {
      return this.heatmapData;
    }

    let key_for_type = (this.type == 'dock') ? 'docks' : 'bikes';
    let renting_key_for_type = (this.type == 'dock') ? 'is_returning' : 'is_renting';
    var data = [];

    for(let time in this.stations_by_time) {
      var empty = 0;
      var low = 0;
      var good = 0;
      for(let station in this.stations_by_time[time]) {
        let stationData = this.stations_by_time[time][station];

        // Don't count disabled stations
        if (!stationData[renting_key_for_type]) {
          continue;
        }

        let count = stationData[key_for_type];
        if (count === 0) {
          empty += 1;
        }
        if (count <= 2) {
          low += 1;
        }
        if (count > 2) {
          good += 1;
        }
      }

      data.push({
        "time": time,
        "empty": empty,
        "low": low,
        "good": good,
      });
    }

    this.heatmapData = data;
    return data;
  }
}

let GRAPH_WIDTH = 250;
let GRAPH_HEIGHT = 100;
let GRAPH_PADDING = 20;

// Controls whats shown when a specific station is clicked on the map
class stationGraphController {
  constructor(mapController) {
    this.mapController = mapController;
  }

  initalizeInfowindow() {
    this.infowindow = new google.maps.InfoWindow({
      content: "<div id='graphcontainer'>" +
      "<img src='loading.gif' id='graphloading'></img>" +
      "<div id='overlayPreviousDaysLink'></div>" +
      "<div id='graph'></div>" +
      "</div>"
    });
  }

  closeInfowindow() {
    this.infowindow.close();
  }

  stationSelected(event, stationId) {
    this.infowindow.setPosition(event.latLng);
    this.infowindow.open(this.mapController.map);
    this.showComparisonLinkIfNecessary();

    // Show loading indicator
    $( "#graph" ).empty();
    $( "#graph" ).hide();
    $( "#graphloading" ).show();

    this.performAjaxCallForGraphData(stationId, dateToString(this.mapController.date, '-'), (ajax_data) => {
      let d3_data = this.convertJsonToD3Format(ajax_data);
      this.constructGraphAndAxis(d3_data);
      this.plotLineOnGraph(d3_data, '#7a0177', '4');
    });
  }

  // This adds a button to show the last five weekdays on the infowindow detail graph
  // We only offer a comparison if it's a weekday
  // No matter what adds a link to more station details
  showComparisonLinkIfNecessary() {
    var moreDetailsLink = "https://ianv.me/citibikeDayMap/stationSpecific/index.html";
    moreDetailsLink += "?station=" + this.mapController.selected_station;
    moreDetailsLink += "&start_date=2017-10-1";
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    moreDetailsLink += "&end_date=" + dateToString(yesterday, '-');
    var linksHtml = "<a href='" + moreDetailsLink + "' target='_blank'>More Details</a>   ";
    if (isWeekday(this.mapController.date)) {
      linksHtml += "<a href='#' onclick='map.stationGraphController.overlayPreviousDaysOnGraph();'>Compare with last 5 weekdays</a>";
    }

    $( "#overlayPreviousDaysLink" ).empty();
    $( "#overlayPreviousDaysLink" ).append(linksHtml);
  }

  convertMinutesAfterMidnightToDate(minutes) {
    var dateTime = new Date(this.mapController.date);
    dateTime.setHours(0);
    dateTime.setMinutes(minutes);
    return dateTime;
  }

  performAjaxCallForGraphData(stationId, dateString, callback) {
    var ajax_url = "https://ianv.me/citibike.json";
    ajax_url += "?date=" + dateString;
    ajax_url += "&start_time=" + String(this.mapController.minutes_past_midnight - 60);
    ajax_url += "&end_time=" + String(this.mapController.minutes_past_midnight + 60);
    ajax_url += "&step=6";
    ajax_url += "&station=" + stationId;
    ajax_url += "&station_type=" + this.mapController.type;

    $.ajax({ url: ajax_url, success: function(mapController, stationId) {
      return function(result) {
        // If the user has selected a new marker throw this result away
        if (stationId != mapController.selected_station) {
          return;
        }

        callback(result);
      };
    }(this.mapController, stationId)});
  }

  // The citibike data is an object mapping times to station info. This function converts
  // that into a sorted array of objects with a 'time' and 'available' key that we can use
  // with d3 to plot this data.
  convertJsonToD3Format(json_data) {
    var d3_data = [];
    for (let time in json_data) {
      if (json_data[time].data_available === true && json_data[time].is_renting === true) {
        d3_data.push({
          "time": this.convertMinutesAfterMidnightToDate(time),
          "available": json_data[time].count
        });
      }
    }
    d3_data.sort((x, y) => { return (x.time > y.time) ? 1 : -1; }); // accending time
    return d3_data;
  }

  // Returns transform fuctions that can be used to
  // convert data to graphable locations. Used both for constructing appropriate
  // axis and for plotting lines

  getXTransformForD3() {
    var startTime = this.convertMinutesAfterMidnightToDate(this.mapController.minutes_past_midnight - 60);
    var endTime = this.convertMinutesAfterMidnightToDate(this.mapController.minutes_past_midnight + 60);
    return d3.scaleTime().range([0, GRAPH_WIDTH]).domain([startTime, endTime]);
  }

  getYTransformForD3(data) {
    return d3.scaleLinear().range([GRAPH_HEIGHT, 0])
    .domain([0, Math.max(d3.max(data, (d) => { return d.available; }), 5)]);
  }

  // Constructs the graph and axis for it
  constructGraphAndAxis(data) {
    var x = this.getXTransformForD3();
    var y = this.getYTransformForD3(data);

    // Define the axes
    var formatyAxis = d3.format('.0f');
    var xAxis = d3.axisBottom(x).ticks(5);
    var yAxis = d3.axisLeft(y).tickFormat(formatyAxis).ticks(5);

    // Clear any existing graph
    $( "#graph" ).empty();

    // Adds the svg canvas
    $( "#graphloading" ).hide();
    $( "#graph" ).show();
    var svg = d3.select("#graph")
    .append("svg")
    .attr("width", GRAPH_WIDTH + 2 * GRAPH_PADDING)
    .attr("height", GRAPH_HEIGHT + 2 * GRAPH_PADDING)
    .append("g")
    .attr("transform",
    "translate(" + GRAPH_PADDING + "," + GRAPH_PADDING + ")");

    // Add the X Axis
    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + GRAPH_HEIGHT + ")")
    .call(xAxis);

    // Add the Y Axis
    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);
  }

  // Plots a line on an existing graph
  plotLineOnGraph(data, color, width) {
    var x = this.getXTransformForD3();
    var y = this.getYTransformForD3(data);

    // Define the line
    var valueline = d3.line()
    .x(function(d) { return x(d.time); })
    .y(function(d) { return y(d.available); });


    // Add the valueline path.
    var svg = d3.select("#graph svg g");
    svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("stroke-width", width)
    .attr("stroke", color)
    .attr("fill", "none")
    .attr("d", valueline(data));
  }

  overlayPreviousDaysOnGraph() {
    let dates = getPriorWeekdays(this.mapController.date, 5);
    let date_string = dates.map((day) => {return dateToString(day, '-'); }).join(',');
    let colors = ['#ae017e', '#dd3497', '#f768a1', '#fa9fb5', '#fcc5c0'];
    this.performAjaxCallForGraphData(this.mapController.selected_station, date_string, (all_data) => {
      let date_short_strings = dates.map((date) => {
        return " " + (date.getMonth() + 1) + "/" + date.getDate() + " ";
      });
      let legend = "";

      for (var index in all_data) {
        legend = "<span style='color: " + colors[index] + ";'>" + date_short_strings[index] + "</span>" + legend;

        let day_data = all_data[index];
        let d3_data = this.convertJsonToD3Format(day_data);
        this.plotLineOnGraph(d3_data, colors[index], '2');
      }

      $( '#overlayPreviousDaysLink' ).empty();
      $( '#overlayPreviousDaysLink' ).append(legend);
    });

    $( '#overlayPreviousDaysLink' ).empty();
    $( '#overlayPreviousDaysLink' ).append("<img src='loading.gif' id='previousDayLoading' />");
  }
}

let map = new CitibikeHistoricalMapController();

// Callbacks

function parseData(data) {
  map.parseData(data);
}

function initMap() {
  map.initMap();
}
