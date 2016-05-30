var mataTabi = angular.module('mataTabi',[]);

mataTabi.controller('AppCtrl', function($scope, $http){

	console.log("from controller");

	var refresh = function(){
		$http.get('/spotlist').success(function(response){
			console.log("i got the data");
			$scope.spotlist = response;
			$scope.spot = "";
		});
	};

	refresh();

	$scope.addSpot = function (){
		console.log($scope.spot);
		$http.post('/spotlist', $scope.spot).success(function(response){
			console.log(response);
			refresh();
			document.location.reload();
		});
	};

	$scope.remove = function(id){
		console.log(id);
		$http.delete('/spotlist/' + id).success(function(response){
			refresh();
		});
	};

	$scope.edit = function(id){
		console.log(id);
		$http.get('/spotlist/' + id).success(function (response){
			$scope.spot = response;
		});
	};

	$scope.update = function(){
		$http.put('/spotlist/' + $scope.spot._id,$scope.spot).success(function(response){
			refresh();
		});
	};

	$scope.deselect = function(){
		$scope.spot = "";
	}

	$scope.openNew = function(){
		console.log("from location");   
    	window.location = 'new.html';
	}

	$scope.getImages = function(){
		$http.get('/rawImageData/').success(function(response){
			$scope.images = response;
		});
	};

	$scope.getTwitterComments = function(){
		$http.get('/rawTweetData/').success(function(response){
			$scope.twitterComments = response;
		});
	};

	//スポット位置検索
	$scope.codeAddress = function(){

		geocoder = new google.maps.Geocoder();
		var address = $('#my-address').val();
		console.log(address);

		geocoder.geocode( { 'address': address}, function(results, status) {
		  	if (status == google.maps.GeocoderStatus.OK) {

		  		var latitude = results[0].geometry.location.lat();
		  		var longitude = results[0].geometry.location.lng();

		  		var output = document.getElementById("out");
		   		output.innerHTML = '<p>緯度 ' + latitude + '° <br>軽度 ' + longitude + '°</p>';
		   		$('#lat').val(latitude);
		 		$('#lon').val(longitude);

		  		var img = new Image();
				img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=13&size=300x300&sensor=true";
				output.appendChild(img);

				$('#plus-location').removeClass('hidden');
		  	} 
		  	else {
		    alert("Geocode was not successful : " + status);
		  	}
		});
	};

	//位置情報登録
	$scope.addLocation= function(){
		console.log($('#lat').val());
		console.log($('#lon').val());
		$scope.spot.lat = $('#lat').val();
	    $scope.spot.lon = $('#lon').val();
	    $('#plus-location').addClass('hidden');
	};

	//選択した写真を登録処理
	$scope.setImages = function(model,photo){
		switch(model){
			case 'photo1':
			$scope.spot.photo1 = photo;
			break;
			case 'photo2':
			$scope.spot.photo2 = photo;
			break;
			case 'photo3':
			$scope.spot.photo3 = photo;
			break;
			case 'photo4':
			$scope.spot.photo4 = photo;
			break;
			case 'photo5':
			$scope.spot.photo5 = photo;
			break;
			case 'photo6':
			$scope.spot.photo6 = photo;
			break;
			case 'photo7':
			$scope.spot.photo7 = photo;
			break;
			case 'photo8':
			$scope.spot.photo8 = photo;
			break;
			case 'photo9':
			$scope.spot.photo9 = photo;
			break; 
			case 'photo10':
			$scope.spot.photo10 = photo;
			break;
			case 'photo11':
			$scope.spot.photo11 = photo;
			break;
			case 'photo12':
			$scope.spot.photo12 = photo;
			break;
			case 'photo13':
			$scope.spot.photo13 = photo;
			break;
			case 'photo14':
			$scope.spot.photo14 = photo;
			break;
			case 'photo15':
			$scope.spot.photo15 = photo;
			break;
			case 'photo16':
			$scope.spot.photo16 = photo;
			break;
			case 'photo17':
			$scope.spot.photo17 = photo;
			break;
			case 'photo18':
			$scope.spot.photo18 = photo;
			break;
			case 'photo19':
			$scope.spot.photo19 = photo;
			break;
			case 'photo20':
			$scope.spot.photo20 = photo;
			break;
			case 'photo21':
			$scope.spot.photo21 = photo;
			break;
			case 'photo22':
			$scope.spot.photo22 = photo;
			break;
			case 'photo23':
			$scope.spot.photo23 = photo;
			break;
			case 'photo24':
			$scope.spot.photo24 = photo;
			break;
			case 'photo25':
			$scope.spot.photo25 = photo;
			break;
			case 'photo26':
			$scope.spot.photo26 = photo;
			break;
			case 'photo27':
			$scope.spot.photo27 = photo;
			break;
			case 'photo28':
			$scope.spot.photo28 = photo;
			break;
			case 'photo29':
			$scope.spot.photo29 = photo;
			break;
			case 'photo30':
			$scope.spot.photo30 = photo;
			break;

		}	
	};

});


//添付ファイル(写真)処理
mataTabi.directive('appFileread', function($q) {
    var slice = Array.prototype.slice;

    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel) {
                if (!ngModel) return;

                ngModel.$render = function() {};

                element.bind('change', function(e) {
                    var element = e.target;

                    $q.all(slice.call(element.files, 0).map(readFile))
                        .then(function(values) {
                            if (element.multiple) ngModel.$setViewValue(values);
                            else ngModel.$setViewValue(values.length ? values[0] : null);
                        });

                    function readFile(file) {
                        var deferred = $q.defer();

                        var reader = new FileReader();
                        reader.onload = function(e) {
                            deferred.resolve(e.target.result);
                        };
                        reader.onerror = function(e) {
                            deferred.reject(e);
                        };
                        reader.readAsDataURL(file);

                        return deferred.promise;
                    }

                }); //change

            } //link
    }; //return
});







