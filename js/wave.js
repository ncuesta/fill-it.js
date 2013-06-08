/**
 *  Water particles
 *
 *  Originally created by http://hakim.se/
 *  http://hakim.se/experiments/html5/wave/03/
 *
 */


/**
 *
 */
function Wave() {

    /** The current dimensions of the screen (updated on resize) */
    var WIDTH = window.innerWidth;
    var HEIGHT = window.innerHeight;

    /** Wave colours, the index must be from 0 to 1 or in between */
    var WAVE_COLOURS = {
        '0': 'rgba(0,170,187,.2)',
        '1': 'rgba(0,170,187,.4)'
    };

    var BUBBLE_COLOUR = '#rgba(0,200,255,0)';

    /** Wave settings */
    var DENSITY = .75;
    var FRICTION = 1.14;
    var MOUSE_PULL = 0.09; // The strength at which the mouse pulls particles within the AOE
    var AOE = 200; // Area of effect for mouse pull
    var DETAIL = Math.round( WIDTH / 40 ); // The number of particles used to build up the wave
    var WATER_DENSITY = 1.07;
    var AIR_DENSITY = 1.02;
    var TWITCH_INTERVAL = 100; // The interval between random impulses being inserted into the wave to keep it moving

    /** Bubble settings */
    var MAX_BUBBLES = 60; // The maximum number of bubbles visible before FIFO is applied
    var BIG_BUBBLE_DISSOLVE = 20; // How many particles a bubble dissolves into when being clicked
    var SMALL_BUBBLE_DISSOLVE = 6;

    var mouseIsDown = false;
    var full = true;
    var ms = {x:0, y:0}; // Mouse speed
    var mp = {x:0, y:0}; // Mouse position

    var canvas, context, particles, bubbles;

    var timeUpdateInterval, twitchInterval;

    var bar = 0;

    /**
     * Constructor.
     */
    this.Initialize = function( canvasID ) {
        canvas = document.getElementById( canvasID );

        if (canvas && canvas.getContext) {
            context = canvas.getContext('2d');

            particles = [];
            bubbles = [];

            // Generate our wave particles
            for( var i = 0; i < DETAIL+1; i++ ) {
                particles.push( {
                    x: WIDTH / (DETAIL-4) * (i-2), // Pad by two particles on each side
                    y: HEIGHT,
                    original: {x: 0, y: HEIGHT},
                    velocity: {x: 0, y: Math.random()*90}, // Random for some initial movement in the wave
                    force: {x: 0, y: 0},
                    mass: 10 // This controls the 'lightness' of the water particles,
                    // a close to zero number will make water "jump" off the screen
                } );
            }

            $(canvas).mousemove(MouseMove);
            $(canvas).mousedown(MouseDown);
            $(canvas).mouseup(MouseUp);
            $(window).resize(ResizeCanvas);

            tidalInterval = setInterval( TidalRise, 1000 );
            timeUpdateInterval = setInterval( TimeUpdate, 40 );
            twitchInterval = setInterval( Twitch, TWITCH_INTERVAL );

            CreateBubble();


            ResizeCanvas();

        }
    };

    /**
     * Decrements the bar so the liquid rises.
     */
    function TidalRise(){
        if( !full ) {
            bar -= 10;
        } else {
            clearInterval(tidalInterval);
        }
    }

    /**
     * Inserts a random impulse to keep the wave moving.
     * Impulses are only inserted if the mouse is not making
     * quick movements.
     */
    function Twitch() {
        if( ms.x < 6 || ms.y < 6 ) {
            var forceRange = 5; // -value to +value
            InsertImpulse( Math.random() * WIDTH, (Math.random()*(forceRange*2)-forceRange ) );
        }
        if(bar < 50 && Math.random() * 10 > 5){
            CreateBubble();
        }
    }

    /**
     * Inserts an impulse in the wave at a specific position.
     *
     * @param positionX the x coordinate where the impulse
     * should be inserted
     * @param forceY the force to insert
     */
    function InsertImpulse( positionX, forceY ) {
        var particle = particles[Math.round( positionX / WIDTH * particles.length )];

        if( particle ) {
            particle.force.y += forceY;
        }
    }

    /**
     *
     */
    function TimeUpdate(e) {

        var gradientFill = context.createLinearGradient(WIDTH*.5,HEIGHT*.2,WIDTH*.5,HEIGHT);
        for(var colorStop in WAVE_COLOURS){
            gradientFill.addColorStop(colorStop, WAVE_COLOURS[colorStop]);
        }

        if(!full) {
            particles[0].y += bar;
        }

        context.clearRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = gradientFill;
        context.beginPath();
        context.moveTo(particles[0].x, particles[0].y);

        var len = particles.length;
        var i;

        var current, previous, next;

        for( i = 1; i < len -1; i++ ) {
            if(!full) {
                particles[i].original.y += bar
            }
        }

        for( i = 0; i < len; i++ ) {
            current = particles[i];
            previous = particles[i-1];
            next = particles[i+1];

            if (previous && next) {
                var forceY = 0;

                forceY += -DENSITY * ( previous.y - current.y );
                forceY += DENSITY * ( current.y - next.y );
                forceY += DENSITY/15 * ( current.y - current.original.y );

                current.velocity.y += - ( forceY / current.mass ) + current.force.y;
                current.velocity.y /= FRICTION;
                current.force.y /= FRICTION;
                current.y += current.velocity.y;

                var distance = DistanceBetween( mp, current );

                if( distance < AOE ) {
                    var distance = DistanceBetween( mp, {x:current.original.x, y:current.original.y} );

                    ms.x = ms.x * .98;
                    ms.y = ms.y * .98;

                    current.force.y += (MOUSE_PULL * ( 1 - (distance / AOE) )) * ms.y;
                }

                // cx, cy, ax, ay
                context.quadraticCurveTo(previous.x, previous.y, previous.x + (current.x - previous.x) / 2, previous.y + (current.y - previous.y) / 2);
            }

        }

        if(!full) {
            particles[particles.length-1].y += bar;
        }

        context.lineTo(particles[particles.length-1].x, particles[particles.length-1].y);
        context.lineTo(WIDTH, HEIGHT);
        context.lineTo(0, HEIGHT);
        context.lineTo(particles[0].x, particles[0].y);

        full = particles[0].y < HEIGHT * .2;

        context.fill();

        len = bubbles.length;

        context.fillStyle = BUBBLE_COLOUR;

        context.beginPath();

        var b, p, d;

        for (i = 0; i < len; i++) {
            var b = bubbles[i];
            var p = GetClosestParticle( b );
            var d = DistanceBetween( mp, b );

            b.velocity.y /= ( b.y > p.y ) ? WATER_DENSITY : AIR_DENSITY;
            b.velocity.y += ( p.y > b.y ) ? 1/b.mass : -((b.y-p.y)*0.01)/b.mass;
            b.y += b.velocity.y;


            if( b.x > WIDTH - b.currentSize ) b.velocity.x = -b.velocity.x;
            if( b.x < b.currentSize ) b.velocity.x = Math.abs(b.velocity.x);

            b.velocity.x /= 1.04;
            b.velocity.x = b.velocity.x < 0 ? Math.min( b.velocity.x, -.8/b.mass ) : Math.max( b.velocity.x, .8/b.mass )
            b.x += b.velocity.x;

            if( d < AOE ) {
                // The bubble is within the AOE, apply horizontal mouse pull relative to distance
                //b.velocity.x += MOUSE_PULL * ( ( AOE - d ) / AOE * b.mass ) * ms.x;
            }


            //if(b.y < p.y){
            //b.dissolved = true;
            //}


            if( b.dissolved == false ) {
                context.moveTo(b.x,b.y);
                context.arc(b.x,b.y,b.currentSize,0,Math.PI*2,true);
            }
            else {
                b.velocity.x /= 1.15;
                b.velocity.y /= 1.05;

                while( b.children.length < b.dissolveSize ) {
                    b.children.push( { x:0, y:0, size: Math.random()*b.dissolveSize, velocity: { x: (Math.random()*20)-10, y: -(Math.random()*10) } } );
                }

                for( var j = 0; j < b.children.length; j++ ) {
                    var c = b.children[j];
                    c.x += c.velocity.x;
                    c.y += c.velocity.y;
                    c.velocity.x /= 1.1;
                    c.velocity.y += 0.4;
                    c.size /= 1.1;

                    context.moveTo(b.x+c.x,b.y+c.y); // needed in ff
                    context.arc(b.x+c.x,b.y+c.y,c.size,0,Math.PI*2,true);
                }

            }

        }

        context.fill();
    }

    /**
     *
     */
    function GetClosestParticle(point){
        var closestIndex = 0;
        var closestDistance = 1000;

        var len = particles.length;

        for( var i = 0; i < len; i++ ) {
            var thisDistance = DistanceBetween( particles[i], point );

            if( thisDistance < closestDistance ) {
                closestDistance = thisDistance;
                closestIndex = i;
            }

        }

        return particles[closestIndex];
    }

    /**
     *
     */
    function CreateBubble() {
        if( bubbles.length > MAX_BUBBLES ) {
            var i = 0;

            if( bubbles[i].dissolved ) {
                // Find a bubble thats not already on its way to dissolving
                for( ; i < bubbles.length; i++ ) {
                    if( bubbles[i].dissolved == false ) {
                        bubbles[i].dissolveSize = SMALL_BUBBLE_DISSOLVE;
                        DissolveBubble( i );
                        break;
                    }
                }
            }
            else {
                DissolveBubble( i );
            }

        }

        var minSize = 15;
        var maxSize = 30;
        var size = minSize + Math.random() * ( maxSize - minSize );
        var catapult = 30;

        var b = {
            x: maxSize + ( Math.random() * ( WIDTH - maxSize ) ),
            y: HEIGHT,
            velocity: {x: (Math.random()*catapult)-catapult/2,y: 0},
            size: size,
            mass: (size / maxSize)+1,
            dissolved: false,
            dissolveSize: BIG_BUBBLE_DISSOLVE,
            children: []
        };

        b.currentSize = b.size;

        bubbles.push(b);
    }

    function DissolveBubble( index ) {
        var b = bubbles[index];

        if( b.dissolved == false ) {
            b.dissolved = true;

            setTimeout( function() {
                for( var i = 0; i < bubbles.length; i++ ) {
                    if( bubbles[i] == b ) {
                        bubbles.splice(i,1);
                        break;
                    }
                }

            }, 2000 );
        }
    }

    /**
     *
     */
    function MouseMove(e) {
//        ms.x = Math.max( Math.min( e.layerX - mp.x, 40 ), -40 );
//        ms.y = Math.max( Math.min( e.layerY - mp.y, 40 ), -40 );

        ms.x = Math.max( Math.min( e.pageX - mp.x, 40 ), -40 );
        ms.y = Math.max( Math.min( e.pageY - mp.y, 40 ), -40 );

        //console.log(e, Math.max( Math.min( e.layerX - mp.x, 40 ), -40 ), Math.min( e.layerX - mp.x, 40 ),  e.layerX - mp.x,e.layerX);
        mp.x = e.pageX;
        mp.y = e.pageY;

    }

    function MouseDown(e) {
        mouseIsDown = true;

        var len = bubbles.length;

        var closestIndex = 0;
        var closestDistance = 1000;

        for( var i = 0; i < len; i++ ) {
            var thisDistance = DistanceBetween( bubbles[i], mp );

            if( thisDistance < closestDistance ) {
                closestDistance = thisDistance;
                closestIndex = i;
            }

        }

        if (bubbles.length && closestDistance < 150) {
            console.log("Bubble bubble");
        }
    }

    function MouseUp(e) {
        mouseIsDown = false;
    }

    /**
     *
     */
    function ResizeCanvas(e) {
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;

        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        for( var i = 0; i < DETAIL+1; i++ ) {
            particles[i].x = WIDTH / (DETAIL-4) * (i-2);
            particles[i].y = HEIGHT;

            particles[i].original.x = particles[i].x;
            particles[i].original.y = particles[i].y;
        }
    }

    /**
     *
     */
    function DistanceBetween(p1,p2) {
        var dx = p2.x-p1.x;
        var dy = p2.y-p1.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

}