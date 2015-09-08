// Defining the app and dependencies
<<<<<<< HEAD
angular.module('braggingrights', ['ui.router','ui.bootstrap', 'uiGmapgoogle-maps', 'firebase', 'anguvideo'])
=======
angular.module('braggingrights', ['ui.router','ui.bootstrap','firebase', 'br-map'])
>>>>>>> origin/master



/*
-------- INITIAL CONFIGURATION --------
*/
<<<<<<< HEAD
.config(function() {
    
})

.config(function($stateProvider, $urlRouterProvider, uiGmapGoogleMapApiProvider) {   
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyDEdKE2QWDOArAqz_E_8Y2Uu00qcjtL_44',
    v: '3.20', //defaults to latest 3.X anyhow
    libraries: 'weather,geometry,visualization'
  });

  $urlRouterProvider.otherwise('/welcome/');
=======
.config(function($stateProvider, $urlRouterProvider) {   
  $urlRouterProvider.otherwise('welcome/');
  
>>>>>>> origin/master
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
.controller('welcomeController', ['$scope', '$state', function($scope, $state){
  $scope.enterSite = function() {
    $state.go('main');
  }
}])

.controller('mainController', function($scope, $modal, uiGmapGoogleMapApi, FirebaseData){
  $scope.mapview = true;
<<<<<<< HEAD
=======
  $scope.selections = {world:null, whole_world:null};
  $scope.resetMap = function() {
    $scope.selections.world = $scope.selections.whole_world;
  }
>>>>>>> origin/master

  uiGmapGoogleMapApi.then(function(maps) {
    $scope.map = { 
      center: { latitude: 0, longitude: 0 }, 
      zoom: 2, 
      options:{
        mapTypeId: maps.MapTypeId.ROADMAP,
        minZoom: 1.85
      } 
    };
  })
  

  $scope.test = {idKey:'I\'m a key', coords:{latitude:0,longitude:0}};

  $scope.testdata = FirebaseData.allEventsArray;
  console.log('thing',FirebaseData);


  $scope.openAddEvent = function () {
    var modalInstance = $modal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'templates/addEventModal.html',
      controller: 'addEventModalInstanceController',
      size: 'lg'
    });
  };
  $scope.openEventDetails = function (the_event) {
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
  $scope.toggleView = function(mapview) {
    $scope.mapview = mapview;
  };
})
<<<<<<< HEAD


.factory('FirebaseData', function($firebaseArray) {
  var rootRef = new Firebase('https://braggingrights.firebaseio.com/Events');
  var rootObj = $firebaseArray(rootRef);

  return {
    pushObjectToFirebase: function(object) {
      rootObj.$add(object);
    },
    allEventsArray: rootObj
  }
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
=======
.controller('addEventModalInstanceController', function($scope, $modalInstance, $state, $stateParams) {
  

>>>>>>> origin/master
  $scope.cancel = function () {

    $modalInstance.dismiss('cancel');
  }
})