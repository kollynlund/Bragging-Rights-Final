angular.module('br-map', [])

.factory('d3', function(){

	return d3;
})

.factory('WorldDataFiles', function($http){
	return {
		getCountryDataPromise: function(country) {
			return $http.get('data/countries/'+country+'/geodata.json');
		},
		getWorldDataPromise: function() {
			return $http.get('data/countries/world/geodata.json');
		},
	}
})

.directive('brMap', ['$window', 'd3', 'WorldDataFiles', function($window, d3, WorldDataFiles) {
	return {
		scope: {
			selections: '='
		},
		restrict: 'E',
		compile: function(tElement, tAttrs, transclude) {
			var width = tElement.parent()[0].offsetWidth;
			var height = $window.innerHeight * .8; // tElement.parent()[0].offsetHeight;
			var orig_svg = d3.select(tElement[0]).append('svg').attr("width", width).attr("height", height);
			var svg = orig_svg.append('g');
			

			function drawMap(error, world, scope) {
				if (world) {
					// Set up data
					var raw_countries = topojson.feature(world, world.objects['geodata']);
					var countries = raw_countries.features;
					var bounds = d3.geo.bounds(raw_countries);
					console.log('bounds:',bounds);
					var projection = d3.geo.mercator().translate([0,0]);
					console.log('scale:',projection.scale());
					var hscale = 360*width / (bounds[1][0] - bounds[0][0]); // width; // * width / (bounds[1][0] - bounds[0][0]);
					var vscale = 240*height / (bounds[1][1] - bounds[0][1]); // height; // * height / (bounds[1][1] - bounds[0][1]);
					scale = (hscale < vscale) ? hscale: vscale;
					var newProjection = projection.scale(scale);
					var topleft = newProjection([bounds[0][0],bounds[1][1]]);
					console.log('top left:',topleft);
					var bottomright = newProjection([bounds[1][0],bounds[0][1]]);
					console.log('bottom right:',bottomright);
					var new_width = (bottomright[0] - topleft[0]);
					var new_height = (bottomright[1] - topleft[1]);
					var extra_w_space = width - new_width;
					var extra_v_space = height - new_height;
					console.log('extra_v_space',extra_v_space);
					var topcenter = newProjection([bounds[0][0],bounds[1][1]]);				
					var offset = [-topcenter[0] + extra_w_space / 2,-topcenter[1] + extra_v_space / 2];
					newProjection.translate(offset);					
					var path = d3.geo.path().projection(newProjection);

					// Clean up old map since we might be redrawing
					svg.selectAll(".country").remove();
					svg.attr("transform", "");

					// Create the selection and set up the data
					var country = svg.selectAll(".country").data(countries);

					function move() {
						var t = d3.event.translate;
						var s = d3.event.scale; 
						zscale = s;
						var h = height/5;

						t[0] = Math.min(
							(width/height) * (s - 1), 
							Math.max( width * (1 - s), t[0] )
						);

						t[1] = Math.min(
							h * (s - 1) + h * s, 
							Math.max(height * (1 - s) - h * s, t[1])
						);

						zoom.translate(t);
						svg.attr("transform", "translate(" + t + ")scale(" + s + ")");

						//adjust the country hover stroke width based on zoom level
						d3.selectAll(".country").style("stroke-width", 1 / s);
					}
					var zoom = d3.behavior.zoom().scaleExtent([1,9]).on('zoom', function() {
						console.log('things');
						move();
					});

					orig_svg.call(zoom);

					// Bind the data and create the elements
					country
					.enter()
					.insert("path")
					.filter(function(country){return country.properties.name != 'Fiji'})
					.attr("class", "country")	
					.attr("title", function(d) { return d.properties.name; })
					.attr("d", path)
					.style("fill", "#C1BFBF")
					.style("stroke", "#333")
					;

					// Set up hover behaviors
					country.on('mouseover', function(d) {
						scope.$apply(function() {
							scope.selections.selected_country = d.properties.name;
						})
					})
					.on('mouseout', function(d) {
						scope.$apply(function() {
							scope.selections.selected_country = null;
						})
					})

					// Set up click behavior
					.on('click', function(d) {
						WorldDataFiles.getCountryDataPromise(d.properties.admin).then(function(data) {
							scope.selections.world = data.data;
						});
					});
				}
			};

			return function link(scope, elm, attrs){
				// Redraw map on change in map data
				scope.$watch('selections.world', function() {
					drawMap(null, scope.selections.world, scope);
				})
			};
		}	
	}
}])

