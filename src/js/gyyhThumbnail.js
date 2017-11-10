/**
 * Created by Shirlman on 1/20/2017.
 */
var baseUrl = window.location.href.substring(0, window.location.href.indexOf("?") + 1);
var modelHouseUrl = baseUrl + "uid=b4d4d01c6b9fa4c8d49f96194ead944a9ee479a1&hid=公园一号样板房";
var salesUrl = baseUrl + "uid=b4d4d01c6b9fa4c8d49f96194ead944a9ee479a1&hid=售楼处";
var outDoorUrl = baseUrl + "uid=b4d4d01c6b9fa4c8d49f96194ead944a9ee479a1&hid=外景";

function getThumbnailList() {
    if(house.Name == "公园一号样板房") {
        return getModelHouseThumbnailList();
    } else if(house.Name == "售楼处")  {
        return getSalesThumbnailList();
    } else if(house.Name == "外景")  {
        return getOutDoorThumbnailList();
    }
}

function getModelHouseThumbnailList() {
    var thumbnailList = [];
    var imagePathPrefix = "./src/images/thumbnail/";

	var thumbnail = new Thumbnail();
    thumbnail.name = "外景";
    thumbnail.imagePath = imagePathPrefix + "外景.jpg";
    thumbnail.onclick = function () {
        window.location.href = outDoorUrl;
    };
    thumbnailList.push(thumbnail);

    thumbnail = new Thumbnail();
    thumbnail.name = "售楼处";
    thumbnail.imagePath = imagePathPrefix + "售楼处.jpg";
    thumbnail.onclick = function () {
        window.location.href = salesUrl;
    };
    thumbnailList.push(thumbnail);

	thumbnail = new Thumbnail();
    thumbnail.name = "样板房";
    thumbnail.imagePath = imagePathPrefix + "一楼客厅.jpg";
    thumbnail.onclick = onModelHouseThumbnailClicked;
	thumbnail.isSelected = true;
    thumbnailList.push(thumbnail);

    thumbnail = new Thumbnail();
    thumbnail.name = "样板房一楼";
    thumbnail.imagePath = imagePathPrefix + "一楼餐厅.jpg";
    thumbnail.onclick = onModelHouseThumbnailClicked;
    thumbnailList.push(thumbnail);

    thumbnail = new Thumbnail();
    thumbnail.name = "样板房二楼";
    thumbnail.imagePath = imagePathPrefix + "二楼书房.jpg";
    thumbnail.onclick = onModelHouseThumbnailClicked;
    thumbnailList.push(thumbnail);

    return thumbnailList;
}

function getSalesThumbnailList() {
    var thumbnailList = [];
    var imagePathPrefix = "./src/images/thumbnail/";

	var thumbnail = new Thumbnail();
    thumbnail.name = "外景";
    thumbnail.imagePath = imagePathPrefix + "外景.jpg";
    thumbnail.onclick = function () {
        window.location.href = outDoorUrl;
    };
    thumbnailList.push(thumbnail);

    thumbnail = new Thumbnail();
    thumbnail.name = "售楼处";
    thumbnail.imagePath = imagePathPrefix + "售楼处.jpg";
	thumbnail.isSelected = true;
    thumbnail.onclick = function () {

    };
    thumbnailList.push(thumbnail);

    thumbnail = new Thumbnail();
    thumbnail.name = "样板房";
    thumbnail.imagePath = imagePathPrefix + "一楼客厅.jpg";
    thumbnail.onclick = function () {
        window.location.href = modelHouseUrl;
    };
    thumbnailList.push(thumbnail);

    return thumbnailList;
}

function getOutDoorThumbnailList() {
    var thumbnailList = [];
    var imagePathPrefix = "./src/images/thumbnail/";

    var thumbnail = new Thumbnail();
    thumbnail.name = "外景";
    thumbnail.imagePath = imagePathPrefix + "外景.jpg";
	thumbnail.isSelected = true;
    thumbnail.onclick = function () {

    };
    thumbnailList.push(thumbnail);

	thumbnail = new Thumbnail();
    thumbnail.name = "售楼处";
    thumbnail.imagePath = imagePathPrefix + "售楼处.jpg";
    thumbnail.onclick = function () {
        window.location.href = salesUrl;
    };
    thumbnailList.push(thumbnail);

    thumbnail = new Thumbnail();
    thumbnail.name = "样板房";
    thumbnail.imagePath = imagePathPrefix + "一楼客厅.jpg";
    thumbnail.onclick = function () {
        window.location.href = modelHouseUrl;
    };
    thumbnailList.push(thumbnail);

    return thumbnailList;
}

function onModelHouseThumbnailClicked(thumbnail) {
    // display rooms
    for(var roomIndex in house.Rooms) {
        var isVisible;

        if(thumbnail.name == "样板房") {
            isVisible = true;
        } else if (thumbnail.name == "样板房一楼") {
            isVisible = !house.Rooms[roomIndex].IsSecondFloor;
        } else if (thumbnail.name == "样板房二楼") {
            isVisible = house.Rooms[roomIndex].IsSecondFloor;
        }

        for(var faceIndex in house.Rooms[roomIndex].RoomFaces) {
            var roomFace = house.Rooms[roomIndex].RoomFaces[faceIndex];

            roomFace.facePlane.material.opacity = isVisible ? 1 : 0.15;
            roomFace.facePlane.material.depthWrite =  isVisible;
        }
    }

    for(var hotSpotIndex in house.HotSpots) {
        var isVisible;

        if(thumbnail.name == "样板房") {
            isVisible = true;
        } else if (thumbnail.name == "样板房一楼") {
            isVisible = !house.HotSpots[hotSpotIndex].IsSecondFloor;
        } else if (thumbnail.name == "样板房二楼") {
            isVisible = house.HotSpots[hotSpotIndex].IsSecondFloor;
        }

        house.HotSpots[hotSpotIndex].gameObject.visible = isVisible;
    }
}
