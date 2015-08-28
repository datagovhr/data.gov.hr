(function ($) {
Drupal.behaviors.md_wordcloud_preview = {
	attach: function () {
		var words = Drupal.settings.words;
		var counts = Drupal.settings.counts;
		var width = +d3.select("#edit-width").property("value"),
		height = +d3.select("#edit-height").property("value");		
		var fill = d3.scale.category20();
		var fontSize;
		var angle_from = -90, 
		angle_to = 90, 
		angle_count = 5;
		var layout = d3.layout.cloud()
							  .size([width, height])
							  .timeInterval(10)
							  .font("Impact")
							  .fontSize(function(d) { return fontSize(+d.size); })
							  .on("end", draw);
		
		var r = 50.5,
		px = 35,
		py = 20;
		var angles = d3.select("#angles").append("svg")
						.attr("width", 2 * (r + px))
						.attr("height", r + 1.5 * py)
						.append("g")
						.attr("transform", "translate(" + [r + px, r + py] +")"); 
		angles.append("path")
			  .style("fill", "none")
			  .attr("d", ["M", -r, 0, "A", r, r, 0, 0, 1, r, 0].join(" "));
		angles.append("line")
		 	  .attr("x1", -r - 7)
		 	  .attr("x2", r + 7);
		angles.append("line")
			  .attr("y2", -r - 7);
		angles.selectAll("text")
			  .data([-90, 0, 90])
			  .enter().append("text")
			  .attr("dy", function(d, i) { return i === 1 ? null : ".3em"; })
			  .attr("text-anchor", function(d, i) { return ["end", "middle", "start"][i]; })
			  .attr("transform", function(d) {	d += 90;
												return "rotate(" + d + ")translate(" + -(r + 10) + ")rotate(" + -d + ")translate(2)";
											})
			  .text(function(d) { return d + '°'; });
		
		var radians = Math.PI / 180,
	    arc = d3.svg.arc()
	        	.innerRadius(0)
	        	.outerRadius(r);
		
		getAngles();
		
		$('#edit-angle-count, #edit-angle-from, #edit-angle-to, #edit-width, #edit-height, #edit-max-words').focusout(function() {
			getAngles();
		});
		d3.select('#block-admin-configure').selectAll("input[type=radio]").on('change', generate);
		
		function getAngles() {
			angle_count = d3.select("#edit-angle-count").property("value");
			angle_from = Math.max(-90, Math.min(90, +d3.select("#edit-angle-from").property("value")));
			angle_to = Math.max(-90, Math.min(90, +d3.select("#edit-angle-to").property("value"))); 
			width = +d3.select("#edit-width").property("value");
			height = +d3.select("#edit-height").property("value");
			if (isNaN(width) || isNaN(height) || isNaN(angle_count) || isNaN(angle_from) || isNaN(angle_to)) {
				d3.select("#edit-angle-count").property("value", angle_count);
				d3.select("#edit-angle-from").property("value", angle_from);
				d3.select("#edit-angle-to").property("value", angle_to);
				d3.select("#edit-width").property("value", width);
				d3.select("#edit-height").property("value", height);
				return;
			}
			
			update();
			generate();
		}
		
		function update() {
			// Rotate words by parameters
			var scale = d3.scale.linear()
								.domain([0, angle_count - 1]).range([angle_from, angle_to]);
			layout.size([width, height])
				  .rotate(function(){return scale(~~(Math.random() * angle_count));});
			
			var path = angles.selectAll("path.angle")
			 				 .data([{startAngle: angle_from * radians, endAngle: angle_to * radians}]);
			path.enter().insert("path", "circle")
						.attr("class", "angle")
						.style("fill", "#fc0");
			path.attr("d", arc);
			
			var line = angles.selectAll("line.angle")
						 .data(d3.range(angle_count).map(scale));
			line.enter().append("line")
					.attr("class", "angle");
			line.exit().remove();
			line.attr("transform", function(d) { return "rotate(" + (90 + d) + ")"; })
			.attr("x2", function(d, i) { return !i || i === angle_count - 1 ? -r - 5 : -r; });
			
			var drag = angles.selectAll("path.drag")
							 .data([angle_from, angle_to]);
			drag.enter().append("path")
						.attr("class", "drag")
						.attr("d", "M-9.5,0L-3,3.5L-3,-3.5Z")
						.call(d3.behavior.drag()
						.on("drag", function(d, i) {pathDrag(d,i);})
						.on("dragend", generate));
			drag.attr("transform", function(d) { return "rotate(" + (d + 90) + ")translate(-" + r + ")"; });
			layout.rotate(function() {return scale(~~(Math.random() * angle_count));});
			
			d3.select("#edit-angle-count").property("value", angle_count);
			d3.select("#edit-angle-from").property("value", angle_from);
			d3.select("#edit-angle-to").property("value", angle_to);
		}
		
		function pathDrag(d, i) {
			d = (i ? angle_to : angle_from) + 90;
			var start = [-r * Math.cos(d * radians), -r * Math.sin(d * radians)],
			   m = [d3.event.x, d3.event.y],
			   delta = ~~(Math.atan2(cross(start, m), dot(start, m)) / radians);
			d = Math.max(-90, Math.min(90, d + delta - 90)); // remove this for 360°
			delta = angle_to - angle_from;
			if (i) {
				angle_to = d;
				if (delta > 360) {
					angle_from += delta - 360;
				}
				else if (delta < 0) {
					angle_from = angle_to;
				}
			} else {
				angle_from = d;
				if (delta > 360) {
					angle_to += 360 - delta;
				}
			else if (delta < 0) {
					angle_to = angle_from;
				}
			}
			update();
		}
		
		function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
		function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
		
		function generate() {		
			$('#preview-md-taxonomy').empty()
									 .width(width)
									 .height(height);
			
			fontSize = d3.scale[d3.select("input[name=words_scale]:checked").property("value")]().range([10, 80]);
			if (counts.length) fontSize.domain([+counts[counts.length - 1]|| 1, +counts[0]]);
			terms = words.slice(0, max = Math.min(words.length, +d3.select("#edit-max-words").property("value")));
			terms_counts = counts.slice(0, max = Math.min(counts.length, +d3.select("#edit-max-words").property("value")));
			layout.stop()
				  .words(d3.zip(terms, terms_counts).map(function(d){ return {text: d[0], size: +d[1]};})).start();
		}
		
		function draw(words, bounds) {
			var svg = d3.select('#preview-md-taxonomy').append("svg")
						.attr("width", width)
						.attr("height", height);
			var background = svg.append("g"),
			vis = svg.append("g")
				.attr("transform", "translate(" + [width >> 1, height >> 1] + ")"); 
			scale = bounds ? Math.min(
		    		width / Math.abs(bounds[1].x - width / 2),
		    		width / Math.abs(bounds[0].x - width / 2),
		    		height / Math.abs(bounds[1].y - height / 2),
		    		height / Math.abs(bounds[0].y - height / 2)) / 2 : 1;
		    		
    		var text = vis.selectAll("text")
    			.data(words, function(d) { return d.text.toLowerCase(); });
    		
    		text.transition()
    			.duration(1000)
    			.attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
    			.style("font-size", function(d) { return d.size + "px"; });
    		text.enter().append("text")
    			.attr("text-anchor", "middle")
    			.attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
    			.style("font-size", function(d) { return d.size + "px"; })
    			.on("click", function(d) {load_term_page(d.text);})
    			.transition()
    			.duration(1000);
    		text.style("font-family", function(d) { return d.font; })
    			.style("fill", function(d) { return fill(d.text.toLowerCase()); })
    			.text(function(d) { return d.text; });
    		var exitGroup = background.append("g").attr("transform", 
    			vis.attr("transform"));
    		var exitGroupNode = exitGroup.node();
    		text.exit().each(function() {
    			exitGroupNode.appendChild(this);
    		});
    		exitGroup.transition()
    			.duration(1000)
    			.style("opacity", 1e-6)
    			.remove();
			vis.transition()
    			.delay(1000)
    			.duration(750)
    			.attr("transform", "translate(" + [width >> 1, height >> 1] + ")scale(" + scale + ")");
		  }
	}
};
})(jQuery);