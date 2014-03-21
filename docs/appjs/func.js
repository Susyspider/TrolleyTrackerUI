function getDistanceAcrossPath(slatlng,tlatlng,rpath){
	var times1 = 0;
	var times2 = 0;
	
	var res1 = closestPointOnPath(slatlng,rpath);
	var res2 = closestPointOnPath(tlatlng,rpath);
	
	var index1 = res1.index;
	var index2 = res2.index;

	var coords1 = [];
	var coords2 = [];

	if(res1.dist > 20 | res2.dist > 20){	
		console.log("The coordinate(s) are too far away from path, cannot continue.");
		return;
	}

	while(index1 != res2.index && times1 <= rpath.length){
		index1 = ((index1 + 1) % rpath.length);
		coords1.push(rpath[index1]);
		times1++;
	}

	while(index2 != res1.index && times2 <= rpath.length){
		index2 = ((index2 + 1) % rpath.length);
		coords2.push(rpath[index2]);
		times2++;
	}
	
	var length1 = google.maps.geometry.spherical.computeLength(coords1);
	var length2 = google.maps.geometry.spherical.computeLength(coords2);
	
	return {"len1":length1,"len2":length2};
}

function markerDropListener(marker,path,map){
	var shadow = new google.maps.Marker({
		position : marker.getPosition(),
		visible : false
	  });
	  
	shadow.setMap(map);
	  
	google.maps.event.addListener(marker, "dragend", function(event) { 
	  var lat = event.latLng.lat(); 
	  var lng = event.latLng.lng();
	  var latlng = new google.maps.LatLng(lat,lng);
	  marker.setPosition(latlng);
	  
	  var res = closestPointOnPath(latlng,path);
	  shadow.setPosition(res.coord);
	  shadow.setVisible(true);
	});
}

function closestPointOnPath(latlng,path){
	var coord = path[0];
	var theindex;
	var temp;
	for(index = 1; index < path.length; index++){
		temp = google.maps.geometry.spherical.computeDistanceBetween(latlng,path[index]);
		if(temp < google.maps.geometry.spherical.computeDistanceBetween(latlng,coord)){
			coord = path[index];
			theindex = index;
		}
	}
	
	var dist = google.maps.geometry.spherical.computeDistanceBetween(latlng,coord);
	/*
	if(dist <= 6){
		console.log("Uber awesome. Distance between markers is: "+dist+" m");
	} else if (dist <= 20){
		console.log("Cool. Distance between markers is: "+dist+" m");
	  } else {
		console.log("Warning, draggable marker is far away from path: "+dist+" m");
	    }*/
	
	return {"coord":coord,"dist":dist,"index":theindex};
}

function addMarkerListener(map,marker){
	google.maps.event.addListener(marker, 'click', function() {
        map.panTo(marker.getPosition());
    });
}

function animateSymbol(polyline) {
	var count = 0;
	var step = 64;
	window.setInterval(function() {
		count = (count + 1) % (step*100);

		var icons = polyline.get('icons');
		icons[0].offset = (count / step) + '%';
		polyline.set('icons', icons);
	}, 20);
}

//edited
function animateMarker(tmarker,tmarker_path,rpolyline,slatlng) {
	if (arguments.length == 3) {
		var coords;
		var index = 0;
		setInterval(function() {
			coords = tmarker_path[index % tmarker_path.length];
			index++;
			tmarker.setVisible(google.maps.geometry.poly.isLocationOnEdge(coords, rpolyline, 0.0005));
			tmarker.setPosition(coords);
		}, 100);
	} else if (arguments.length == 4) {
		var tlatlng;
		var index = 0;
		setInterval(function() {
			tlatlng = tmarker_path[index % tmarker_path.length];
			index++;
			tmarker.setVisible(google.maps.geometry.poly.isLocationOnEdge(tlatlng, rpolyline, 0.0005));
			tmarker.setPosition(tlatlng);
			var dist = getDistanceAcrossPath(slatlng,tlatlng,tmarker_path);
			console.log("Length1: "+dist.len1+"m. Length2: "+dist.len2+" m.");
		}, 100);
	}
}

//new
function applyUpdate(tarray,upd) {
	var date = new Date(upd.date*1000);
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	
	var tname = upd.name;
	var tlatlng = new google.maps.LatLng(upd.lat,upd.lng);
	var formattedTime = hours + ':' + minutes + ':' + seconds;
	
	console.log("Trolley: "+tname+", Coords: "+tlatlng+", Date: "+formattedTime);
	
	for (var i = 0; i < tarray.length; i++) {
	    if (tarray[i].name == tname){
	    	tarray[i].marker.setPosition(tlatlng);
	    	return;
	    }
	}
	
	//trolley was not found, create trolley and add to tarray
	var troll = new google.maps.Marker({
		position : tlatlng,
		title    : tname
	});
		
	troll.setMap(map);
	upd.marker = troll;
	tarray.push(upd);
	//if trolley has been inactive for a looong while, remove object
}

function centerOnPath(path,map) {
	var maxLat = path.getAt(0).d;
	var minLat = path.getAt(0).d;
	var maxLng = path.getAt(0).e;
	var minLng = path.getAt(0).e;
	
	for(index = 1; index < path.getLength(); index++){
		if(path.getAt(index).d > maxLat){
			maxLat = path.getAt(index).d;
		}
		
		if(path.getAt(index).d < minLat){
			minLat = path.getAt(index).d;
		}
		
		if(path.getAt(index).e > maxLng){
			maxLng = path.getAt(index).e;
		}
		
		if(path.getAt(index).e < minLng){
			minLng = path.getAt(index).e;
		}
	}
	//console.log("Min Lat: "+minLat+"Max Lat: "+maxLat+"Min Lng: "+minLng+"Max Lng: "+maxLng);
	var SW = new google.maps.LatLng(minLat,minLng);
	var NE = new google.maps.LatLng(maxLat,maxLng);

	var bounds = new google.maps.LatLngBounds(SW, NE);
	map.fitBounds(bounds);
}

//TODO: turn off all trolleys on all routes
//TODO: turn on trolleys on route
//TODO: Center on path when route is enabled
$(document).ready(function() {
    $('input:radio[name="route-choice"]').change(
    function(){
	   	var the_route;
	   	var self = $(this).val();
	   	$.each(route_array, function(route) {
			route_array[route].value.setVisible(false);
			if(route_array[route].key === self){
				the_route = route_array[route].value;
			}
		});
		the_route.setVisible(true);
		//console.log(the_route.getPath() == undefined);
		//centerOnPath(the_route.getPath(),map);
	});
});

//removed GMaps UI Controls