PanoramaControls = function ( camera, domElement ) {
    this.enabled = false;
    this.isAutoPlay = false;
    var isPointDown = false;
    var onPointerDownPointerX = 0, onPointerDownPointerY = 0,
        theta = 0, onPointerDownTheta = 0,
        phi = 0, onPointerDownPhi = 0;

    var scope = this;

    var touchSensitive = 3;

    camera.target = new THREE.Vector3( 0, 0, 0 );

    if(domElement == null || domElement == undefined) {
        domElement = document;
    }

    domElement.addEventListener( 'mousedown', onMouseDown, false );
    domElement.addEventListener( 'mousemove', onMouseMove, false );
    domElement.addEventListener( 'mouseup', onMouseUp, false );
    domElement.addEventListener( 'wheel', onMouseWheel, false );

    domElement.addEventListener( 'touchstart', onTouchDown, false );
    domElement.addEventListener( 'touchend', onTouchUp, false );
    domElement.addEventListener( 'touchmove', onTouchMove, false );

    animate();

    function onPointDown(x, y) {
        isPointDown = true;

        onPointerDownPointerX = x;
        onPointerDownPointerY = y;
        onPointerDownTheta = theta;
        onPointerDownPhi = phi;
    }

    function onPointMove(x, y) {
        if ( isPointDown && scope.enabled ) {
            theta = ( onPointerDownPointerX - x ) * 0.1 + onPointerDownTheta;
            phi = ( y - onPointerDownPointerY ) * 0.1 + onPointerDownPhi;
        }
    }

    function onPointUp() {
        isPointDown = false;
    }

    // touch control
    function onTouchDown(event) {
        event.preventDefault();
        event.stopPropagation();
        onPointDown(event.touches[0].pageX * touchSensitive, event.touches[0].pageY * touchSensitive);
    }

    function onTouchMove(event) {
        event.preventDefault();
        event.stopPropagation();
        onPointMove(event.touches[0].pageX * touchSensitive, event.touches[0].pageY * touchSensitive);
    }

    function onTouchUp(event) {
        event.preventDefault();
        event.stopPropagation();
        onPointUp();
    }

    // mouse control
    function onMouseDown( event ) {
        event.preventDefault();
        onPointDown(event.clientX, event.clientY);

        // 防止鼠标划出浏览器导致事件丢失的问题
        document.addEventListener( 'mousemove', onMouseMove, false );
        document.addEventListener( 'mouseup', onMouseUp, false );
    }

    function onMouseMove( event ) {
        event.preventDefault();
        onPointMove(event.clientX, event.clientY);
    }

    function onMouseUp( event ) {
        event.preventDefault();
        onPointUp();

        // 防止鼠标划出浏览器导致事件丢失的问题
        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'mouseup', onMouseUp, false );
    }

    function onMouseWheel( event ) {
        var fov = camera.fov + event.deltaY * 0.05;
        fov = Math.max( 30, Math.min( 100, fov ) );
        camera.fov = fov;
        camera.updateProjectionMatrix();
    }

    this.updateRotation = function() {
        theta = THREE.Math.radToDeg(-camera.rotation.y);
        phi = THREE.Math.radToDeg(camera.rotation.x);

        update();
    };

    function update() {
        if(!scope.enabled) {
            return;
        }

        if ( scope.isAutoPlay && !isPointDown) {
            theta += 0.05;
        }

        phi = Math.max( - 85, Math.min( 85, phi ) );
        camera.rotation.x = THREE.Math.degToRad( phi );
        camera.rotation.y = -THREE.Math.degToRad( theta );
    }

    function animate() {

        requestAnimationFrame(animate);

        update();
    }
};