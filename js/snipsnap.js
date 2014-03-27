'use strict'

window.addEventListener( 'load', function() {

    (function(){

        if(!window.Prism) {
            console.log( 'no prism')
            return;
        }

        for (var language in Prism.languages) {
            var tokens = Prism.languages[language];
            
            tokens.tab = /\t/g;
            tokens.lf = /\n/g;
            tokens.cr = /\r/g;
        }

    })();

    init();
    animate();
    textarea.value = 'Welcome to SnipSnap!\n\nType or paste any code here\nPick a language and a theme from the menu\nClick "Toggle editor" to interact and change perspective\nClick "Snap Snippet" to download a snapshot!\n\nThanks to @leaverou and contributors for prism.js,\n@mrdoob and contributors for three.js, and @mdo and @fat for Bootstrap\n\nEnjoy!';
    importCSS( 'prism-default.css', updateCode );

});

var renderer, scene, camera, fov = 180, plane;

var lon = 0, onPointerDownPointerX = 0, onPointerDownLon = 0,
    lat = 0, onPointerDownPointerY = 0, onPointerDownLat = 0,
    nLon = -10, nLat = -20, nFov = 90,
    phi = 0, theta = 0,
    distance = 500, nDistance = 300,
    isUserInteracting = false;

var canvas = document.createElement( 'canvas' ),
    ctx = canvas.getContext( '2d' );

document.body.appendChild( canvas );

var textarea = document.querySelector( '#editorContainer textarea' );
var scale = 2;
var codeSnippe = document.getElementById( 'codeSnippet' );

textarea.addEventListener( 'change', function( e ) {

    updateCode();
    e.preventDefault();

} );

textarea.addEventListener( 'keydown', function( e ) {

    var keyCode = e.keyCode || e.which;

    if (keyCode == 9) {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;

        this.value = this.value.substring( 0, start )
                    + "\t"
                    + this.value.substring( end );

        this.selectionStart =
        this.selectionEnd = start + 1;
    }

} );

function importCSS( url, callback ){

    /*var element = document.createElement('link');
    element.href = url;
    element.rel = 'stylesheet';
    element.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(element);*/

    var oReq = new XMLHttpRequest();
    oReq.onload = function() {
        var content = oReq.responseText;
        var el = document.getElementById( 'prismTheme' );
        if( !el ) {
            el = document.createElement( 'style' );
            el.setAttribute( 'id', 'prismTheme' );
            document.getElementsByTagName( 'head' )[ 0 ].appendChild( el );
        }
        el.textContent = content;
        if( callback ) callback();
    }.bind( this );
    oReq.open( 'get', 'prism/' + url, true );
    oReq.send();

}

textarea.addEventListener( 'keyup', function( e ) {

    updateCode();

} );

[].forEach.call( document.querySelectorAll( '#languageDropdown li a' ), function( el ) {

    el.addEventListener( 'click', function( e ) {

        var l = this.getAttribute( 'data-language' );
        console.log( l );
        codeSnippet.className = 'language-' + l;
        codeSnippet.parentElement.className = 'language-' + l;
        updateCode();

        document.querySelector( '#languageDropdown a.dropdown-toggle' ).innerHTML = 'Language (' + this.textContent + ') <b class="caret"></b>';
        e.preventDefault();

    });

});

[].forEach.call( document.querySelectorAll( '#themeDropdown li a' ), function( el ) {

    el.addEventListener( 'click', function( e ) {

        var t = this.getAttribute( 'data-theme' );
        console.log( t );
        importCSS( 'prism-' + t + '.css', updateCode );

        document.querySelector( '#themeDropdown a.dropdown-toggle' ).innerHTML = 'Theme (' + this.textContent + ') <b class="caret"></b>';
        e.preventDefault();

    } );

} );

var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor );

document.getElementById( 'snapshotBtn' ).addEventListener( 'click', function( e ) {

    var canvas = renderer.domElement;
    var link = this;

    /*if( isSafari ) {
        var data = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        link.setAttribute( 'href', data );
    } else {
        canvas.toBlob( function(blob) {
            var url;
            if( window.webkitURL ) {
                url = window.webkitURL.createObjectURL( blob );
            } else {
                url = URL.createObjectURL(blob);
            }
            link.setAttribute( 'download', name );
            link.setAttribute( 'href', url );
        } );
    }*/

    var name = 'code-snapshot-' + Date.now() + '.png';

    var data = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    link.classList.add('downloading');
    link.setAttribute( 'href', data );
    link.setAttribute( 'download', name );
    setTimeout(function(){
        link.classList.remove('downloading');
    }, 2000);
    
//    e.preventDefault();

} );

document.getElementById( 'switchMode' ).addEventListener( 'click', function( e ) {

    var target = e.target || e.srcElement;
    var mode = target.getAttribute( 'data-mode' );

    target.classList.add( 'active', 'btn-primary' );

    if( mode === 'code' ) {
        textarea.classList.remove( 'hide-textarea' );
        this.querySelector( '[data-mode="3d"]' ).classList.remove( 'active', 'btn-primary' );
    } else {
        textarea.classList.add( 'hide-textarea' );
        this.querySelector( '[data-mode="code"]' ).classList.remove( 'active', 'btn-primary' );
    }

    //e.preventDefault();

} );

function escapeHtml(text) {
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

function updateCode() {

    console.log( 'update code' );
    codeSnippet.innerHTML = escapeHtml( '\n' + document.querySelector( '#editorContainer textarea' ).value );

    Prism.highlightAll( false, function() {

        console.log( 'code updated' );

        canvas.width = Math.round( codeSnippet.parentElement.clientWidth * scale );
        canvas.height = Math.round( codeSnippet.parentElement.clientHeight * scale );
        
        ctx.scale( scale, scale );

        ctx.fillStyle = window.getComputedStyle( codeSnippet.parentElement ).backgroundColor;
        ctx.fillRect( 0, 0, canvas.width, canvas.height );

        var rightBorder = 0;

        ctx.textBaseline = 'bottom';
        ctx.font = "bold normal normal 13px/normal Consolas, Monaco, 'Andale Mono', monospace";

        function processNodes( nodes ) {

            for( var j = 0; j < nodes.length; j++ ){

                var el = nodes[ j ];

                //ctx.fillStyle = '#000000';
                //ctx.fillText( el.textContent, left, top - 1 )

                if( el.childNodes.length ) {
                    processNodes( el.childNodes );
                } else {
                    if( el.nodeType != 3 ) {
                        ctx.fillStyle = window.getComputedStyle( el ).color;
//                    ctx.fillText( el.textContent, rects[ 0 ].left, rects[ 0 ].top + rects[ 0 ].height )
                    } else {

                        var range = document.createRange();
                        range.selectNodeContents( el );
                        var rects = range.getClientRects();
                        
                        var texts = [];

                        var stA = el.textContent.split("\n");
                        for (var i = stA.length-1; i >= 0; i-- ) {
                            if ( stA[i] !== "" ) texts.push( stA[ i ] );
                            if ( i > 0 ) texts.push( '\n' );
                        }

                        texts = texts.reverse();

                        var m = 3;
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgb(' + Math.floor( Math.random() * 255 ) + ', 0, 0)';
                        for( var k = 0; k < rects.length; k++ ) {
                            var r = rects[ k ];
                            /*ctx.beginPath();
                            ctx.rect( r.left - m, r.top - m, r.width + 2 * m, r.height + 2 * m );
                            ctx.stroke();*/
                            if( r.right > rightBorder ) rightBorder = r.right;

                            ctx.fillStyle = window.getComputedStyle( el.parentElement ).color;
                            ctx.fillText( texts[ k ], r.left, r.top + r.height );

                        }

                    }
                }

            }

        }

        processNodes( codeSnippet.childNodes );

        var tCanvas = document.createElement( 'canvas' ),
            tCtx = tCanvas.getContext( '2d' );
        tCanvas.width = canvas.width;
        tCanvas.height = canvas.height;
        tCtx.drawImage( canvas, 0, 0 );

        canvas.width = ( rightBorder + 13 ) * scale;
        canvas.height = tCanvas.height;
        ctx.drawImage( tCanvas, 0 ,0 );
        
        setPlane();

    } );

}

function init() {

    camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 10000 );

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: isSafari } );
    onWindowResize();

    var container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
    
    container.addEventListener( 'mousedown', onMouseDown, false );
    container.addEventListener( 'mousemove', onMouseMove, false );
    container.addEventListener( 'mouseup', onMouseUp, false );

    container.addEventListener( 'touchstart', onTouchStart, false );
    container.addEventListener( 'touchmove', onTouchMove, false );
    container.addEventListener( 'touchend', onTouchEnd, false );
    container.addEventListener( 'touchcancel', onTouchEnd, false );

    container.addEventListener( 'mousewheel', onMouseWheel, false );
    container.addEventListener( 'DOMMouseScroll', onMouseWheel, false);

}

function setPlane() {

    renderer.setClearColor( window.getComputedStyle( codeSnippet.parentElement ).backgroundColor, 1 );
    textarea.style.color = window.getComputedStyle( codeSnippet.parentElement ).color;

    if ( plane ) {
        scene.remove( plane );
    }

    var texture = new THREE.Texture( canvas );
    texture.needsUpdate = true;
    plane = new THREE.Mesh( 
        new THREE.PlaneGeometry( canvas.width / scale, canvas.height / scale ), 
        new THREE.MeshBasicMaterial( { 
            wireframe: false, 
            map: texture, 
            emissive: 0xffffff, 
            side: THREE.DoubleSide
        } ) 
    );
    plane.rotation.x = 0;
    plane.rotation.y = Math.PI / 2;

    scene.add( plane );

}

function onMouseWheel( event ) {

    if ( event.wheelDeltaY ) {
        nDistance -= event.wheelDeltaY * 0.01;
    } else if ( event.wheelDelta ) {
        nDistance -= event.wheelDelta * 0.05;
    } else if ( event.detail ) {
        nDistance += event.detail * 1.0;
    }
    
}


function onMouseDown( event ) {

    isUserInteracting = true;

    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;

    event.preventDefault();
    
}

function onMouseMove( event ) {

    if ( isUserInteracting ) {
    
        nLon = ( event.clientX - onPointerDownPointerX ) * 0.1 + onPointerDownLon;
        nLat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
        
    }

}

function onMouseUp( event ) {
    
    isUserInteracting = false;
    event.preventDefault();
   
}

function onTouchStart( event ) {

    var t = event.touches[ 0 ];
    isUserInteracting = true;

    onPointerDownPointerX = t.clientX;
    onPointerDownPointerY = t.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;

    event.preventDefault();
    
}

function onTouchMove( event ) {

    var t = event.touches[ 0 ];
    nLon = ( t.clientX - onPointerDownPointerX ) * 0.1 + onPointerDownLon;
    nLat = ( t.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;

    event.preventDefault();

}

function onTouchEnd( event ) {

    isUserInteracting = false;
    event.preventDefault();
   
}

function onWindowResize() {

    var s = 1;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( s * window.innerWidth, s * window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );
    render();

}

function render() {

    var time = Date.now() * 0.005;

    lat += ( nLat - lat ) * .1;
    lon += ( nLon - lon ) * .1;
    fov += ( nFov - fov ) * .1; 
    distance += ( nDistance - distance ) * .1;

    lat = Math.max( - 85, Math.min( 85, lat ) );
    phi = ( 90 - lat ) * Math.PI / 180;
    theta = lon * Math.PI / 180;

    camera.fov = fov;
    camera.updateProjectionMatrix();

    camera.position.x = distance * Math.sin( phi ) * Math.cos( theta );
    camera.position.y = distance * Math.cos( phi );
    camera.position.z = distance * Math.sin( phi ) * Math.sin( theta );

    camera.lookAt( scene.position );

    renderer.render( scene, camera );

}