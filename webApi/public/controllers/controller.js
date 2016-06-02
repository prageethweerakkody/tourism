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

    //　ログアウト
    $scope.logout = function(){
        console.log('logout');
        $http.get('/logout').success(function(response){
            window.location = 'index.html';
        });
    };

    // 制御盤画面へ
    $scope.openControl = function(){
       $http.get('/control').success(function(response){
            window.location = 'control.html';
        });
    }; 

    // スポット一覧画面へ 
    $scope.openSpotList = function(){
       $http.get('/spotlist').success(function(response){
            //refresh();
            window.location = 'spot_list.html'
        });
    };

    // ユーザー登録画面へ
    $scope.openUserRegister = function(){
       $http.get('/user_register').success(function(response){
           window.location = 'user_register.html'
        }); 
    };

    // アプリ情報登録画面へ
    $scope.openAppRegister = function(){
       $http.get('/app_register').success(function(response){
           window.location = 'app_register.html'
        });
    };

    $scope.addSpot = function (){
        console.log($scope.spot);
        $scope.spot.fb_created_time = $('#fb-time').val();
            
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

    //twitter コメント
    $scope.getTwitterComments = function(){
        $http.get('/rawTweetData/').success(function(response){
            $scope.twitter_comments = response;
        });
    };

    //facebookの写真取得
    $scope.getFacebookData = function(){
        $http.get('/rawFacebookData/').success(function(response){
            $scope.facebook_data = response;
        });
    };

    $scope.setFacebookTime = function(time){
        console.log(time);
        $('#fb-time').val(time);

    };

    //ページリロード
    $scope.openFacebook = function(){
        $('#fb-time').val('');
        window.location = 'new_facebook.html';
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
    $scope.setImages = function(model,photo,condition,imageId){
        switch(model){
            case 'photo1':
            if (condition == 'true') {
                $scope.spot.photo1 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo1 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }
            
            break;
            case 'photo2':if (condition == 'true') {
                $scope.spot.photo2 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo2 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }
            break;
            case 'photo3':
           if (condition == 'true') {
                $scope.spot.photo3 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo3 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }            break;
            case 'photo4':
            if (condition == 'true') {
                $scope.spot.photo4 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo4 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }
            break;
            case 'photo5':
            if (condition == 'true') {
                $scope.spot.photo5 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo5 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }
            break;
            case 'photo6':
          if (condition == 'true') {
                $scope.spot.photo6 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo6 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }
            break;
            case 'photo7':
           if (condition == 'true') {
                $scope.spot.photo7 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo7 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }
            break;
            case 'photo8':
            if (condition == 'true') {
                $scope.spot.photo8 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo8 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }
            break;
            case 'photo9':
            if (condition == 'true') {
                $scope.spot.photo9 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo9 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }
            break; 
            case 'photo10':
            if (condition == 'true') {
                $scope.spot.photo10 = photo;
                $('#' + imageId).fadeTo("slow", 0.15);
            }else {
                $scope.spot.photo10 = '';
                $('#' + imageId).fadeTo("slow", 1);  
            }
            break;

        }   
    };

    // Admin Register - temp admin addition
    $scope.addUser = function(){
        $http.post('/register', $scope.user).success(function(response){
            window.location = 'login.html';
        });
    };

    // User Register
    $scope.registerUser = function(){
        $http.post('/user_register', $scope.user).success(function(response){
            window.location = 'user_register.html';
        });
    };

    // Application info register
    $scope.registerApp = function(){
        $http.post('/app_register', $scope.app).success(function(response){
            window.location = 'app_register.html';
        });
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
