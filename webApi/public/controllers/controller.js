var mataTabi = angular.module('mataTabi',[]);

mataTabi.controller('AppCtrl', function($scope, $http){

  console.log("from controller");

  var refresh = function(){
    $http.get('/spotlist').success(function(response){
      $scope.spotlist = response;
      $scope.spot = '';
      $scope.spotToEdit = '';
    });
  };

  var refreshMySpotList = function(){
    $http.get('/myspotlist').success(function(response){
      $scope.mySpotList = response;
      $scope.spotlist = response;
      $scope.spot = '';
      $scope.spotToEdit = '';
    });
  };

  var refreshUserList = function(){
    $http.get('/userlist').success(function(response){
      $scope.userlist = response;
      //$scope.user = response;
      $scope.userToEdit = '';
      $scope.noImages = false;
    });
  };

  var refreshAppList = function(){
    $http.get('/applist').success(function(response){
      $scope.applist = response;
      //$scope.app = '';
      $scope.appToEdit = '';
      $scope.myApp = false;
      $scope.noImages = false;
    });
  };

  refresh();
  refreshUserList();
  refreshAppList();
  refreshMySpotList();

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

  // mypageへ
  $scope.openMyPage = function(){
    window.location = 'mypage.html';
  };

  // マイスポット一覧画面へ
  $scope.openMySpotList = function(){
      $http.get('/myspotlist').success(function(response){
          window.location = 'my_spot_list.html';
    });
  };

  // スポット一覧画面へ
  $scope.openSpotList = function(){
     $http.get('/spotlist').success(function(response){
      window.location = 'spot_list.html'
    });
  };

  // ユーザー一覧画面へ
  $scope.openUserList = function(){
     $http.get('/userlist').success(function(response){
       $scope.userlist = response;
       window.location = 'user_list.html'
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

  // アプリ一覧画面へ
  $scope.openAppList = function(){
     $http.get('/applist').success(function(response){
       window.location = 'app_list.html'
    });
  };

  // ユーザー削除
  $scope.removeUser = function(id){
    if (confirm("本当に削除してもいいですか？")) {
      $http.delete('/userlist/' + id).success(function(response){
        refreshUserList();
      });
    }
  };

  // ユーザー登録 User Register
  $scope.registerUser = function(){
    $http.post('/user_register', $scope.user).success(function(response){
      window.location = 'control.html';
    });
  };

  // ユーザー編集
  $scope.editUser = function(id){
    console.log("...")
    $http.get('/userlist/' + id).success(function (response){
      $scope.userToEdit = response;
    });
  };

  // ユーザー編集(データを実際に変更)
  $scope.updateUser = function(){
    $http.put('/userlist/' + $scope.userToEdit._id,$scope.userToEdit).success(function(response){
      refreshUserList();
    });
  };

  // 担当アプリ情報取得
  $scope.getMyApp = function(){
    $http.get('/app').success(function (response){
      $scope.myApp = response;
    });
  };

  // 担当アプリ編集(データを実際に変更)
  $scope.updateMyApp = function(){
    $http.put('/app/' + $scope.myApp._id,$scope.myApp).success(function(response){
      // refreshAppList();
      $scope.myApp = false;
    });
  };
  // アプリ削除
  $scope.removeApp = function(id){
    if (confirm("本当に削除してもいいですか？")) {
      $http.delete('/applist/' + id).success(function(response){
        refreshAppList();
      });
    }
  };

  // アプリ登録
  $scope.registerApp = function(){
    $http.post('/app_register', $scope.app).success(function(response){
      window.location = 'app_list.html';
    });
  };

  // アプリ編集/登録
  $scope.editApp = function(id){
    $http.get('/applist/' + id).success(function (response){
      $scope.appToEdit = response;
      $scope.hideTable = true;
    });
  };

  // アプリ編集/登録(データを実際に変更)
  $scope.updateApp = function(){
    $http.put('/applist/' + $scope.appToEdit._id,$scope.appToEdit).success(function(response){
      $scope.hideTable = false;
      refreshAppList();
    });
  };

  // スポット追加
  $scope.addSpot = function (){
    console.log($scope.spot);
    $scope.spot.fb_created_time = $('#fb-time').val();

    $http.post('/spotlist', $scope.spot).success(function(response){
      console.log(response);
      refreshMySpotList();
      window.location = 'my_spot_list.html';
    });
  };

  // スポット削除
  $scope.removeSpot = function(id){
    if (confirm("本当に削除してもいいですか？")) {
      console.log(id);
      $http.delete('/spotlist/' + id).success(function(response){
        refresh();
        refreshMySpotList();
      });
    }
  };

  // スポット画像削除
  $scope.removeImage = function(imageNumber){
    //var imageNumber = imageNumber;
    if (confirm("本当に削除してもいいですか？")) {
        $http.put('/spotlist/' + $scope.spotToEdit._id + '/' + imageNumber).success(function(response){
            //console.log(response);
            $scope.spotToEdit[response] = null;
        });
    } 
  };

  //選択した写真を登録処理
  $scope.setImages = function(model,photo,condition,imageId){
      console.log('entered');
    // facebook data has this property, instagram data doesn't
    var isFromFacebook = Boolean(photo.created_time);

    var approvalObject = {
      id: photo["_id"],
      collectionName: (isFromFacebook ? "rawFacebookData" : "rawImageData"),
      approvalStatus: true
    };
      console.log('OutsideStill');
    if (condition == 'true') {
      console.log('Entered');
      $scope.spot[model] = (isFromFacebook ? photo.full_picture : photo.display_src);
      $('#' + imageId).fadeTo("slow", 0.15);

      $http.post('/approveItem', approvalObject).success(console.log);

    } else {
      console.log('Remove');
      $scope.spot[model] = '';
      $('#' + imageId).fadeTo("slow", 1);

      approvalObject.approvalStatus = false;
      $http.post('/approveItem', approvalObject).success(console.log);

    }

  };

  // Admin Register - temp admin addition
  $scope.addUser = function(){
    $http.post('/register', $scope.user).success(function(response){
      window.location = 'login.html';
    });
  };

    // スポット編集
    $scope.editSpot = function(id){
        //console.log(id);
        //getTwitterComments();
        $http.get('/spotlist/' + id).success(function (response){
            $scope.spotToEdit = response;
            $scope.hideTable = true;
        });
    };

    // スポットのトップ画像選択
    $scope.selectTopImage = function(id){
        $http.get('/spotlist/' + id).success(function (response){
            $scope.spotToChooseImageFor = response;
            $scope.hideTable = true;
        });
    };

    // スポットのトップ画像を設定
    $scope.updateTopImage = function(path){
        var image = path; // pathとは「手動アップロード画像」、「Instagram画像」、「Facebook画像」の何れか
        $http.put('/topimage/' + $scope.spotToChooseImageFor._id + '/' + image).success(function(response){
            $scope.hideTable = false;
            $scope.spotToChooseImageFor = '';
        });
    };

    // 現在ログインしているユーザーの登録したスポットを取得
    // スポット編集(データを実際に変更)
    $scope.updateSpot = function(){
        $http.put('/spotlist/' + $scope.spotToEdit._id,$scope.spotToEdit).success(function(response){
            refresh();
            refreshMySpotList(); // データ更新を流用
            $scope.hideTable = false;
        });
    };

    $scope.deselect = function(){
        $scope.spot = "";
    }

    $scope.openNew = function(){
        //console.log("from location");
        //refreshAppList();
        window.location = 'new.html';
    }

    // Instagram画像取得
    $scope.getImages = function(){
        $http.get('/rawImageData/').success(function(response){
            $scope.images = response;
        });
    };

    // 該当スポットに関係している画像を取得
    $scope.getImagesForSpot = function(){
        $http.get('/rawImageData/' + $scope.spotToEdit._id).success(function(response){
            $scope.images = response;
            if(response.length === 0){
                $scope.noImages = true;
            }
        });
    };

    // 該当スポットに関係している最新のコメントを取得
    $scope.getTwitterCommentsForSpot = function(){
        $http.get('/rawTweetData/' + $scope.spotToEdit._id).success(function(response){
            $scope.twitter_comments = response;
        });
    };

    //twitter コメント
    /* this isn't currently used anywhere, and even if it was, the server
       wouldn't respond to the request properly. */
    $scope.getTwitterComments = function(){
        $http.get('/rawTweetData/').success(function(response){
            $scope.twitter_comments = response;
        });
    };

    // 最新のFacebookデータを取得
    $scope.getUserFacebookData = function(){
        $http.get('/userFacebookData/').success(function(response){
            $scope.facebook_data = response;
            $scope.facebook_image_data = response.filter((value)=>{return value.full_picture;});
        }).error(console.dir);
    };

    //facebookの写真取得
    $scope.getFacebookData = function(){
        $http.get('/rawFacebookData/').success(function(response){
            $scope.facebook_data = response;
            $scope.facebook_image_data = response.filter((value)=>{return value.full_picture;});
        }).error(console.dir);
    };

    $scope.setFacebookTime = function(time){
        console.log(time);
        $('#fb-time').val(time);
    };

    //ページリロード
    $scope.openFacebook = function(){
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
