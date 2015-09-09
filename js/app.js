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

.controller('mainController', function($scope, $filter, $modal, uiGmapGoogleMapApi, FirebaseData){
	$scope.data = {};
	$scope.data.firebase_events = FirebaseData.allEventsArray;
	uiGmapGoogleMapApi.then(function(maps) {
		$scope.data.mapview = true;
		$scope.data.map = { 
			center: { latitude: 0, longitude: 0 }, 
			zoom: 2, 
			options:{
				mapTypeId: maps.MapTypeId.SATELLITE,
				minZoom: 2
			} 
		};
	});
	$scope.$watchGroup(['data.searchbar_text','data.firebase_events'],function(newValues, oldValues) {
		console.log('things changed');
		$scope.data.filteredMarkers = $filter("filter")(newValues[1], newValues[0]);

		if (!$scope.data.filteredMarkers) {
			return;
		}
	});

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
			animation: $scope.animationsEnabled,
			templateUrl: 'templates/eventDetailsModal.html',
			controller: 'addEventModalInstanceController',
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
	var realRootRef = new Firebase('https://braggingrights.firebaseio.com');
	var rootObj = new $firebaseArray(rootRef);
	var realRootObj = new $firebaseObject(realRootRef);

	return {
		pushObjectToFirebase: function(object) {
			rootObj.$add(object);
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
.controller('addEventModalInstanceController', function($scope, $modalInstance, $state, $stateParams, the_event) {
	$scope.selections = {};
	$scope.touches = {};
	$scope.possible_months = [{days:31,month:'January'},{days:28,month:'February'},{days:31,month:'March'},{days:30,month:'April'},{days:31,month:'May'},{days:30,month:'June'},{days:31,month:'July'},{days:31,month:'August'},{days:30,month:'September'},{days:31,month:'October'},{days:30,month:'November'},{days:31,month:'December'}];
	$scope.possible_days = [];
	$scope.disciplines = ['Dirtbike','Mtn. Bike','Skateboard','Wakeboard','Snowboard','Ski','Surf','Snowmobile','Scooter','BMX'];

	$scope.theEvent = the_event;

	$scope.setDays = function(month) {
		if (month) {
			$scope.possible_days = _.range(_.filter($scope.possible_months,function(item){return item.month == month})[0].days+1);
		}
		else {
			$scope.selections.Day = '';
			$scope.possible_days = [];
		}
		$scope.possible_days.shift();
	}

	$scope.cancel = function () {

		$modalInstance.dismiss('cancel');
	}
})
