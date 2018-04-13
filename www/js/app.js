// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

var restUrl = "http://ec2-34-230-71-5.compute-1.amazonaws.com:9999/catalyst/mobile/"

function setHumanTime(transaction) {
  transaction.created_at = String(new Date(transaction.created_at))
}

function setStatusUpper(transaction) {
  transaction.status = transaction.status.toUpperCase()
}

function beautifyTransactions(transactions) {
  transactions.forEach(setHumanTime)
  transactions.forEach(setStatusUpper)
  return transactions
}

function httpGetTransactions(url, email)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url + email, false );
    xmlHttp.send();
    jsonObj = xmlHttp.responseText == "" ? "[]" : JSON.parse(xmlHttp.responseText)

    return {
      status: xmlHttp.status,
      jsonObj: jsonObj
    };
}

function httpGetSendDecision(url, email, transactionId, decision)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url + email + "/" + transactionId + "/" + decision, false );
    xmlHttp.send();
    return {
      status: xmlHttp.status,
      jsonObj: "[]"
    };
}

function makeCoverCard(transaction) {
  var card = ""
  card += '<div style="cursor: pointer" class = "card list" id = card' + transaction.payment_id + '>'
  card += '<div class = "item item-divider">'
  card += '<p>Created on ' + transaction.created_at
  card += '<i style="float: right" class="icon ion-chevron-right"></i>'
  card += '</p>'
  card += '</div>'
  card += '<div class = "item item-text-wrap">'
  card += '<p>Premium is: ' + transaction.price + '</p>'
  card += '</div>'
  card += '<div class = "item item-divider">'
  card += '<p>Status is: ' + transaction.status + '</p>'
  card += '</div>'
  card += '</div>'
  return card;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



angular.module('Catalyst', ['ionic'])


  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

        // Don't remove this line unless you know what you are doing. It stops the viewport
        // from snapping when text inputs are focused. Ionic handles this internally for
        // a much nicer keyboard experience.
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider

      .state('login', {
        url: '/login',

        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
      })


      .state('description', {
        url: '/transactions/description',

        templateUrl: 'templates/description.html',
        controller: 'descriptionCtrl'
      })

      .state('transactions', {
        url: '/transactions',

        templateUrl: 'templates/transactions.html',
        controller: 'transactionsCtrl'
      });
      
    $urlRouterProvider.otherwise('/login');
  })

  .controller('loginCtrl', function ($scope, $state) {

    $scope.login = function (user) {
      
      $scope.userData = {
        email: user.email,
        password: user.password 
      };
      
      $state.appData = {};
      $state.appData["user"] = $scope.userData;
      httpResponce = httpGetTransactions(restUrl, user.email);
      if (httpResponce.status != 200) {
        alert("Wrong email or password")
        $state.go('login');
      }
      else {
        jsonObj = beautifyTransactions(httpResponce.jsonObj)
        
        $state.appData["transactions"] = jsonObj;
        $state.go('transactions', {"email" : user.email});
      }
    }

  })

  .controller('transactionsCtrl', function ($scope, $state, $http) {

    function updateTransactions() {
      if (typeof $state.appData === "undefined") {
        $state.go("login");
      }
      else {
        transactions = $state.appData["transactions"]

        newHTML = "";
        transactions.forEach(transaction => {
          newHTML = makeCoverCard(transaction) + newHTML;
        });

        if (document.getElementById("cards") != null) {

          document.getElementById("cards").innerHTML = newHTML;

          var cardsList = document.getElementById("cards").children;
          for (var i = 0; i < cardsList.length; i++) {
            var card = cardsList[i];

            card.addEventListener("click", function() {
              var id = this.id.substring(4);
              var transaction = {};
              transactions.forEach(t => {
                if (t.payment_id == id) {
                  transaction = t;
                }
              })

              $state.appData["current_transaction"] = transaction;
              $state.go('description');
            });
          }
        }

        
        // Update transactions
        httpResponce = httpGetTransactions(restUrl, $state.appData["user"]["email"]);

        if (httpResponce.status != 200) {
          $state.go('login');
        }
        else {
          transactions = httpGetTransactions(restUrl, $state.appData["user"]["email"]).jsonObj;

          $state.appData["transactions"] = beautifyTransactions(transactions);
        }
      }
    }

    if(typeof $state.appData === "undefined") {
      $state.go("login");
    }
    else {
      var globalAppData = $state.appData

      // Put all transactions
      setInterval(updateTransactions, 1000);
    }

    $scope.logout = function () {
      $state.go('login');
    }

  })

  .controller('descriptionCtrl', function ($scope, $state, $http, $stateParams) {

    $scope.transaction = $state.appData["current_transaction"];
    
    $scope.goBack = function () {
      $state.go('transactions');
    }

    $scope.approve = function () {
      if(typeof $state.appData === "undefined") {
        $state.go("login");
      }
      else {
        document.getElementById("status").innerText = "IN PROGRESS"
        document.getElementById("decisionButtons").style.display = "none";
        httpResponce = httpGetSendDecision(
          restUrl, 
          $state.appData["user"]["email"], 
          $state.appData["current_transaction"]["payment_id"],
          "approved"
        )
      }
    }

    $scope.reject = function () {
      if(typeof $state.appData === "undefined") {
        $state.go("login");
      }
      else {
        document.getElementById("status").innerText = "REJECTED"
        document.getElementById("decisionButtons").style.display = "none";
        httpResponce = httpGetSendDecision(
          restUrl, 
          $state.appData["user"]["email"], 
          $state.appData["current_transaction"]["payment_id"],
          "rejected"
        )
      }
    }
  });
