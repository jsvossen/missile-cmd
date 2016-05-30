(function($) {

	$.missileCmd = function() {

		var CANVAS_WIDTH = 500;
        var CANVAS_HEIGHT = 450;
        var GROUND = CANVAS_HEIGHT-30;
        var canvasElement = $("<canvas width='" + CANVAS_WIDTH + "' height='" + CANVAS_HEIGHT + "'></canvas>");
		var canvas = canvasElement.get(0).getContext("2d");

		var userMissiles = [];
		var bases = [
			new Base(0),
			new Base((CANVAS_WIDTH/2)-35),
        	new Base(CANVAS_WIDTH-70)
		];
		var cities = [ new City(80), new City(129), new City(177),
					  new City(295), new City(344), new City(392) ];

		function drawGround() {
			canvas.fillStyle = 'yellow'; 
			canvas.fillRect(0,GROUND,CANVAS_WIDTH,GROUND); 
		}

		function City(x) {
			this.destroyed = false;
			this.x = x;
		}

		City.prototype.draw = function() {
			var c = canvas;
			var h = 10;
			var w = 28;
			c.fillStyle = 'aqua';
			c.fillRect(this.x,GROUND-h,w,h);
			c.beginPath();
			c.moveTo(this.x+(w/2)-5,GROUND-h);
			c.lineTo(this.x+(w/2), GROUND-h-5);
			c.lineTo(this.x+(w/2)+5,GROUND-h);
			c.closePath();
			c.fill();
		}

		function Base(x) {
			this.missiles = 10;
			this.destroyed = false;
			this.x = x;
		}

		Base.prototype.height = 25;
		Base.prototype.draw = function() {
			var c = canvas;
			c.beginPath();
			c.moveTo(this.x,GROUND);
			c.lineTo(this.x+20,GROUND-this.height);
			c.lineTo(this.x+50,GROUND-this.height);
			c.lineTo(this.x+70,GROUND);
			c.closePath();
			c.fillStyle = 'yellow';
			c.fill();
		}

		function Missile(toX,toY) {
			this.toX = toX;
			this.toY = toY;
			this.oX = CANVAS_WIDTH/2;
			this.oY = GROUND-Base.prototype.height;
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
			drawGround();
			$.each(userMissiles,function(i){
				this.draw();
			});
			$.each(bases,function(i){
				if (!this.destroyed) this.draw();
			});
			$.each(cities,function(i){
				if (!this.destroyed) this.draw();
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