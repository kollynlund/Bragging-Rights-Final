// Defining the app and dependencies
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
		});
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

.controller('mainController', function($scope, $window, $filter, $modal, uiGmapGoogleMapApi, uiGmapIsReady, FirebaseData){
	$scope.windowWidth = $window.innerWidth;
	$scope.data = {};
	$scope.data.firebase_events = FirebaseData.allEventsArray;
	$scope.map_error = true;
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
	$scope.$watchGroup(['data.searchbar_text','data.firebase_events'],function(newValues, oldValues) {
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
		var modalInstance = $modal.open({
			animation: true,
			templateUrl: 'templates/eventDetailsModal.html',
			controller: 'eventDetailsModalInstanceController',
			size: 'lg',
			resolve: {
				the_event: function () {
					return the_event;
				}
			}
		});
	};
	$scope.clickedMarker = function(a,b,c) {
		$scope.openEventDetails(c);
	};
	$scope.toggleView = function(mapview) {
		$scope.data.mapview = mapview;
	};
})


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

/*
-------- MODAL CONTROLLERS --------
*/
.controller('addEventModalInstanceController', function($scope, $http, $modalInstance, uiGmapGoogleMapApi, uiGmapIsReady, FirebaseData) {
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
	$scope.disciplines = ['MOTO','MTB','SK8','Wakeboard','Snowboard','Ski','Surf','Snowmobile','Scooter','BMX'];
	$scope.fields = {};

	// Configuration for the datepicker
	$scope.today = function() {
		return new Date();
	};
	$scope.fields.Date = $scope.today();
	$scope.minDate = new Date(1000,1,1)
	$scope.maxDate = $scope.today();
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

	$scope.cancel = function () {
		// Cancels modal window
		$modalInstance.dismiss('cancel');
	};
	$scope.submit = function() {

		// Do event verification here and set scope variables corresponding to error behavior
		var verifyEvent = function(the_new_event) {
			return true;
		};

		var newEvent = {
			'Additional Information':$scope.fields['Additional Information'] || null,
			'City':$scope.fields.City || null,
			'Country':$scope.fields.Country || null,
			'Date':$scope.fields.Date || null,
			'Discipline':$scope.fields.Discipline || null,
			'Name':$scope.fields.Name || null,
			'Trick':$scope.fields.Trick || null,
			'Video':$scope.fields.Video || null,
			'coords':{latitude:$scope.fields.Latitude, longitude:$scope.fields.Longitude} || null,
			'imgpath':($scope.fields.Discipline ? '../img/icon_pngs/'+$scope.fields.Discipline.toLowerCase()+'.png' : null)
		};
		if (verifyEvent(newEvent)) {
			FirebaseData.pushEventToFirebase(newEvent);
			$modalInstance.close();	
		}
	};
})
.controller('eventDetailsModalInstanceController', function($scope, $modalInstance, $state, $stateParams, the_event) {
	$scope.theEvent = the_event;

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	}
})







