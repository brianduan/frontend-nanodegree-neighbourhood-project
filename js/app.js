var map;
var largeInfowindow;
var markers = [];
var locationDataArr = [];
var isValidAPI;

// Create an array of locations
var locations = [
  {title: 'Martin Place Station', location: {lat: -33.867969, lng: 151.211503},isVisible: ko.observable(true)},
  {title: 'Circular Quay', location: {lat: -33.861756, lng: 151.2108839}, isVisible: ko.observable(true)},
	{title: 'Wynyard Station', location: {lat: -33.8657423, lng: 151.2061878},isVisible: ko.observable(true)},
	{title: 'Museum Station', location: {lat: -33.8766329, lng: 151.2098155},isVisible: ko.observable(true)},
	{title: 'Town Hall Train Station', location: {lat: -33.8732664, lng: 151.2062183},isVisible: ko.observable(true)}
];

function googleError() {
    alert("Fail to connect to Google Map API. Please try again later.");
}

function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -33.8688197, lng: 151.2092955},
    zoom: 13,
    mapTypeControl: false
  });
  
  largeInfowindow = new google.maps.InfoWindow();
  isValidAPI = true;

  fetchFoursquare();

  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    var position = locations[i].location;
    var title = locations[i].title;
    // Create a marker per location, and put into markers array.
     var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i,
    });
    markers.push(marker);
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });
    marker.addListener('click', bounceOnce);
    }

  // loop through the markers array and display them all.
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);

  ko.applyBindings(new ViewModel());
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
var populateInfoWindow = function(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    var foursquareString = '';
    locationDataArr.forEach(function(locationData){
    	if (locationData.title == marker.title){
    		foursquareString = locationData.loc;
    	}
    })
    infowindow.setContent('<div>' + marker.title + '</div>' +
    	'<div>' + foursquareString + '</div>'
    );
    if (isValidAPI == false){
      infowindow.setContent('<div>' + 'Fail to connect to FourSquare API. Please try again later' + '</div>'
    );}
    infowindow.open(map, marker);
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
  }
}

var bounceOnce = function(){
	var self=this;
	this.setAnimation(google.maps.Animation.BOUNCE);
	setTimeout(function(){self.setAnimation(null);}, 750);
}


// get location data from foursquare
var fetchFoursquare = function() {
 locationDataArr = [];
 var foursquareUrl = "";
 var locationData = [];
 var counter = 0
 locations.forEach(function(locationItem){
   foursquareUrl = 'https://api.foursquare.com/v2/venues/search' +
     '?client_id=24YCK53NVXTFAU2BS1M5K4QLICC2XHIWCDJZVF421W1JRF0A' +
     '&client_secret=10Y2FPGQ4OPU4DFX5N4YRNEIV02N3XO0VJSQBZASYR0SYLHD' +
     '&v=20161211' +
     '&ll=' + locationItem.location.lat + ',' + locationItem.location.lng + 
     '&query=' + locationItem.title + 
     '&intent=match';
      var tempCounter = counter;

   $.getJSON(foursquareUrl, function(data) {    
       var item = data.response.venues[0];
       locationData = {title: locationItem.title, lat: item.location.lat, lng: item.location.lng, name: item.name, loc: item.location.address + " " + item.location.city + ", " + item.location.state + " " + item.location.postalCode};
       locationDataArr.push(locationData);
   }).fail(function(){
      if (tempCounter == 0){
        alert('Fail to connect to FourSquare API. Please try again later');
      }
      isValidAPI = false;
   });
   counter++; 
 })
}

var ViewModel = function(){
	var self = this;
  self.searchText =  ko.observable("");
	self.locationList = ko.observableArray([]);
	locations.forEach(function(item){
		self.locationList.push(item);
	})

	self.filteredLocation = ko.computed(function(){
		return ko.utils.arrayFilter(self.locationList(), function(location) {
			if (self.searchText() == ''){
				location.isVisible(true);
			}
	    else if (location.title.toLowerCase().indexOf(self.searchText().toLowerCase()) == -1){
    			location.isVisible(false);
    	}
    	else{
    		location.isVisible(true);
    	}
	  });
	})

  self.filteredMarker = ko.computed(function(){
    return ko.utils.arrayFilter(markers, function(marker) {
      if (self.searchText() == ''){
        marker.setMap(map);
      }
      else if (marker.title.toLowerCase().indexOf(self.searchText().toLowerCase()) == -1){
            marker.setMap(null);
      }
      else{
        marker.setMap(map);
      }
    });
  })
  
	self.currentLocation = ko.observable(this.locationList()[0]);
	self.setCurrentLocation = function(clickedLocation){
		self.currentLocation(clickedLocation);
		var bounds = new google.maps.LatLngBounds();
		// Extend the boundaries of the map for each marker and display the marker
		for (var i = 0; i < markers.length; i++) {
		  if (markers[i].title == self.currentLocation().title){
		  	markers[i].setAnimation(google.maps.Animation.BOUNCE);
		  	var tempI = i;
		  	setTimeout(function(){markers[tempI].setAnimation(null);}, 700);
		  	populateInfoWindow(markers[i], largeInfowindow);
		  }
		  bounds.extend(markers[i].position);
		}
		map.fitBounds(bounds);
	}
}