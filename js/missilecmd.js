(function($) {

	$.missileCmd = function() {

//====== CONSTANTS

		var CANVAS_WIDTH = 500;
        var CANVAS_HEIGHT = 450;
        var GROUND = CANVAS_HEIGHT-30;
        var canvasElement = $('<canvas width="' + CANVAS_WIDTH + '" height="' + CANVAS_HEIGHT + '"></canvas>');
		var ctx = canvasElement.get(0).getContext('2d');

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
			// show missile count
			ctx.fillStyle = 'blue';
			ctx.font = '12px sans-serif';
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
			this.radius = 0; // explosion radius
			this.status = 'active';
			this.color = 'dodgerblue';
			this.dist = Math.sqrt(Math.pow(this.toX-this.oX,2)+Math.pow(this.toY-this.oY,2));
			this.speedX = (this.toX-this.oX)/(this.dist/10);
			this.speedY = (this.toY-this.oY)/(this.dist/10);
		}

		function EnemyMissile(target,oX) {
			this.target = target;
			Missile.call(this,target.mid,GROUND,oX);
			this.delay = 0;
			this.oY = 0;
			this.dy = 0;
			this.color = 'red';
			this.speedX = (this.toX-this.oX)/(this.dist+480);
			this.speedY = (this.toY-this.oY)/(this.dist+480);
		}
		EnemyMissile.prototype = Object.create(Missile.prototype);
		EnemyMissile.prototype.constructor = Missile;

		Missile.prototype.draw = function() {
			// stagger enemy missile launch
			if (this instanceof EnemyMissile) {
				if (this.delay > 0 )  { this.delay -= 0.04; return false; }
			}
			// increment missile trajectory 
			if (this.status == 'active') {
				this.dx += this.speedX;
				this.dy += this.speedY;
				// missile trail
				ctx.beginPath();
				ctx.moveTo(this.oX,this.oY);
				ctx.lineTo(this.dx,this.dy);
				ctx.strokeStyle = this.color;
				ctx.lineWidth = 1;
				ctx.stroke();
				ctx.closePath();
				// missile head
				ctx.beginPath();
				ctx.fillStyle = 'yellow';
				ctx.fillRect(this.dx-1,this.dy-1,2,2);
				ctx.fill();
				ctx.closePath();
				// explode if target reached
				if (this instanceof EnemyMissile) {
					if (this.dy >= this.toY) { 
						this.status = 'exploding';
						this.target.destroyed = true;
					}
				} else {
					if (this.dy <= this.toY) { 
						this.status = 'exploding';
					}
				}
			// increase explosion radius if exploding
			} else if (this.status == 'exploding') {
				this.radius += 0.75;
				if (this.radius >= 30) {
					this.status = 'imploding';
				} else {
					this.explode();
				}
			// decrease explosion radius if imploding
			} else {
				this.radius -= 0.75;
				if (this.radius < 0) {
					// unset missile if it's done exploding
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
			// draw explosion
			ctx.beginPath();
			ctx.arc(this.toX,this.toY,this.radius,0,2*Math.PI);
			ctx.fillStyle = 'white';
			ctx.fill();
			ctx.closePath();
			// explode intersecting missiles
			$.each(enemyMissiles,function(i, m){
				if (this.status == 'active' && ctx.isPointInPath(this.dx,this.dy)) {
					level.score += 25;
					this.toX = this.dx;
					this.toY = this.dy;
					this.status = 'exploding'
					this.explode();
				}
			});
		}

//====== MISSILE HELPERS

		// return nearest usable base
		function getClosestSilo(x) {
			var silo;
			var minDist = 999;
			$.each(bases,function(i){
				if (this.missiles > 0 && !this.destroyed) {
					var dist = Math.abs(this.mid - x);
					if (dist < minDist) {
						silo = this;
						minDist = dist;
					}
				}
			});
			return silo;
		}

		// create random enemy missiles
		function spawnMissiles() {
			for (i=0;i<8;i++) {
				var oX = Math.floor((Math.random() * CANVAS_WIDTH));
				var target = randomTarget();
				var m = new EnemyMissile(target,oX);
				m.delay = Math.floor((Math.random() * 5));
				enemyMissiles.push(m);
			}
		}

		// return random city or base
		function randomTarget() {
			var targets = cities.concat(bases);
			var i = Math.floor((Math.random() * targets.length));
			if (targets[i].destroyed) {
				randomTarget();
			} else {
				return targets[i];
			}
		}

//====== LEVEL MANAGER

		var level = {
			lvl: 0,
			score: 0,
			inProgress: false,
			beginNext: function() {
				if (this.lvl > 0) this.score += this.calcBonus()[0]+this.calcBonus()[1];
				this.lvl++;
				this.inProgress = true;
				$.each(bases,function(i){
					this.destroyed = false;
					this.missiles = 10;
				});
				spawnMissiles();
			},
			drawScore: function() {
				ctx.beginPath();
				ctx.fillStyle = 'black';
				ctx.fillRect(0,0,CANVAS_WIDTH,25);
				ctx.fill();
				ctx.closePath();
				ctx.beginPath();
				ctx.fillStyle = 'red';
				ctx.font = 'bold 16px sans-serif';
				ctx.fillText('Score: '+this.score,10,20);
				ctx.closePath();
			},
			calcBonus: function() {
				bonus = [0,0];
				$.each(bases,function(i){
					if (!this.destroyed) bonus[0] += this.missiles*10;
				});
				$.each(cities,function(i){
					if (!this.destroyed) bonus[1] += 100;
				});
				return bonus;
			},
			drawInfoScreen: function() {
				if (this.lvl > 0) {
					ctx.fillStyle = 'royalblue';
					ctx.font = 'bold 20px sans-serif';
					ctx.fillText('Bonus Points:',100,100);

					var mLeft = 'Missiles Left: '+this.calcBonus()[0]/10;
					var mBonus = this.calcBonus()[0];
					ctx.fillStyle = 'red';
					ctx.font = 'bold 18px sans-serif';
					ctx.fillText(mBonus,100,150);
					ctx.font = '18px sans-serif';
					ctx.fillStyle = 'royalblue';
					ctx.fillText(mLeft,160,150);

					var cLeft = 'Cities Left: '+this.calcBonus()[1]/100;
					var cBonus = this.calcBonus()[1];
					ctx.fillStyle = 'red';
					ctx.font = 'bold 18px sans-serif';
					ctx.fillText(cBonus,100,200);
					ctx.font = '18px sans-serif';
					ctx.fillStyle = 'royalblue';
					ctx.fillText(cLeft,160,200);
				}

				ctx.font = '18px sans-serif';
				var prompt = "Click to begin Level " + (this.lvl+1);
				var promptY = (this.lvl > 0) ? 300 : 200;
				var txtW = ctx.measureText(prompt).width;
				ctx.fillStyle = 'aqua';
				ctx.fillText(prompt,(CANVAS_WIDTH-txtW)/2,promptY);
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
			if (level.inProgress) {
				$.each(enemyMissiles,function(i){
					if (this.status) this.draw();
				});
			}
			drawGround();
			level.drawScore();
			if (enemyMissiles.length == 0) {
				level.inProgress = false;
				level.drawInfoScreen();
			}
		}

//====== INIT GAME / EVENT LISTENERS

        return {
        	init: function() {
        		canvasElement.appendTo('main');
        		$(canvasElement).click(function(e){
        			if (!level.inProgress) {
        				level.beginNext();
        			} else {
	        			var coordX = e.pageX - $(this).offset().left;
	        			var coordY = e.pageY - $(this).offset().top;
	        			var silo = getClosestSilo(coordX);
	        			if (silo && coordY < GROUND-55) {
	        				var m = new Missile(coordX, coordY,silo.mid);
	        				silo.missiles--;
	        				userMissiles.push(m);
	        			}
        			}
        		});
        		requestAnimFrame(animLoop);
        	}
        }

	}

})(jQuery);