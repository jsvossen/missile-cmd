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
			this.mid = this.x+16;
		}

		City.prototype.draw = function() {
			var h = 10;
			var w = 28;
			ctx.beginPath();
			ctx.fillStyle = 'aqua';
			ctx.fillRect(this.x,GROUND-h,w,h);
			ctx.moveTo(this.x+(w/2)-5,GROUND-h);
			ctx.lineTo(this.x+(w/2), GROUND-h-5);
			ctx.lineTo(this.x+(w/2)+5,GROUND-h);
			ctx.fill();
			ctx.closePath();
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
			ctx.beginPath();
			ctx.fillStyle = 'blue';
			ctx.font = "12px sans-serif";
			var txtW = ctx.measureText(this.missiles).width;
			ctx.fillText(this.missiles,this.mid-(txtW/2),GROUND-5);
			ctx.closePath();
		}

//====== MISSILES

		function Missile(toX,toY,oX) {
			this.toX = toX; //target X
			this.toY = toY; //target Y
			this.oX = oX; //origin X
			this.oY = GROUND-Base.prototype.height; //originY
			this.dx = oX; //delta X
			this.dy = this.oY; //delta Y
			this.amount = 0;
			this.status = 'active';
			this.color = 'dodgerblue';
			this.dist = Math.sqrt(Math.pow(this.toX-this.oX,2)+Math.pow(this.toY-this.oY,2));
			this.speedX = (this.toX-this.oX)/(this.dist/10);
			this.speedY = (this.toY-this.oY)/(this.dist/10);
		}

		function EnemyMissile(toX,oX,oY) {
			Missile.call(this,toX,GROUND,oX);
			this.delay = 0;
			this.oY = oY;
			this.dy = oY;
			this.color = 'red';
			this.speedX = (this.toX-this.oX)/(this.dist+480);
			this.speedY = (this.toY-this.oY)/(this.dist+480);
		}
		EnemyMissile.prototype = Object.create(Missile.prototype);
		EnemyMissile.prototype.constructor = Missile;

		Missile.prototype.draw = function() {
			if (this instanceof EnemyMissile) {
				if (this.delay > 0 )  { this.delay -= 0.04; return false; }
			}
			if (this.status == 'active') {
				this.dx += this.speedX;
				this.dy += this.speedY;
				ctx.beginPath();
				ctx.moveTo(this.oX,this.oY);
				ctx.lineTo(this.dx,this.dy);
				ctx.strokeStyle = this.color;
				ctx.lineWidth = 1;
				ctx.stroke();
				ctx.closePath();
				ctx.beginPath();
				ctx.fillStyle = 'yellow';
				ctx.fillRect(this.dx-1,this.dy-1,2,2);
				ctx.fill();
				ctx.closePath();
				if (this instanceof EnemyMissile) {
					if (this.dy >= this.toY) { 
						this.status = 'exploding';
						this.amount = 0;
					}
				} else {
					if (this.dy <= this.toY) { 
						this.status = 'exploding';
						this.amount = 0;
					}
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
					if (this instanceof EnemyMissile) {
						i = enemyMissiles.indexOf(this);
						enemyMissiles.splice(i,1);
					} else {
						i = userMissiles.indexOf(this);
						userMissiles.splice(i,1);
					}
				} else {
					this.explode();
				}
			}
		}

		Missile.prototype.explode = function() {
			ctx.beginPath();
			ctx.arc(this.toX,this.toY,this.amount,0,2*Math.PI);
			ctx.fillStyle = 'white';
			ctx.fill();
			ctx.closePath();
			$.each(enemyMissiles,function(i, m){
				if (this.status == 'active' && ctx.isPointInPath(this.dx,this.dy)) {
					this.toX = this.dx;
					this.toY = this.dy;
					this.amount = 0;
					this.status = 'exploding'
					this.explode();
				}
			});
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
				var toX = randomTarget().mid;
				var oX = Math.floor((Math.random() * CANVAS_WIDTH));
				var m = new EnemyMissile(toX,oX,0);
				m.delay = Math.floor((Math.random() * 5));
				enemyMissiles.push(m);
				console.log(m.speedX,m.speedY);
			}
		}
		function randomTarget() {
			var targets = $.merge( cities, bases );
			var i = Math.floor((Math.random() * targets.length));
			if (targets[i].destroyed) {
				randomTarget();
			} else {
				return targets[i];
			}
		}

//====== RENDER LOOP

		function animLoop() {
			requestAnimFrame(animLoop);
			ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			$.each(userMissiles,function(i){
				if (this.status) this.draw();
			});
			$.each(cities,function(i){
				if (!this.destroyed) this.draw();
			});
			$.each(bases,function(i){
				if (!this.destroyed) this.draw();
			});
			$.each(enemyMissiles,function(i){
				if (this.status) this.draw();
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
        				var m = new Missile(coordX, coordY,silo.mid);
        				silo.missiles--;
        				userMissiles.push(m);
        				console.log(m);
        			}
        		});
        		spawnMissiles();
        		requestAnimFrame(animLoop);
        	}
        }

	}

})(jQuery);