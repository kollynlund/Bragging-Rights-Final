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
			bounds: {northeast:{latitude:90,longitude:-180},southwest:{latitude:-90,longitude:180}},
			control: {}
		};

		uiGmapIsReady.promise().then(function(map) {
			$scope.data.map_control = $scope.map.control.getGMap();
			console.log('projection:',$scope.data.map_control.getProjection().fromPointToLatLng(10,10));
			function createBounds(centermax) {
				return new maps.LatLngBounds(new maps.LatLng(-centermax,-180), new maps.LatLng(centermax,180));
			};
			// var allowedBoundsArray = {
			// 	'2': createBounds(63.6771078),
			// 	'3': createBounds(63.6771078),
			// 	'4': createBounds(63.6771078),
			// 	'5': createBounds(63.6771078),
			// 	'6': createBounds(63.6771078),
			// 	'7': createBounds(63.6771078),
			// 	'8': createBounds(63.6771078),
			// 	'9': createBounds(63.6771078),
			// 	'10': createBounds(63.6771078),
			// 	'11': createBounds(63.6771078),
			// 	'12': createBounds(63.6771078),
			// 	'13': createBounds(63.6771078),
			// 	'14': createBounds(63.6771078),
			// 	'15': createBounds(63.6771078),
			// 	'16': createBounds(63.6771078),
			// 	'17': createBounds(63.6771078),
			// 	'18': createBounds(63.6771078),
			// 	'19': createBounds(63.6771078),
			// 	'20': createBounds(63.6771078),
			// 	'21': createBounds(63.6771078),
			// };


			maps.event.addListener($scope.data.map_control,'center_changed',function() { checkBounds(); });
			var allowedBounds = new maps.LatLngBounds(
				new maps.LatLng(-73.6102172, -180), 
				new maps.LatLng(67, 180)
			);
			function checkBounds() {

				if(! allowedBounds.contains($scope.data.map_control.getCenter())) {
					var C = $scope.data.map_control.getCenter();
					var X = C.lng();
					var Y = C.lat();

					var AmaxX = allowedBounds.getNorthEast().lng();
					var AmaxY = allowedBounds.getNorthEast().lat();
					var AminX = allowedBounds.getSouthWest().lng();
					var AminY = allowedBounds.getSouthWest().lat();

					if (X < AminX) {X = AminX;}
					if (X > AmaxX) {X = AmaxX;}
					if (Y < AminY) {Y = AminY;}
					if (Y > AmaxY) {Y = AmaxY;}

					// $scope.data.map_control.setCenter(new maps.LatLng(Y,X));
				}
			}


		})
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
		 $(window).off("resize.doResize"); //remove the handler added earlier
	});

	$scope.openAddEvent = function () {
		console.log('that thing did happen');
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
	return _;
})

/*
-------- MODAL CONTROLLERS --------
*/
.controller('addEventModalInstanceController', function($scope, $modalInstance, uiGmapGoogleMapApi, FirebaseData) {
	uiGmapGoogleMapApi.then(function(maps) {
		$scope.mapview = false;
		$scope.map = { 
			center: { latitude: 0, longitude: 0 }, 
			zoom: 2, 
			options:{
				mapTypeId: maps.MapTypeId.SATELLITE,
				minZoom: 2
			} 
		};
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







