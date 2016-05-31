(function($) {

	$.missileCmd = function() {

//====== CONSTANTS

		var CANVAS_WIDTH = 500;
        var CANVAS_HEIGHT = 450;
        var GROUND = CANVAS_HEIGHT-30;
        var canvasElement = $("<canvas width='" + CANVAS_WIDTH + "' height='" + CANVAS_HEIGHT + "'></canvas>");
		var ctx = canvasElement.get(0).getContext("2d");

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
			ctx.fillStyle = 'yellow'; 
			ctx.fillRect(0,GROUND,CANVAS_WIDTH,GROUND); 
		}

//====== CITIES		

		function City(x) {
			this.destroyed = false;
			this.x = x;
		}

		City.prototype.draw = function() {
			var h = 10;
			var w = 28;
			ctx.fillStyle = 'aqua';
			ctx.fillRect(this.x,GROUND-h,w,h);
			ctx.beginPath();
			ctx.moveTo(this.x+(w/2)-5,GROUND-h);
			ctx.lineTo(this.x+(w/2), GROUND-h-5);
			ctx.lineTo(this.x+(w/2)+5,GROUND-h);
			ctx.closePath();
			ctx.fill();
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
			ctx.beginPath();
			ctx.moveTo(this.x,GROUND);
			ctx.lineTo(this.x+20,GROUND-this.height);
			ctx.lineTo(this.x+50,GROUND-this.height);
			ctx.lineTo(this.x+70,GROUND);
			ctx.fillStyle = 'yellow';
			ctx.fill();
			ctx.closePath();
			ctx.fillStyle = 'blue';
			ctx.font = "12px sans-serif";
			var txtW = ctx.measureText(this.missiles).width;
			ctx.fillText(this.missiles,this.mid-(txtW/2),GROUND-5);
		}

//====== MISSILES

		function Missile(toX,toY) {
			this.toX = toX; //target X
			this.toY = toY; //target Y
			this.oX = CANVAS_WIDTH/2; //origin X
			this.oY = GROUND-Base.prototype.height; //originY
			this.dx = this.oX; //delta X
			this.dy = this.oY; //delta Y
			this.amount = 0;
			this.status = 'active';
			this.color = 'dodgerblue';
			this.speed = 0.05;
		}

		function EnemyMissile(toX) {
			 Missile.call(this,toX,GROUND);
			 this.oY = 0;
			 this.color = 'red';
			 this.speed = 0.001;
		}
		EnemyMissile.prototype = Object.create(Missile.prototype);
		EnemyMissile.prototype.constructor = Missile;

		Missile.prototype.draw = function() {
			if (this.status == 'active') {
				this.amount += this.speed;
				if (this.amount > 1) this.amount = 1;
				this.dx = this.oX + (this.toX - this.oX) * this.amount;
				this.dy = this.oY + (this.toY - this.oY) * this.amount;
				ctx.beginPath();
				ctx.moveTo(this.oX,this.oY);
				ctx.lineTo(this.dx,this.dy);
				ctx.strokeStyle = this.color;
				ctx.lineWidth = 1;
				ctx.stroke();
				ctx.closePath();
				ctx.fillRect(this.dx-1,this.dy-1,2,2);
				ctx.fillStyle = 'yellow';
				ctx.fill();
				if (this.dx == this.toX && this.dy == this.toY && this.amount == 1) { 
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
			ctx.beginPath();
			ctx.arc(this.toX,this.toY,this.amount,0,2*Math.PI);
			$.each(enemyMissiles,function(i, m){
				if (this.status == "active" && ctx.isPointInPath(this.dx,this.dy)) {
					this.toX = this.dx;
					this.toY = this.dy;
					this.amount = 0;
					this.status = 'exploding'
					this.explode();
				}
			});
			ctx.fillStyle = 'white';
			ctx.fill();
			ctx.closePath();
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

		function spawnMissiles() {
			for (i=0;i<8;i++) {
				var x = Math.floor((Math.random() * CANVAS_WIDTH));
				var y = Math.floor((Math.random() * 50))*-1;
				var toX = Math.floor((Math.random() * CANVAS_WIDTH));
				var m = new EnemyMissile(toX);
				m.oX = x;
				m.oY = y;
				enemyMissiles.push(m);
			}
		}

//====== RENDER LOOP

		function animLoop() {
			requestAnimFrame(animLoop);
			ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			$.each(enemyMissiles,function(i){
				if (this.status) this.draw();
			});
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
        		spawnMissiles();
        		requestAnimFrame(animLoop);
        	}
        }

	}

})(jQuery);