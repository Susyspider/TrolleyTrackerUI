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
	var maxLat = path.getAt(0).lat();
	var minLat = path.getAt(0).lat();
	var maxLng = path.getAt(0).lng();
	var minLng = path.getAt(0).lng();
	
	for(index = 1; index < path.getLength(); index++){
		var curr_pnt = path.getAt(index);
		if(curr_pnt.lat() > maxLat){
			maxLat = curr_pnt.lat();
		}
		
		if(curr_pnt.lat() < minLat){
			minLat = curr_pnt.lat();
		}
		
		if(curr_pnt.lng() > maxLng){
			maxLng = curr_pnt.lng();
		}
		
		if(curr_pnt.lng() < minLng){
			minLng = curr_pnt.lng();
		}
	}
	var SW = new google.maps.LatLng(minLat,minLng);
	var NE = new google.maps.LatLng(maxLat,maxLng);

	var bounds = new google.maps.LatLngBounds(SW, NE);
	map.fitBounds(bounds);
}

//turns off all routes, turns on selected route and adjusts map bounds to fit route
function ShowRoute(the_route){
	var title;
	$.each(route_array, function(route) {
			route_array[route].value.setVisible(false);
			if(route_array[route].key === the_route){
				title = route_array[route].title;
				the_route = route_array[route].value;
			}
		});
		the_route.setVisible(true);
		centerOnPath(the_route.getPath(),map);
		return {"poly":the_route,"title":title};
}

//turns off animation of all markers
function ShowStop(the_stop){
	$.each(stop_array, function(stop) {
			stop_array[stop].value.setAnimation(null);
			if(stop_array[stop].key === the_stop){
				the_stop = stop_array[stop].value;
			}
		});
		the_stop.setAnimation(google.maps.Animation.BOUNCE);
		map.setCenter(the_stop.getPosition());
		return the_stop;
}

//TODO: turn off all trolleys on all routes,turn on trolleys on route
$(document).ready(function() {
    $('input:radio[name="route-choice"]').change(
    function(){
	   	ShowRoute($(this).val());
	});
});

$(document).on('click', "#reset-map-view", function() {
    map.setCenter(new google.maps.LatLng(18.209438, -67.140543));
  	map.setZoom(17);
});

$(document).on('click', "#calculate-eta", function() {
	var the_stop = $('#select-stop').val();
	var the_route = $('#select-route').val();
	
	if(the_stop != "" && the_route != ""){
		the_route = ShowRoute(the_route);
		the_stop = ShowStop(the_stop);
		$( "#eta-stop" ).html("Stop: "+the_stop.getTitle());
		$( "#eta-route" ).html("Route: "+the_route.title);
		$( "#eta-eta" ).html("ETA: 10min" );
		$( "#eta-bar" ).html("<center>ETA: 10min</center>" );
	    $('#eta-bar').css({
	        'height': '22px',
	        'color': '#FFFFFF'
	    });
	}
	else{
		alert("Please select both a route and a stop.");
	}
});