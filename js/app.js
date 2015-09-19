angular.module('braggingrights', ['ui.router','ui.bootstrap', 'uiGmapgoogle-maps', 'firebase', 'anguvideo'])


/*
-------- INITIAL CONFIGURATION --------
*/
.config(function($stateProvider, $urlRouterProvider, uiGmapGoogleMapApiProvider) {
	uiGmapGoogleMapApiProvider.configure({
		key: 'AIzaSyDEdKE2QWDOArAqz_E_8Y2Uu00qcjtL_44',
		v: '3.20', //defaults to latest 3.X anyhow
		libraries: 'weather,geometry,visualization'
	});

	$urlRouterProvider.otherwise('/welcome/');

	$stateProvider
		.state('welcome', {
			url: '/welcome/',
			templateUrl: 'welcome.html',
			controller: 'welcomeController'
		})

		.state('main', {
			url: '/main',
			templateUrl: 'main.html',
			controller: 'mainController'
		})

		.state('detail', {
			url:'/details/{event_id}',
			templateUrl: 'templates/eventDetail.html',
			controller: 'eventDetailController'
		})
})


/*
-------- MAIN CONTROLLERS --------
*/
.controller('welcomeController', function($scope, $state, FirebaseData){
	// FirebaseData.writeNewEvents();
	$scope.enterSite = function() {
		$state.go('main');
	}
})
.controller('mainController', function($scope, $window, $filter, $state, $modal, uiGmapGoogleMapApi, uiGmapIsReady, FirebaseData){
	$scope.windowWidth = $window.innerWidth;
	$scope.map_error = true;
	$scope.disciplines = ['MOTO','MTB','SK8','Wakeboard','Snowboard','Ski','Surf','Snowmobile','Scooter','BMX'];
	$scope.selected_discipline = '';
	$scope.data = {
		firebase_events: FirebaseData.allEventsArray,
		eligible_events: FirebaseData.allEventsArray,
	};
	
	uiGmapGoogleMapApi.then(function(maps) {
		$scope.map_error = false;
		$scope.data.mapview = true;
		$scope.map = { 
			center: { latitude: 0, longitude: 0 }, 
			zoom: 2, 
			options: {
				mapTypeId: maps.MapTypeId.SATELLITE,
				minZoom: 2
			},
			control: {}
		};

		uiGmapIsReady.promise(1).then(function(map) {
			// Setting up control to keep map in bounds vertically
			$scope.data.map_control = $scope.map.control.getGMap();
			maps.event.addListener($scope.data.map_control,'center_changed',function() { 
				checkBounds(); 
			});
			function checkBounds() {
				var projection = $scope.data.map_control.getProjection();
				var bounds = $scope.data.map_control.getBounds();
				var center = projection.fromLatLngToPoint($scope.data.map_control.getCenter());
				var sw = projection.fromLatLngToPoint(bounds.getSouthWest());
				var ne = projection.fromLatLngToPoint(bounds.getNorthEast());
				var spread = sw.y - ne.y;

				if (ne.y < 0) {
					$scope.data.map_control.setCenter(projection.fromPointToLatLng(new maps.Point(center.x, Math.ceil(spread / 2))));					
				} else if (sw.y > 257) {
					$scope.data.map_control.setCenter(projection.fromPointToLatLng(new maps.Point(center.x, 256 - Math.floor(spread / 2))));					
				}
			};
		});
	});

	// Watch for changes in the search text and the event array
	$scope.$watch('data.firebase_events',function(newValue, oldValue) {
		// Keep eligible events in sync if new data comes from Firebase
		$scope.eligible_events = newValue.filter(function(item){return item.Discipline === $scope.selected_discipline});
	});
	$scope.$watchGroup(['data.searchbar_text','data.eligible_events'],function(newValues, oldValues) {
		$scope.data.filteredMarkers = $filter("filter")(newValues[1], newValues[0]);

		if (!$scope.data.filteredMarkers) {
			return;
		}
	});
	// Watch for changes in the window width
	$(window).on("resize.doResize", function (){
		$scope.$apply(function(){
		   $scope.windowWidth = $window.innerWidth;
		});
	});
	$scope.$on("$destroy",function (){
		// Kill resize listener
		 $(window).off("resize.doResize");
	});
	// -------------------------------------

	$scope.openAddEvent = function () {
		var modalInstance = $modal.open({
			animation: true,
			templateUrl: 'templates/addEventModal.html',
			controller: 'addEventModalInstanceController',
			size: 'lg'
		});
	};
	$scope.openEventDetails = function(the_event) {
		$state.go('detail', {event_id: the_event.$id});
	};
	$scope.clickedMarker = function(a,b,c) {
		// Open details modal
		$scope.openEventDetails(c);
	};
	$scope.selectDiscipline = function(discipline) {
		if (discipline) {
			$scope.data.eligible_events = $scope.data.firebase_events.filter(function(item){return item.Discipline === discipline});
			$scope.selected_discipline = discipline;
		}
		else {
			$scope.data.eligible_events = $scope.data.firebase_events;
			$scope.selected_discipline = '';
		}
	}
	$scope.toggleView = function(mapview) {
		// Map view or list view
		$scope.data.mapview = mapview;
	};
})


/*
-------- MODAL CONTROLLERS --------
*/
.controller('addEventModalInstanceController', function($scope, $http, $modalInstance, uiGmapGoogleMapApi, uiGmapIsReady, FirebaseData) {
	// Video link matching utilities
	function matchYoutubeUrl(url) {
		var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
		return [(url.match(p)) ? true : false, (url.match(p)) ? RegExp.$1 : false]
	};
	function matchVimeoUrl(url) {
		var p = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
		return [(url.match(p)) ? true : false, (url.match(p)) ? RegExp.$3 : false]
	};

	$scope.disciplines = ['MOTO','MTB','SK8','Wakeboard','Snowboard','Ski','Surf','Snowmobile','Scooter','BMX'];
	$scope.fields = {};
	$scope.submit_tried = false;
	$scope.valid_event = false;
	// Configuration for the datepicker
	$scope.fields.Date = new Date();
	$scope.minDate = new Date(1000,1,1)
	$scope.maxDate = new Date();
	$scope.status = {
		opened: false
	};
	$scope.dateOptions = {
		formatYear: 'yy',
		startingDay: 1
	};
	$scope.open = function($event) {
		$scope.status.opened = true;
	};
	// -------------------------------

	uiGmapGoogleMapApi.then(function(maps) {
		$scope.mapview = true;
		$scope.map = { 
			center: { latitude: 0, longitude: 0 }, 
			zoom: 2, 
			options:{
				mapTypeId: maps.MapTypeId.SATELLITE,
				minZoom: 2
			},
			control: {},
			events: {
				click: function(map, eventName, originalEventArgs) {
					var e = originalEventArgs[0];
					var lat = e.latLng.lat(),lon = e.latLng.lng();
					var marker = {
						id: Date.now(),
						coords: {
							latitude: lat,
							longitude: lon
						}
					};
					$scope.map.placed_marker = [marker];
					$scope.fields.coords = marker.coords;

					// Reverse geocoding of selected lat/long point
					$http.get('http://open.mapquestapi.com/nominatim/v1/reverse.php?format=json&lat='+String(marker.coords.latitude)+'&lon='+String(marker.coords.longitude)+'&zoom=18&addressdetails=1').then(function(data) {
						var BAO = data.data.address || {country:'(No country data available)'};
						$scope.fields.Country = BAO.country;
						$scope.fields.State = BAO.state || null;
						$scope.fields.City = (
							BAO.suburb ? BAO.suburb : (
								BAO.village ? BAO.village : (
									BAO.hamlet ? BAO.hamlet : (
										BAO.town ? BAO.town : (
											BAO.city ? BAO.city : (
												BAO.county ? BAO.county : (
													BAO.state_district ? BAO.state_district : null
												)
											)
										)
									)
								)
							)
						);
					});

					$scope.$apply();
				}
			},
			placed_marker:[]
		};

		uiGmapIsReady.promise(2).then(function(map) {
			// Setting up control to keep map in bounds vertically
			$scope.map_control = $scope.map.control.getGMap();
			maps.event.addListener($scope.map_control,'center_changed',function() { 
				checkBounds(); 
			});
			function checkBounds() {
				var projection = $scope.map_control.getProjection();
				var bounds = $scope.map_control.getBounds();
				var center = projection.fromLatLngToPoint($scope.map_control.getCenter());
				var sw = projection.fromLatLngToPoint(bounds.getSouthWest());
				var ne = projection.fromLatLngToPoint(bounds.getNorthEast());
				var spread = sw.y - ne.y;

				if (ne.y < 0) {
					$scope.map_control.setCenter(projection.fromPointToLatLng(new maps.Point(center.x, Math.ceil(spread / 2))));					
				} else if (sw.y > 255) {
					$scope.map_control.setCenter(projection.fromPointToLatLng(new maps.Point(center.x, 254 - Math.floor(spread / 2))));					
				}
			};
		});
	});

	$scope.cancel = function () {
		// Cancels modal window
		$modalInstance.dismiss('cancel');
	};
	
	$scope.submit = function() {
		var verifyEvent = function(fields) {
			var name_valid = (fields.Name ? fields.Name.trim().length : 0) > 1;
			var trick_valid = (fields.Trick ? fields.Trick.trim().length : 0) > 1;
			var date_valid = fields.Date.getTime() <= new Date().getTime();
			var discipline_valid = fields.Discipline != '' && fields.Discipline != '-- Select a discipline --';
			var details_valid = true;
			var location_valid = (fields.coords.latitude ? true : false) && (fields.coords.longitude ? true : false) && (fields.Country ? true : false);
			var media_valid = (fields.Video ? matchYoutubeUrl(fields.Video)[0] : true) || (fields.Video ? matchVimeoUrl(fields.Video)[0] : true);
			var email_valid = true;

			$scope.valid_event = name_valid && trick_valid && date_valid && discipline_valid && details_valid && location_valid && media_valid && email_valid; 
			return $scope.valid_event;
		};

		// TODO: Change this flow so that the dates are stored in Firebase as JavaScript date objects and we can display them using toLocaleDateString on the client side
		var newEvent = {
			'Additional Information':$scope.fields['Additional Information'] || null,
			'City':$scope.fields.City || null,
			'Country':$scope.fields.Country || null,
			'Date':$scope.fields.Date || null,
			'Discipline':$scope.fields.Discipline || null,
			'Name':$scope.fields.Name ? $scope.fields.Name.trim() : null,
			'Trick':$scope.fields.Trick || null,
			'Video':$scope.fields.Video || null,
			'coords':$scope.fields.coords || null,
			'imgpath':($scope.fields.Discipline ? '../img/icon_pngs/'+$scope.fields.Discipline.toLowerCase()+'.png' : null)
		};
		
		if (verifyEvent(newEvent)) {
			var submittableEvent = _.set(newEvent,'Date',$scope.fields.Date.toLocaleDateString());
			FirebaseData.pushEventToFirebase(submittableEvent);
			$modalInstance.close();	
		}
		else {
			$scope.submit_tried = true;
		};
	};
})
.controller('eventDetailController', function($scope, $state, $stateParams, FirebaseData) {
	FirebaseData.getSingleEvent($stateParams.event_id).then(function(data) {
		$scope.theEvent = data;
	});

	$scope.cancel = function () {
		$state.go('main');
	}
})


/*
-------- DATA AND UTILITIES --------
*/
.factory('FirebaseData', function($firebaseArray, $firebaseObject) {
	var rootRef = new Firebase('https://braggingrights.firebaseio.com/New Events');
	var rootObj = new $firebaseArray(rootRef);

	var realRootRef = new Firebase('https://braggingrights.firebaseio.com/Test Events');
	var realRootObj = new $firebaseArray(realRootRef);

	return {
		pushEventToFirebase: function(object) {
			rootObj.$add(object);
		},
		pushEventToFirebaseTest: function(object) {
			realRootObj.$add(object);
		},
		getAllEventsArray: function() {
			return rootObj.$loaded().then(function(){
				return rootObj.$value;
			})
		},
		getSingleEvent: function(event_id) {
			var the_event = new $firebaseObject(rootRef.child(event_id));
			return the_event.$loaded().then(function(){
				return the_event;
			})
		},
		// writeNewEvents: function() {
		// 	 return rootObj.$loaded().then(function(){
		// 		 console.log('dumbdumb');
		// 		 realRootObj['New Events'] = rootObj.map(function(item) {
		// 			 var pre = _.omit(_.set(item,'coords',{latitude:item.Latitude, longitude:item.Longitude}),['Latitude','Longitude']);
		// 			 pre.imgpath = item.Discipline ? '../img/icon_pngs/'+item.Discipline.toLowerCase()+'.png' : '';
		// 			 return pre;
		// 			 // return _.omit(_.set(item,'coords',{latitude:item.Latitude, longitude:item.Longitude}),['Latitude','Longitude']);
		// 		 });
		// 		 realRootObj.$save();
		// 	 });
		// },

		allEventsArray: rootObj
	}
})
.factory('_',function(){
	// Returns lodash
	return _;
})



// TODO: Make Firebase New Events be Events instead (it's just cleaner feeling)
// TODO: Fix the date locale issue