let uploadInput;
let presentation;
let presentedIndex;
let imageContainer;
let map;


const selectedMarkerColor = '#ff3700'

const selectedMarkerStyle = `
  background-color: ${selectedMarkerColor};
  width: 3rem;
  height: 3rem;
  display: block;
  left: -1.5rem;
  top: -1.5rem;
  position: relative;
  border-radius: 3rem 3rem 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF`

const selectedMarkerIcon = L.divIcon({
  className: "selected-marker-icon",
  iconAnchor: [0, 24],
  labelAnchor: [-6, 0],
  popupAnchor: [0, -36],
  html: `<span style="${selectedMarkerStyle}" />`
})


window.onload = function setup() {
	setupElements();
	setupListeners();
};

function setupElements() {
	uploadInput = document.getElementById("upload-input");
	imageContainer = document.getElementById("img-container");


	map = L.map('map').setView([20.33, -13.37], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

function setupListeners() {
	let prevBtn = document.getElementById("prev-btn");
	let nextBtn = document.getElementById("next-btn");

	uploadInput.addEventListener('input', present);

	prevBtn.addEventListener('click', onPrevClick);
	nextBtn.addEventListener('click', onNextClick);

	document.addEventListener('keydown', (e) => {
		switch (e.code) {
			case 'ArrowLeft':
				onPrevClick();
				break;
			case 'ArrowRight':
				onNextClick();
				break;
			default:
				break;
		}
	});
}

function onNextClick() {
	if (!isPresSet() || presentedIndex == presentation.length - 1) { return; }

	if (presentation[presentedIndex].marker != null) {
		presentation[presentedIndex].marker.setIcon(new L.Icon.Default);
	}

	++presentedIndex;
	setPhoto(presentation[presentedIndex].file);

	if (presentation[presentedIndex].marker != null) {
		presentation[presentedIndex].marker.setIcon(selectedMarkerIcon);
	}
}

function onPrevClick() {
	if (!isPresSet() || presentedIndex == 0) { return; }

	if (presentation[presentedIndex].marker != null) {
		presentation[presentedIndex].marker.setIcon(new L.Icon.Default);
	}

	--presentedIndex;
	setPhoto(presentation[presentedIndex].file);

	if (presentation[presentedIndex].marker != null) {
		presentation[presentedIndex].marker.setIcon(selectedMarkerIcon);
	}
}

function isPresSet() {
	return presentation && presentation.length != null && presentation.length > 0;
}

function present() {
	if (uploadInput.files.length <= 0) {
		return;
	}

	resetPresentation(presentation);

	createPresentation(uploadInput.files).then((_presentation) => {
		presentation = _presentation;
		// reversing, because usually pictures are loaded from newest to oldest
		presentation.reverse(); 

		setFirstPhoto(presentation);
		setFirstMarker(presentation);
	});
}


function resetPresentation(presentation) {
	if (presentation == null) { return; }

	let markers = presentation.map((pres) => pres.marker);

	for (let marker of markers) {
		if (markerNotNull(marker)) {
			map.removeLayer(marker);
		}
	}

	imageContainer.style.backgroundImage = "url('')";

	presentation = undefined;
	presentedIndex = -1;
}

function createPresentation(imgFiles) {
	return plotLocations(imgFiles).then((markers) => {
		return markers.map((marker, i) => ({
			file: imgFiles[i],
			marker
		})) 
	});
}

function setFirstPhoto(presentation) {
	if (presentation.length == 0) { return; }

	presentedIndex = 0;
	setPhoto(presentation[0].file);
}

function setFirstMarker(presentation) {
	if (presentation.length == 0 || presentation[0].marker == null) { return; }

	presentation[0].marker.setIcon(selectedMarkerIcon);
}

function setPhoto(file) {
	imageContainer.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
}

function plotLocations(imgFiles) {
	let locationPromises = [];
	for (let i = 0; i < imgFiles.length; ++i) {
		locationPromises.push(locationFromFile(imgFiles[i]));
	}

	return Promise.all(locationPromises).then((locations) => {
		let markers = locations.map((latLon) => L.marker(latLon));

		for (let i = 0; i < markers.length; ++i) {
            if (markerNotNull(markers[i])) {
				markers[i].addTo(map); 
			}
		}

		setMapView(map, markers); 

		return markers;
	});
}

function markerNotNull(marker) {
	return marker && marker.getLatLng();
}

function locationFromFile(imgFile) {
	return new Promise((resolve, reject) => {
	    EXIF.getData(imgFile, function() {
	    	resolve(getLatLon(this.exifdata));
		});
	});
}

function getLatLon(exifdata) {
	if (exifdata.GPSLatitude == null ||
		exifdata.GPSLatitudeRef == null ||
		exifdata.GPSLongitude == null ||
		exifdata.GPSLongitudeRef == null
	) {
		return null;
	}

    // Calculate latitude decimal
    var latDegree = exifdata.GPSLatitude[0].numerator;
    var latMinute = exifdata.GPSLatitude[1].numerator;
    var latSecond = exifdata.GPSLatitude[2].numerator;
    var latDirection = exifdata.GPSLatitudeRef;
    
    var latFinal = ConvertDMSToDD(latDegree, latMinute, latSecond, latDirection);
    
    // Calculate longitude decimal
    var lonDegree = exifdata.GPSLongitude[0].numerator;
    var lonMinute = exifdata.GPSLongitude[1].numerator;
    var lonSecond = exifdata.GPSLongitude[2].numerator;
    var lonDirection = exifdata.GPSLongitudeRef;
    
    var lonFinal = ConvertDMSToDD(lonDegree, lonMinute, lonSecond, lonDirection);

	return [latFinal, lonFinal];
}

function ConvertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = degrees + (minutes/60) + (seconds/3600);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    }

    return dd;
}

function setMapView(map, markers) {
	markers = markers.filter(markerNotNull);

	if (markers.length == 0) { return; }

	let markerGroup = new L.featureGroup(markers);

	map.fitBounds(markerGroup.getBounds().pad(0.01));
}
