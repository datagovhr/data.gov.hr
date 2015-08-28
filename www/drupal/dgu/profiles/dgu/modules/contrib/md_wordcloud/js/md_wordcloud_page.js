(function($){
	Drupal.behaviors.md_wordcloud_page = {
		attach: function(){
			var w = $('#page-terms').width();
			var h = w;
			
			var page_data = Drupal.settings.page_data;
			var fill = d3.scale.category20();
			var cloud;
			
			var words = page_data.words,
			counts = page_data.counts,
			angle_from = +page_data.angle_from,
			angle_to = +page_data.angle_to,
			angle_count = +page_data.angle_count,
			words_scale = page_data.words_scale;
		
			var fontSize = d3.scale[words_scale]().range([10, 80]);
			if (counts.length) {
				fontSize.domain([+counts[counts.length - 1]|| 1, +counts[0]]);
			}
			var scale = d3.scale.linear();
			scale.domain([0, +angle_count - 1])
				 .range([angle_from, angle_to]);
			cloud = d3.layout.cloud()
				.words(d3.zip(words, counts).map(function(d){ return {text: d[0], size: +d[1]};}))
				.timeInterval(10)
				.size([w, h])
				.rotate(function(){return scale(~~(Math.random() * angle_count));})
			    .font("Impact")
			    .fontSize(function(d) { return fontSize(+d.size); })
			    .on("end", draw)
			    .start();

			function draw(words, bounds) {
				var svg = d3.select('#page-terms').append("svg")
							.attr("width", w)
							.attr("height", h);
				var background = svg.append("g"),
				vis = svg.append("g")
					.attr("transform", "translate(" + [w >> 1, w >> 1] + ")"); 
				scale = bounds ? Math.min(
			    		w / Math.abs(bounds[1].x - w / 2),
			    		w / Math.abs(bounds[0].x - w / 2),
			    		h / Math.abs(bounds[1].y - h / 2),
			    		h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;
			    		
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
	    			.attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")");
			  }
			
			function load_term_page(term) {
				var url = '';
				block_terms_url = page_data.terms_url;
				url = block_terms_url[term];
				
				if (url){
					window.location = url;
				}	
			}
		}
	};
	
})(jQuery);