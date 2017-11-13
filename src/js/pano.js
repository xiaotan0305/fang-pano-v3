/**
 * Created by Shirlman on 12/15/2016.
 */

var {getThumbnailList} = require('./panoThumbnail');
var PanoramaControls = require('./panoCtrl');
var ossHost = './house/';
var domain = './house/';

var stats, openStats = false;
var raycaster, mouse;
var scene, camera, renderer, textureLoader;
var container = document.getElementById( 'vr_house_container');

// const string
var overViewHotSpotNameSuffix = "_overViewHotSpotName";
var hotSpotNameSuffix = "_hotSpotName";
var hotSpotLineName = "_hotSpotLine";

var houseObj;
var groundObj;
var houseSize;
var logoPlane;

var clickableObjects = [];
var allRooms = [];
var allHotSpots = [];

var overviewCameraController, panoramaCameraController;
var isOverview = true;
var skyBox;
var isOnlyPanoramaView = false;

var previousCameraPosition;
var isPhone;

var defaultFov = 75;
var vrModeFov = 93;

var switchToOverviewDiv = document.getElementById("switchToOverviewDiv");
var switchVRButton = document.getElementById("switchVRButton");
var switchFullscreenButton = document.getElementById("switchFullscreenButton");
var enterHotSpotTip = document.getElementById("enterHotSpotTip");
var vrStartTip = document.getElementById("vrStartTip");

var houseScale = 1;

var isHotSpotClickble = true;

var mouseDownTime;
var mouseDownObject;

var totalRoomFaceCount = 0;
var totalPanoramaImageCount;

// control
var isOverviewAutoRotate = true;
var isFullscreen = false;
var autoRotateTimer;
var autoPlayTimer;

// web VR
//Apply VR headset positional data to camera.
var vrControls, vrEffect;
var crosshair;
var isVREnabled = false;
var isEnableVRMode = false;
var vrGazeTimer;
var previousVRIntersectObj;
var emulateVRControl = false; // test

var isShowThumbnail = true;
var userId, houseId;

getHouseViewData();

function getHouseViewData() {
    userId = getParameterByName("uid");
    userId = userId || 'b4d4d01c6b9fa4c8d49f96194ead944a9ee479a1';
    houseId = getParameterByName("hid");
    houseId = houseId || '公园一号样板房';
    setTitle(userId, houseId);

    var url = domain + userId + "/" + houseId + "/" + houseId + "_ViewData.txt";

    $.ajax({
        url: url,
        type: "GET",
        success: function(data) {
            window.house = JSON.parse(data);

            if(userId == "b4d4d01c6b9fa4c8d49f96194ead944a9ee479a2" && houseId == "外景") {
                initPanoramaHouse();
            } else {
                init3DHouse();
            }
        },
        error: function (e) {
            if(e.status == "404") {
                $("#loading_tip").text("您要浏览的房子不存在");
            }
        }
    });
}

function setTitle(userId, houseId) {
    if(userId == "e59350f7335d586c54b92758c2462af4683bcc73" && houseId == "复式一型楼")
    {
        document.title = "徐汇尚光酒店式公寓（55平）";
    }
    else if(userId == "e59350f7335d586c54b92758c2462af4683bcc73" && houseId == "复式二型楼下")
    {
        document.title = "徐汇尚光酒店式公寓（66平）";
    }
    else if(userId == "e59350f7335d586c54b92758c2462af4683bcc73" && houseId == "复式三型楼")
    {
        document.title = "徐汇尚光酒店式公寓（95平）";
    }
    else if(userId == "b4d4d01c6b9fa4c8d49f96194ead944a9ee479a1" && houseId == "公园一号样板房")
    {
        document.title = "公园壹号样板房";
    }
    else if(userId == "b4d4d01c6b9fa4c8d49f96194ead944a9ee479a1" && houseId == "售楼处")
    {
        document.title = "公园壹号售楼处";
    }
    else if(userId == "b4d4d01c6b9fa4c8d49f96194ead944a9ee479a1" && houseId == "外景")
    {
        document.title = "公园壹号外景";
    }
    else {
        document.title = houseId;
    }
}

function initPanoramaHouse() {
    isOverview = false;
    isOnlyPanoramaView = true;

    initThreejs();
    initPanoramaView();
    initVRCrosshair();
    createHotSpots();
    registEventListener();
    showFirstHotSpot("街景一-1", 150);
}

function init3DHouse() {
    initThreejs();

    initLight();
    initPanoramaView();

    initVRCrosshair();
    // initAxis();
    createHouse();

    initGround();
    createHotSpots();
    // preLoadPanoramaImages();
    registEventListener();

    var isLandscape = isLandscapeOrNot();
    setOverviewCameraControllerDistance(isLandscape);
    setDefaultCameraPosition(isLandscape);
}

function initThreejs() {
    isPhone = checkIsPhone();

    textureLoader = new THREE.TextureLoader();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0xcce0ff, 5000, 8000 );

    // 3D camera
    camera = new THREE.PerspectiveCamera( defaultFov, window.innerWidth / window.innerHeight, 0.5, 100000 );
    camera.rotation.reorder("YXZ");
    scene.add(camera);

    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.antialias = true;
    renderer.sortObjects = false;
    renderer.setPixelRatio(isPhone ? 4 : 2); // 解决手机上图片模糊的问题
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

//        renderer.shadowMap.enabled = true;
    renderer.setClearColor( scene.fog.color );
//        renderer.autoClear = false; // To allow render overlay on top of sprited sphere
    container.appendChild( renderer.domElement );

    if(openStats) {
        stats = new Stats();
        container.appendChild( stats.dom );
    }

    // web VR
    vrControls = new THREE.VRControls( camera );
    vrEffect = new THREE.StereoEffect( renderer );
    vrEffect.setSize( window.innerWidth, window.innerHeight );
//        vrEffect.setFullScreen( true );

    initCameraControl();

    render();
}

function checkIsPhone() {
    var sUserAgent = navigator.userAgent.toLowerCase();
    var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
    var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
    var bIsMidp = sUserAgent.match(/midp/i) == "midp";
    var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
    var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
    var bIsAndroid = sUserAgent.match(/android/i) == "android";
    var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
    var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";

    var isPhone = bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM;

    return isPhone;
}

function render() {
    if(openStats) {
        stats.update();
    }

    requestAnimationFrame( render );

    for(var index in allHotSpots) {
        allHotSpots[index].rotation.y = camera.rotation.y;
    }

    // logoPlane.rotation.z = camera.rotation.y - panoramaSphere.rotation.y;

    renderer.clear();
    renderer.clearDepth();

    if(isEnableVRMode) {

        if(!emulateVRControl) {
            vrControls.update();
        }

        if(isVREnabled) {
            vrEffect.render(scene, camera);
            checkVRIntersect();
        } else {
            renderer.render( scene, camera );
        }
    } else {
        renderer.render( scene, camera );

        if(overviewCameraController.enabled) {
            overviewCameraController.update();
        }
    }
}

function initVRCrosshair() {
    crosshair = new THREE.Mesh(
        new THREE.RingGeometry( 0.02, 0.04, 32 ),
        new THREE.MeshBasicMaterial( {
            color: 0xffffff,
            opacity: 0.5,
            transparent: true
        } )
    );

    crosshair.visible = false;
    crosshair.position.z = -2;
    camera.add( crosshair );
}

function showAllRooms(show) {
    for(var index in allRooms) {
        allRooms[index].visible = show;
    }

    if(show && isShowThumbnail) {
        var thumbnailList = $("#thumbnail-list").children("#thumbnail");

        for(var index in thumbnailList) {
            if(thumbnailList[index].thumbnailData.isSelected) {
                thumbnailList[index].onclick();
                break;
            }
        }
    }
}

function initGround() {
    // ground
    var groundMaterial = new THREE.MeshPhongMaterial( { color: 0x2b2b2b, specular: 0x111111} );
    groundObj = new THREE.Mesh( new THREE.PlaneBufferGeometry( 200000, 200000 ), groundMaterial );
    groundObj.position.y = (- house.CameraHeight - 2) * houseScale;
    groundObj.rotation.x = - Math.PI / 2;
    groundObj.receiveShadow = true;
    groundObj.scale.set(0.2, 0.2, 0.2);
    scene.add( groundObj );
}

function initLight() {
    // lights
    var light;
    scene.add( new THREE.AmbientLight( 0x666666 ) );
    light = new THREE.DirectionalLight( 0xdfebff, 1 );
    light.position.set( 80, 200, 100 );
    light.position.multiplyScalar( 1.3 );
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    var d = 300;
    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.camera.far = 1000;
    scene.add( light );
}

function initCameraControl() {

    // controls
    overviewCameraController = new THREE.OrbitControls( camera, renderer.domElement );
    overviewCameraController.maxPolarAngle = THREE.Math.degToRad(90);
    overviewCameraController.minPolarAngle = THREE.Math.degToRad(10);
    overviewCameraController.autoRotate = isOverviewAutoRotate;
    overviewCameraController.autoRotateSpeed = 1;
    overviewCameraController.zoomSpeed = 0.5;
    overviewCameraController.enableDamping = true;
    overviewCameraController.dampingFactor = 0.8;

    panoramaCameraController = new PanoramaControls( camera, renderer.domElement );
    panoramaCameraController.enabled = false;
}

function initPanoramaView() {
    var materials = [];

    for (var i = 0; i < 6; i++) {
        materials.push(new THREE.MeshBasicMaterial({side: THREE.BackSide}));
    }

    skyBox = new THREE.Mesh(new THREE.CubeGeometry(5000, 5000, 5000), new THREE.MultiMaterial(materials));
    skyBox.visible = false;

    var logoSize = 150;
    var texture = textureLoader.load('./src/images/logo.png');
    texture.minFilter = THREE.NearestFilter;
    var planeGeometry = new THREE.PlaneBufferGeometry(logoSize, logoSize, 1, 1);
    var planeMaterial = new THREE.MeshBasicMaterial({map: texture, transparent: true});
    logoPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    logoPlane.rotation.x = THREE.Math.degToRad(270);
    logoPlane.position.y = -400;

//        registerClickEvent(logoPlane, onSwitchToOverviewClicked);
    // 返回按钮事件
    switchToOverviewDiv.onclick = onSwitchToOverviewClicked;
    // vr按钮事件
    switchVRButton.onclick = onVRButtonClicked;

    skyBox.add(logoPlane);
    scene.add(skyBox);
}

function createHotSpots() {
    var texture = textureLoader.load( './src/images/hotspot/feet.png' );
    texture.minFilter = THREE.NearestFilter;
    var planeMaterial = new THREE.MeshBasicMaterial({map: texture, transparent: true});
    var lightMeshHeight = 70;
    var lightRadius = 12;
    var hotSpotNameHeight = 40;
    var deltaHeight = - house.CameraHeight + 4.5;

    var lightTexture = textureLoader.load( './src/images/hotspot/light.png' );
    lightTexture.minFilter = THREE.NearestFilter;
    var lightGeometry = new THREE.CylinderGeometry( lightRadius, lightRadius, lightMeshHeight, 30, 1, true );
    var lightMaterial = new THREE.MeshBasicMaterial({map: lightTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide});

    var hotSpotNames = [];

    for(var hotSpotIndex in house.HotSpots) {
        var hotSpot = house.HotSpots[hotSpotIndex];

        // TODO, 临时标二楼代码
        hotSpot.IsSecondFloor = hotSpot.Position.y > 100;

        var hotSpotName = hotSpot.Name;

        if(hotSpot.Type == "Door" && hotSpot.Name.split("-").length > 2) {
            hotSpotName = hotSpot.Name.substring(0, hotSpot.Name.lastIndexOf('-'));
        }

        if(hotSpot.Type == "Room" && hotSpot.Name.split("-").length > 1) {
            hotSpotName = hotSpot.Name.split("-")[0];
        }

        // draw light
        var lightObj = new THREE.Mesh(lightGeometry, lightMaterial );
        lightObj.position.set(hotSpot.Position.x, hotSpot.Position.y + deltaHeight + lightMeshHeight / 2, -hotSpot.Position.z);
        lightObj.name = hotSpot.Name;
        lightObj.tag = hotSpot;
        scene.add(lightObj);
        hotSpot.gameObject = lightObj;
        allHotSpots.push(lightObj);
        registerClickEvent(lightObj, function (hotSpotObj) {
            onHotSpotClicked(hotSpotObj.tag);
        });

        // draw feet
        var planeGeometry = new THREE.PlaneBufferGeometry(12, 12, 1, 1);
        var feetPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        feetPlane.rotation.x = THREE.Math.degToRad(270);
        feetPlane.position.y = -lightMeshHeight / 2;
        lightObj.add(feetPlane);

        if(hotSpotName.split('-').length > 1 || contains(hotSpotNames, hotSpotName)) {
            continue;
        }

        // draw hot spot name
        var hotSpotNameSprite = createTextSprite( hotSpotName,
            { fontsize: 50, backgroundColor: {r:0, g:0, b:0, a:0.498039}, cornerAngle: 12 } );
        hotSpotNameSprite.position.set(0,10,0);
        hotSpotNameSprite.name = hotSpot.Name + hotSpotNameSuffix;
        hotSpotNameSprite.visible = false;
        lightObj.add(hotSpotNameSprite);

        hotSpotNames.push(hotSpotName);

        // draw overview hot spot name
        var overviewHotSpotNameSprite = createTextSprite( hotSpotName,
            { fontsize: 250, backgroundColor: {r:0, g:0, b:0, a:0.498039}, cornerAngle: 40 } );
        overviewHotSpotNameSprite.position.set(0, hotSpotNameHeight, 0);
        overviewHotSpotNameSprite.name = hotSpot.Name + overViewHotSpotNameSuffix;
        lightObj.add(overviewHotSpotNameSprite);
        registerClickEvent(overviewHotSpotNameSprite, onHotSpotNameClicked);

        // draw line
        var material = new THREE.LineBasicMaterial({
            color: 0x008000, linewidth: 1
        });

        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3( 0, feetPlane.position.y, 0 ),
            new THREE.Vector3( 0, overviewHotSpotNameSprite.position.y - 7 )
        );

        var line = new THREE.Line( geometry, material );
        line.name = hotSpotLineName;
        lightObj.add( line );
    }
}

function onWindowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if(isVREnabled) {
        vrEffect.setSize( window.innerWidth, window.innerHeight );
    } else {
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
}

function registEventListener() {
    renderer.domElement.addEventListener('touchstart', eventHandler, false);
    renderer.domElement.addEventListener('touchend', eventHandler, false);
    renderer.domElement.addEventListener('mousedown', eventHandler, false);
    renderer.domElement.addEventListener('mouseup', eventHandler, false);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('orientationchange', onOrientionChange, false);
}

function onOrientionChange (event){
    var isLandscape = isLandscapeOrNot();

    if(isLandscape == undefined) {
        return;
    }

    // update camera controller distance
    setOverviewCameraControllerDistance(isLandscape);

    if(isEnableVRMode) {
        if ( isLandscape ) {
            if(!isVREnabled) {
                switchVRMode(true);
            }
        } else {
            if(isVREnabled) {
                switchVRMode(false);
            }
        }
    }

    var thumbnailList = document.getElementById("thumbnail-list");

    if(isLandscape) {
        for(var index in thumbnailList.children) {
            thumbnailList.children[index].classList.remove("col-xs-3");
            thumbnailList.children[index].classList.add("col-xs-2");
        }
    } else {
        for(var index in thumbnailList.children) {
            thumbnailList.children[index].classList.remove("col-xs-2");
            thumbnailList.children[index].classList.add("col-xs-3");
        }
    }
}

function isLandscapeOrNot() {
    var isLandscape;

    if(window.orientation == 180 || window.orientation==0) {
        isLandscape = false;
    } else if( window.orientation == 90 || window.orientation == -90) {
        isLandscape = true;
    }

    return isLandscape;
}

function eventHandler(event) {
    if (event.type == 'touchstart' || event.type == 'mousedown') {
        mouseDownTime = new Date().getTime();
        mouseDownObject = getIntersectObj(event);

        if(isOverview) {
            overviewCameraController.autoRotate = false;
        } else {
            panoramaCameraController.isAutoPlay = false;
        }
    } else if (event.type == 'touchend' || event.type == 'mouseup') {
        if (new Date().getTime() - mouseDownTime < 200) {
            var mouseUpObject = getIntersectObj(event);

            if(mouseUpObject == mouseDownObject && mouseDownObject != undefined) {
                mouseDownObject.onClick(mouseDownObject);
            }
        }

        if(isOverview) {
            if(autoRotateTimer != undefined) {
                clearTimeout(autoRotateTimer);
            }

            autoRotateTimer = setTimeout(function () {
                overviewCameraController.autoRotate = isOverviewAutoRotate;
            }, 3000);
        } else {
            switchAutoPlay(true);
        }
    }
}

function registerClickEvent(object, onClick) {
    clickableObjects.push(object);
    object.onClick = onClick;
}

function getIntersectObj( event) {
    var inetsectObject;

    event.preventDefault();
    var x, y;

    if(event.type == 'touchstart') {
        x = event.touches[0].pageX;
        y = event.touches[0].pageY;
    } else if (event.type == 'touchend'){
        x = event.changedTouches[0].pageX;
        y = event.changedTouches[0].pageY;
    }
    else {
        x = event.clientX;
        y = event.clientY;
    }

    mouse.x = ( x / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( y / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( clickableObjects );

    if ( intersects.length > 0 ) {
        inetsectObject = intersects[0].object;
    }

    return inetsectObject;
}

function getVRIntersectObj() {
    var inetsectObject;

    raycaster.setFromCamera( { x: 0, y: 0 }, camera );
    var intersects = raycaster.intersectObjects( clickableObjects );

    if ( intersects.length > 0 ) {
        inetsectObject = intersects[0].object;
    }

    return inetsectObject;
}

function checkVRIntersect() {
    var intesectObject = getVRIntersectObj();

    if(previousVRIntersectObj != intesectObject) {

        if(vrGazeTimer != undefined) {
            clearTimeout(vrGazeTimer);
        }

        if(intesectObject != undefined) {

            vrGazeTimer = setTimeout(function () {
                intesectObject.onClick(intesectObject);
            }, 1500);
        }

        previousVRIntersectObj = intesectObject;
    }
}

function onSwitchToOverviewClicked () {

    groundObj.visible = true;

    if(isShowThumbnail) {
        document.getElementById("thumbnail-controller").style.visibility = "visible";
    }

    switchToOverviewDiv.style.visibility = "hidden";
    enterHotSpotTip.style.visibility = "visible";
    switchVRButton.style.visibility = "hidden";

    camera.position.copy(previousCameraPosition);
    camera.fov = isVREnabled ? vrModeFov : defaultFov;
    camera.updateProjectionMatrix();

    disposeSkyBoxTexture();

    showOverviewHotSpotNames(true);

    for(var index in allHotSpots) {
        var scale = 1;
        allHotSpots[index].scale.set(scale, 1, scale);
    }

    overviewCameraController.enabled = true;
    overviewCameraController.autoRotate = isOverviewAutoRotate;
    overviewCameraController.update();

    panoramaCameraController.enabled = false;
    skyBox.visible = false;
    houseObj.visible = true;

    isHotSpotClickble = true;

    for(var index in allHotSpots) {
        allHotSpots[index].visible = true;
    }

    showAllRooms(true);

    isOverview = true;
}

function switchToHotSpotView() {
    document.getElementById("thumbnail-controller").style.visibility = "hidden";

    enterHotSpotTip.style.visibility = "hidden";
    switchVRButton.style.visibility = "visible";

    showOverviewHotSpotNames(false);

    for(var index in allHotSpots) {
        var scale = 0.7;
        allHotSpots[index].scale.set(scale, 1, scale);
    }

    overviewCameraController.enabled = false;
    overviewCameraController.autoRotate = false;
    panoramaCameraController.enabled = true;

    previousCameraPosition = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);

    skyBox.visible = true;

    if(!isOnlyPanoramaView) {
        houseObj.visible = false;
        groundObj.visible = false;
        switchToOverviewDiv.style.visibility = "visible";
    }

    showAllRooms(false);

    isOverview = false;
}

function showOverviewHotSpotNames(show) {
    for(var index in allHotSpots) {
        var overviewHotSpotName = allHotSpots[index].getObjectByName(allHotSpots[index].tag.Name + overViewHotSpotNameSuffix);

        if(overviewHotSpotName != undefined) {
            overviewHotSpotName.visible = show;
            allHotSpots[index].getObjectByName(hotSpotLineName).visible = show;
        }

        if(show) {
            var hotSpotName = allHotSpots[index].getObjectByName(allHotSpots[index].tag.Name + hotSpotNameSuffix);

            if(hotSpotName) {
                hotSpotName.visible = false;
            }
        }
    }
}

function onHotSpotNameClicked(hotSpotNameObj) {
    onHotSpotClicked(hotSpotNameObj.parent.tag);
}

function onHotSpotClicked(hotSpot, onLoad, onProgress, onError) {
    if (!isHotSpotClickble) {
        return;
    }

    console.log(hotSpot.Name);

    var imagePath = hotSpot.ImagePath.replace(ossHost, domain);

    isHotSpotClickble = false;

    if (hotSpot.cached == undefined || hotSpot.cached == false) {
        document.getElementById("loading").style.visibility = "visible";
    }

    var rootPath = imagePath.substring(0, imagePath.lastIndexOf("/") + 1).replace("PanoramaImages", "PanoramaTileImages");
    var imageName = imagePath.substring(imagePath.lastIndexOf("/") + 1);
    imageName = imageName.substring(0, imageName.lastIndexOf("."));

    var urls = [
        rootPath + imageName + "_l.jpg",
        rootPath + imageName + "_r.jpg",
        rootPath + imageName + "_u.jpg",
        rootPath + imageName + "_d.jpg",
        rootPath + imageName + "_f.jpg",
        rootPath + imageName + "_b.jpg"
    ];

    loadCubePanoramaTexture(urls,
        function (cubeTexture) {
            onPanoramaImageLoad(cubeTexture, hotSpot);

            if(onLoad) {
                onLoad();
            }
        }, function (xhr) {
            if(onProgress) {
                onProgress(xhr);
            }
        },
        function (xhr) {
            isHotSpotClickble = true;

            if(onError) {
                onError();
            }
        });
}

function onPanoramaImageLoad(cubeTexture, hotSpot) {
    document.getElementById("loading").style.visibility = "hidden";

    if (isOverview) {
        switchToHotSpotView();
    }

    // move camera and panorama sphere
    var cameraPosition = new THREE.Vector3(hotSpot.Position.x, hotSpot.Position.y, -hotSpot.Position.z);

    camera.position.copy(cameraPosition);
    camera.fov = isVREnabled ? vrModeFov : defaultFov;
    camera.updateProjectionMatrix();

    panoramaCameraController.updateRotation();

    disposeSkyBoxTexture();

    for(var i = 0; i < skyBox.material.materials.length; i++){
        skyBox.material.materials[i].map = cubeTexture[i];
    }

    skyBox.position.copy(cameraPosition);
    skyBox.rotation.y = THREE.Math.degToRad(180 - hotSpot.Rotation.y);

    showVisibleHotSpots(hotSpot);

    isHotSpotClickble = true;
    hotSpot.cached = true;

    switchAutoPlay(true);
}

function loadCubePanoramaTexture(urls, onLoad, onProgress, onError) {
    var cubeTexture = [];
    var loaded = 0;

    function loadTexture( i ) {

        textureLoader.load( urls[ i ], function ( texture ) {

			texture.minFilter = THREE.LinearFilter;
            cubeTexture[ i ] = texture;

            loaded ++;

            if ( loaded === urls.length ) {

                if ( onLoad ) onLoad( cubeTexture );
            }

        }, function (xhr) {
            if(onProgress) {
                xhr.loaded = loaded;
                xhr.total = urls.length;

                onProgress(xhr);
            }
        }, onError );
    }

    for ( var i = 0; i < urls.length; i++ ) {
        loadTexture(i);
    }
}

function disposeSkyBoxTexture() {
    for(var i = 0; i < skyBox.material.materials.length; i++) {
        if(skyBox.material.materials[i].map != null) {
            skyBox.material.materials[i].map.dispose();
            skyBox.material.materials[i].map = null;
        }
    }
}

function showFirstHotSpot(hotSpotName, theta) {
    var hotSpot = getHotSpotFromName(hotSpotName);

    onHotSpotClicked(hotSpot, function () {
        onWindowResize();
        switchToOverviewDiv.style.visibility = "hidden";
        document.getElementById("welcome").style.visibility="hidden";

        switchToHotSpotView();

        camera.rotation.y = THREE.Math.degToRad(theta);
        panoramaCameraController.updateRotation();

        if(isShowThumbnail) {
            createThumbnails();
        }
    }, function (xhr) {
        var value = parseInt(xhr.loaded / xhr.total * 100);
        var progressBar = document.getElementById("loading_progress_bar");
        progressBar.style.width = value + '%';
        progressBar.innerText =  value + '%';
    }, function () {
        $("#loading_tip").text("加载失败");
    });

    document.getElementById("loading").style.visibility = "hidden";
}

function showVisibleHotSpots(hotSpot) {
    var visibleHotSpots = [];

    // get visible hot spots
    for(var index in hotSpot.VisibleHotSpots) {
        visibleHotSpots.push(getHotSpotFromName(hotSpot.VisibleHotSpots[index]));
    }

    // show visible hot spots
    for(var index in allHotSpots) {

        if(hotSpot == allHotSpots[index].tag) {
            allHotSpots[index].visible = false;
        } else {
            var visible = contains(visibleHotSpots, allHotSpots[index].tag);
            allHotSpots[index].visible = visible;

            var textSprite = allHotSpots[index].getObjectByName(allHotSpots[index].name + hotSpotNameSuffix);

            if(!textSprite) {
                continue;
            }

            textSprite.visible = visible;

            if(visible) {
                // update hot spot name
                var splitNames = allHotSpots[index].tag.Name.split('-');
                var splitHotSpotNames = hotSpot.Name.split('-');

                if(allHotSpots[index].tag.Type == "Door") {
                    for(var nameIndex in splitNames) {
                        if(!contains(splitHotSpotNames, splitNames[nameIndex])) {
                            updateTextSprite(textSprite, splitNames[nameIndex]);

                            break;
                        }
                    }
                }

                // update hot spot scale
                var distance = camera.position.distanceTo(allHotSpots[index].position.clone().add(textSprite.position));
                var scale = 0.015;
                textSprite.scale.set(textSprite.material.map.scaleX * distance * scale, textSprite.material.map.scaleY * distance * scale, 1);
            }
        }
    }
}

function contains(a, obj) {
    var i = a.length;

    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }

    return false;
}

function onVRButtonClicked() {
    if(panoramaCameraController.isAutoPlay) {
        switchAutoPlay(false);
    }

    onSwitchVRMode();
}

function switchAutoPlay(isAutoPlay) {
    if(!isAutoPlay) {
        panoramaCameraController.isAutoPlay = false;
    } else {
        if(autoPlayTimer != undefined) {
            clearTimeout(autoPlayTimer);
        }

        autoPlayTimer = setTimeout(function () {
            panoramaCameraController.isAutoPlay = true;
        }, 6000);
    }
}

function onSwitchFullscreenButtonClicked() {
    isFullscreen = !isFullscreen;

    if (!isFullscreen) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    } else {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (document.body.msRequestFullscreen) {
            document.body.msRequestFullscreen();
        }
    }

    switchFullscreenButton.innerText = isFullscreen ? "退出全屏" : "全屏";
    isOverviewAutoRotate = !isFullscreen;
    overviewCameraController.autoRotate = isOverviewAutoRotate;
}

function createHouse() {
    totalPanoramaImageCount = house.HotSpots.length;

    houseObj = new THREE.Object3D();
    houseObj.name = house.Name;
    scene.add(houseObj);

    for(var roomIndex in house.Rooms) {
        var room = house.Rooms[roomIndex];

        var roomObj = new THREE.Object3D();
        roomObj.name = room.Name;
        roomObj.position.set(room.Position.x, room.Position.y, -room.Position.z);
        roomObj.rotation.set(0, THREE.Math.degToRad(-room.Rotation), 0);
        houseObj.add(roomObj);
        allRooms.push(roomObj);

        room.gameObject = roomObj;

        // TODO, 临时标二楼代码
        if(!room.IsSecondFloor) {
            room.IsSecondFloor = room.Position.y > 100;
        }

        for(var faceIndex in room.RoomFaces) {
            var roomFace = room.RoomFaces[faceIndex];
            totalRoomFaceCount++;

            // create room face
            var planeGeometry = new THREE.PlaneBufferGeometry(roomFace.Width, roomFace.Height, 1, 1);
            var texture = loadFaceTexture(roomFace);
            texture.minFilter = THREE.LinearFilter;  // fix image is not power of two (xxx). Resized to xxx img
            var planeMaterial = new THREE.MeshBasicMaterial({map: texture, side: THREE.BackSide, alphaTest:0.1});
            planeMaterial.transparent = true;
            // planeMaterial.depthWrite = planeMaterial.transparent;
            var facePlane = new THREE.Mesh(planeGeometry, planeMaterial);
            facePlane.rotation.reorder("YXZ");
            facePlane.rotation.set(THREE.Math.degToRad(roomFace.Rotation.x), THREE.Math.degToRad(roomFace.Rotation.y), THREE.Math.degToRad(roomFace.Rotation.z));
            facePlane.position.set(roomFace.Position.x, roomFace.Position.y, -roomFace.Position.z);

            roomFace.facePlane = facePlane;
            roomObj.add(facePlane);
        }
    }

    houseObj.scale.set(houseScale, houseScale, houseScale);

    houseSize = getHouseSize(house);

    return house;
}

function getHotSpotFromName(hotSpotName) {
    var hotSpot;

    for(var hotSpotIndex in house.HotSpots) {
        if(house.HotSpots[hotSpotIndex].Name == hotSpotName) {
            hotSpot = house.HotSpots[hotSpotIndex];

            break;
        }
    }

    return hotSpot;
}

function loadFaceTexture(roomFace) {
    var faceTexturePath = roomFace.ImagePath.replace(ossHost, domain);

    var texture = textureLoader.load( faceTexturePath, function (loadedTexture) {

    }, function(xhr) {
        onRoomFaceTextureLoading(roomFace, xhr);
    } );

    return texture;
}

function setOverviewCameraControllerDistance(isLandscape) {
    if(houseSize == undefined || overviewCameraController == undefined) {
        return;
    }

    var factor = Math.min(houseSize.x, houseSize.z) * houseScale * 0.0025;

    overviewCameraController.minDistance = 370  * factor;
    overviewCameraController.maxDistance = 900 * factor;

    if(isLandscape) {
        overviewCameraController.minDistance -= 80 * factor;
        overviewCameraController.maxDistance -= 200 * factor;
    }
}

function setDefaultCameraPosition(isLandscape) {
    var theta = 120;
    var phi = 60;
    var radius = 650;

	if(userId == "b4d4d01c6b9fa4c8d49f96194ead944a9ee479a1" && houseId == "公园一号样板房")
    {
        theta = -10;
		phi = 40;
    }
    else if(userId == "b4d4d01c6b9fa4c8d49f96194ead944a9ee479a1" && houseId == "售楼处")
    {
        theta = 45;
		phi = 35;
    }

    var d =  Math.cos(THREE.Math.degToRad(phi)) * radius;
    var x =  Math.sin(THREE.Math.degToRad(theta)) * d;
    var y = Math.sin(THREE.Math.degToRad(phi)) * radius;
    var z = -Math.cos(THREE.Math.degToRad(theta)) * d;

    var factor = Math.max(houseSize.x, houseSize.z) * houseScale * 0.002;

    var defaultCameraPosition = new THREE.Vector3(x * factor, y * factor, z * factor);

    if(isLandscape) {
        defaultCameraPosition.x += 100 * factor;
        defaultCameraPosition.y -= 50 * factor;
        defaultCameraPosition.z += 100 * factor;
    }

    camera.position.copy(defaultCameraPosition);
}

function getHouseSize(house) {
    var minX, maxX;
    var minY, maxY;
    var minZ, maxZ;

    for(var roomIndex in house.Rooms) {
        var room = house.Rooms[roomIndex];

        for(var faceIndex in room.RoomFaces) {
            var roomFace = room.RoomFaces[faceIndex];

            if(roomIndex == 0 && faceIndex == 0) {
                minX = maxX = room.Position.x + roomFace.Position.x;
                minY = maxY = room.Position.y + roomFace.Position.y;
                minZ = maxZ = room.Position.z + roomFace.Position.z;
            } else {
                minX = Math.min(minX, room.Position.x + roomFace.Position.x);
                maxX = Math.max(maxX, room.Position.x + roomFace.Position.x);
                minY = Math.min(minY, room.Position.y + roomFace.Position.y);
                maxY = Math.max(maxY, room.Position.y + roomFace.Position.y);
                minZ = Math.min(minZ, -room.Position.z - roomFace.Position.z);
                maxZ = Math.max(maxZ, -room.Position.z - roomFace.Position.z);
            }
        }
    }

    return new THREE.Vector3(maxX - minX, maxY - minY, maxZ - minZ);
}

function onRoomFaceTextureLoading(roomFace, xhr) {
    roomFace.loadedProgress = xhr.loaded / xhr.total;

    var loadedProgress = 0;

    for(var roomIndex in house.Rooms) {
        var room = house.Rooms[roomIndex];

        for (var faceIndex in room.RoomFaces) {
            var face = room.RoomFaces[faceIndex];

            if(face.loadedProgress == undefined) {
                face.loadedProgress = 0;
            }

            loadedProgress += face.loadedProgress;
        }
    }

    var value = parseInt(loadedProgress / totalRoomFaceCount * 100);
    var progressBar = document.getElementById("loading_progress_bar");
    progressBar.style.width = value + '%';
    progressBar.innerText =  value + '%';

    if(value == 100) {
        setTimeout(onResourcesPrepared, 500);
    }
}

function onResourcesPrepared() {
    onWindowResize();
    document.getElementById("welcome").style.visibility="hidden";
    $("#controlTip")[0].style.visibility = "visible";

    setTimeout(function () {
        $("#controlTip").fadeOut(3000);
    }, 2000);

    if(isShowThumbnail) {
        createThumbnails();
    }

    document.getElementById("enterHotSpotTip").style.visibility="visible";
    document.getElementById("controlDiv").style.visibility="visible";

    overviewCameraController.update();
}

function onSwitchVRMode() {
    isEnableVRMode = !isEnableVRMode;

    if(!isOnlyPanoramaView) {
        switchToOverviewDiv.style.visibility = isEnableVRMode ? "hidden" : "visible";
    }

    if(isEnableVRMode) {
        if(isLandscapeOrNot()) {
            switchVRMode(true);
        } else {
            vrStartTip.style.visibility = "visible";
            vrStartTip.style.opacity = 1;
            $("#vrStartTip").stop();
            $("#vrStartTip").show();
            panoramaCameraController.enabled = false;

            $("#vrStartTip").fadeOut(5000);
        }
    } else {
        switchVRMode(false);
    }
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)')
        .exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

// web vr
function switchVRMode(enable) {
    camera.fov = enable ? vrModeFov : defaultFov;
    isVREnabled = enable;

    onWindowResize();

    crosshair.visible = enable;

    if(!enable) { // 关闭VR
        disableVRMode();
    } else { // 开启VR
        enableVRMode();
    }

    // PC 端模拟VR控制
    if(emulateVRControl) {
        if (enable) {
            panoramaCameraController.enabled = true;
        } else if (isOverview) {
            panoramaCameraController.enabled = false;
        }
    }
}

function enableVRMode() {
    if(isOverview) {
        overviewCameraController.enabled = false;

        camera.position.x = 100;
        camera.position.y = 250;
        camera.position.z = 300;
    } else {
        panoramaCameraController.enabled = false;
        $("#vrStartTip").stop();
    }

    vrStartTip.style.visibility = "hidden";
}

function disableVRMode() {
    if(isOverview) {
        overviewCameraController.enabled = true;
        overviewCameraController.update();
    } else {
        camera.rotation.z = 0;

        panoramaCameraController.enabled = true;
        panoramaCameraController.updateRotation();
    }

    if(vrGazeTimer != undefined) {
        clearTimeout(vrGazeTimer);
    }

    vrStartTip.style.visibility = "hidden";
}

function createTextSprite( message, parameters ) {
    var texture = createTextTexture( message, parameters );

    var spriteMaterial = new THREE.SpriteMaterial({map: texture});
    var sprite = new THREE.Sprite(spriteMaterial);

    sprite.scale.set(texture.scaleX, texture.scaleY, 1);

    return sprite;
}

function createTextTexture( message, parameters) {
    if (parameters === undefined) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface") ?
        parameters["fontface"] : "Arial";

    var fontsize = parameters.hasOwnProperty("fontsize") ?
        parameters["fontsize"] : 18;

    var borderThickness = parameters.hasOwnProperty("borderThickness") ?
        parameters["borderThickness"] : 0;

    var borderColor = parameters.hasOwnProperty("borderColor") ?
        parameters["borderColor"] : {r: 0, g: 0, b: 0, a: 1.0};

    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
        parameters["backgroundColor"] : {r: 255, g: 255, b: 255, a: 1.0};

    var cornerAngle = parameters.hasOwnProperty("cornerAngle") ?
        parameters["cornerAngle"] : 10;

    var canvas = document.createElement('canvas');
    canvas.width = fontsize * 12;
    canvas.height = fontsize * 1.4;

    var context = canvas.getContext('2d');

    context.font = "normal " + fontsize + "px " + fontface;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // get size data (height depends only on font size)
    var metrics = context.measureText(message);
    var textWidth = metrics.width;

    var x =  (canvas.width + borderThickness) / 2;
    var y =  (canvas.height + borderThickness) / 2;

    // background color
    context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
        + backgroundColor.b + "," + backgroundColor.a + ")";
    // border color
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
        + borderColor.b + "," + borderColor.a + ")";

    context.lineWidth = borderThickness;
    var border = 100;
    roundRect(context, (canvas.width - textWidth - border) / 2, 0, textWidth + border, canvas.height, cornerAngle);
    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = "rgba(255, 255, 255, 1.0)";

    context.fillText(message, x , y);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter; // NearestFilter;
    texture.needsUpdate = true;

    texture.parameters = parameters;
    texture.scaleX = canvas.width * 0.05;
    texture.scaleY = canvas.height * 0.05;

    return texture;
}

function updateTextSprite(textSprite, message) {
    var texture = createTextTexture(message, textSprite.material.map.parameters);
    textSprite.material.map.dispose();
    textSprite.material.map = texture;
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function onThumbnailControllerClicked() {
    if($("#thumbnail-list")[0].style.display == "none") {
        $("#thumbnail-list").slideDown("slow");
    } else {
        $("#thumbnail-list").slideUp("slow");
    }
}

function createThumbnails() {
    $("#thumbnail-controller")[0].style.visibility = "visible";

    var thumbnailList = getThumbnailList();
    var template = $("#thumbnail");

    for(var index in thumbnailList) {
        var clonedThumbnail = template.clone().appendTo("#thumbnail-list");
        clonedThumbnail.find("#thumbnail-name")[0].innerText = thumbnailList[index].name;
        clonedThumbnail.find("#thumbnail-image")[0].src =  thumbnailList[index].imagePath;
        clonedThumbnail[0].onclick = function () {
            onThumbnailClicked($(this));
            $(this)[0].thumbnailData.click();
        };
        clonedThumbnail[0].thumbnailData = thumbnailList[index];

        if(thumbnailList[index].isSelected) {
            clonedThumbnail[0].click();
        }
    }

    template.remove();
}

function onThumbnailClicked(thumbnailElement) {
    thumbnailElement[0].children[0].classList.remove("thumbnail-unselected");
    thumbnailElement[0].children[0].classList.add("thumbnail-selected");

    thumbnailElement.siblings().each(function(index, domElement) {
        domElement.children[0].classList.remove("thumbnail-selected");
        domElement.children[0].classList.add("thumbnail-unselected");

        if(domElement.thumbnailData) {
            domElement.thumbnailData.isSelected = false;
        }
    });

    var thumbnail = thumbnailElement[0].thumbnailData;
    thumbnail.isSelected = true;
}