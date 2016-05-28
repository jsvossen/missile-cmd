(function($) {

	$.missileCmd = function() {

		var CANVAS_WIDTH = 500;
        var CANVAS_HEIGHT = 450;
        var canvasElement = $("<canvas width='" + CANVAS_WIDTH + "' height='" + CANVAS_HEIGHT + "'></canvas>");
		var canvas = canvasElement.get(0).getContext("2d");

		var userMissiles = []

		function Missile(toX,toY) {
			this.toX = toX;
			this.toY = toY;
			this.oX = CANVAS_WIDTH/2;
			this.oY = CANVAS_HEIGHT;
			this.amount = 0;
		}

		Missile.prototype.draw = function() {
			var c = canvas;
			this.amount += 0.05;
			if (this.amount > 1) this.amount = 1;
			c.moveTo(this.oX,this.oY);
			dx = this.oX + (this.toX - this.oX) * this.amount;
			dy = this.oY + (this.toY - this.oY) * this.amount;
			c.lineTo(dx,dy);
			c.strokeStyle = "dodgerblue";
			c.lineWidth = 1;
			c.stroke();
		}

		function animLoop() {
			requestAnimFrame(animLoop);
			canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			$.each(userMissiles,function(i){
				this.draw();
			});
		}


        return {
        	init: function() {
        		canvasElement.appendTo('main');
        		$(canvasElement).click(function(e){
        			var m = new Missile(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top);
        			userMissiles.push(m);
        		});
        		requestAnimFrame(animLoop);
        	}
        }

	}

})(jQuery);