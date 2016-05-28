(function($) {

	$.missileCmd = function() {

		var CANVAS_WIDTH = 500;
        var CANVAS_HEIGHT = 450;
        var canvasElement = $("<canvas width='" + CANVAS_WIDTH + "' height='" + CANVAS_HEIGHT + "'></canvas>");
		var canvas = canvasElement.get(0).getContext("2d");

		function Missile(toX,toY) {
			this.toX = toX;
			this.toY = toY;
			this.oX = CANVAS_WIDTH/2;
			this.oY = CANVAS_HEIGHT;
		}

		Missile.prototype.draw = function() {
			var c = canvas;
			c.moveTo(this.oX,this.oY);
			c.lineTo(this.toX,this.toY);
			c.strokeStyle = "dodgerblue";
			c.lineWidth = 1;
			c.stroke();
		}


        return {
        	init: function() {
        		canvasElement.appendTo('main');
        		$(canvasElement).click(function(e){
        			var m = new Missile(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top);
        			m.draw();
        		});
        	}
        }

	}

})(jQuery);