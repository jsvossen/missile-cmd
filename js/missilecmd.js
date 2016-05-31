(function($) {

	$.missileCmd = function() {

//====== CONSTANTS

		var CANVAS_WIDTH = 500;
        var CANVAS_HEIGHT = 450;
        var GROUND = CANVAS_HEIGHT-30;
        var canvasElement = $("<canvas width='" + CANVAS_WIDTH + "' height='" + CANVAS_HEIGHT + "'></canvas>");
		var canvas = canvasElement.get(0).getContext("2d");

//====== INVENTORY

		var userMissiles = [];
		var enemyMissiles = [];
		var bases = [
			new Base(0),
			new Base((CANVAS_WIDTH/2)-35),
        	new Base(CANVAS_WIDTH-70)
		];
		var cities = [ new City(80), new City(129), new City(177),
					  new City(295), new City(344), new City(392) ];

//====== GROUND

		function drawGround() {
			canvas.fillStyle = 'yellow'; 
			canvas.fillRect(0,GROUND,CANVAS_WIDTH,GROUND); 
		}

//====== CITIES		

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

//====== BASE/SILO

		function Base(x) {
			this.missiles = 10;
			this.destroyed = false;
			this.x = x;
			this.mid = this.x+35;
		}

		Base.prototype.height = 25;
		Base.prototype.draw = function() {
			var c = canvas;
			c.beginPath();
			c.moveTo(this.x,GROUND);
			c.lineTo(this.x+20,GROUND-this.height);
			c.lineTo(this.x+50,GROUND-this.height);
			c.lineTo(this.x+70,GROUND);
			c.fillStyle = 'yellow';
			c.fill();
			c.closePath();
			c.fillStyle = 'blue';
			c.font = "12px sans-serif";
			var txtW = c.measureText(this.missiles).width;
			c.fillText(this.missiles,this.mid-(txtW/2),GROUND-5);
		}

//====== MISSILES

		function Missile(toX,toY) {
			this.toX = toX;
			this.toY = toY;
			this.oX = CANVAS_WIDTH/2;
			this.oY = GROUND-Base.prototype.height;
			this.amount = 0;
			this.status = 'active';
		}

		Missile.prototype.draw = function() {
			var c = canvas;
			if (this.status == 'active') {
				this.amount += 0.05;
				if (this.amount > 1) this.amount = 1;
				dx = this.oX + (this.toX - this.oX) * this.amount;
				dy = this.oY + (this.toY - this.oY) * this.amount;
				c.beginPath();
				c.moveTo(this.oX,this.oY);
				c.lineTo(dx,dy);
				c.strokeStyle = "dodgerblue";
				c.lineWidth = 1;
				c.stroke();
				c.closePath();
				c.fillRect(dx-1,dy-1,2,2);
				c.fillStyle = 'yellow';
				c.fill();
				if (dx == this.toX && dy == this.toY && this.amount == 1) { 
					this.status = 'exploding';
					this.amount = 0;
				}
			} else if (this.status == 'exploding') {
				this.amount += 0.75;
				if (this.amount >= 30) {
					this.status = 'imploding';
				} else {
					this.explode();
				}
			} else {
				this.amount -= 0.75;
				if (this.amount < 0) {
					this.status = false;
					i = userMissiles.indexOf(this);
					userMissiles.splice(i,1);
				} else {
					this.explode();
				}
			}
		}

		Missile.prototype.explode = function() {
			var c = canvas;
			c.beginPath();
			c.arc(this.toX,this.toY,this.amount,0,2*Math.PI);
			c.fillStyle = 'white';
			c.fill();
			c.closePath();
		}

		function getClosestSilo(x) {
			var silo;
			var minDist = 999;
			$.each(bases,function(i){
				if (this.missiles > 0) {
					var dist = Math.abs(this.mid - x);
					if (dist < minDist) {
						silo = this;
						minDist = dist;
					}
				}
			});
			return silo;
		}

//====== RENDER LOOP

		function animLoop() {
			requestAnimFrame(animLoop);
			canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			$.each(userMissiles,function(i){
				if (this.status) this.draw();
			});
			$.each(bases,function(i){
				if (!this.destroyed) this.draw();
			});
			$.each(cities,function(i){
				if (!this.destroyed) this.draw();
			});
			drawGround();
		}

//====== INIT GAME / EVENT LISTENERS

        return {
        	init: function() {
        		canvasElement.appendTo('main');
        		$(canvasElement).click(function(e){
        			var coordX = e.pageX - $(this).offset().left;
        			var coordY = e.pageY - $(this).offset().top;
        			var silo = getClosestSilo(coordX);
        			if (silo && coordY < GROUND-60) {
        				var m = new Missile(coordX, coordY);
        				m.oX = silo.mid;
        				silo.missiles--;
        				userMissiles.push(m);
        			}
        		});
        		requestAnimFrame(animLoop);
        	}
        }

	}

})(jQuery);