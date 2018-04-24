// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

var restUrl = "http://cardemo.dev.intellecteu.com:9999/catalyst/mobile/"

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

function httpGetTransactions(url, email, cbf)
{
  let xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url + email, true );

  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState != 4) return;

    if (xmlHttp.status == 200 || xmlHttp.status == 201) {
      cbf(xmlHttp);
    }
  }

  xmlHttp.send(null);
}

function processResponse(xmlHttp) {
  jsonObj = xmlHttp.responseText == "" ? "[]" : JSON.parse(xmlHttp.responseText)

  return {
    status: xmlHttp.status,
    jsonObj: jsonObj
  };
}

function httpGetSendDecision(url, email, transactionId, decision)
{
  let xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url + email + "/" + transactionId + "/" + decision, true);

  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState != 4) return;

    if (xmlHttp.status == 200) {
      // console.log("All right")
    }
    else {
      // console.log("Thank you Orest")
    }
  }

  xmlHttp.send(null);
}

function makeCard(transaction) {

  let card = document.createElement('div');
  card.id = 'card-box' + transaction.payment_id;
  card.className = 'animated fadeIn card-box card-box-less';
  card.innerHTML =
    '<div class="status-box ' + getCardStatusClass(transaction.status) + '" id="status-box' + transaction.payment_id + '">'
      + '<div class="status-indent"></div>'
      + '<div class="status-name">'
        + '<p class="status" id="status' + transaction.payment_id + '">' + transaction.status + '</p>'
      + '</div>'
      + '<div class="status-indent"></div>'
    + '</div>'
    + '<div class="data-box">'
      + '<div class="header">'
        + '<h4>' + transaction.created_at + '</h4>'
      + '</div>'
      + '<div class="body">'
        + '<div class="body-always">'
           + '<p>Premium: $' + transaction.premium + '</p>'
        + '</div>'
        + '<div class="body-more-none" id="body-more' + transaction.payment_id + '">'
          + '<p>Mileage: ' + transaction.delta_miles + ' miles</p>'
          + '<p>Car: ' + transaction.car_id + '</p>'
          + getButtonsHtml(transaction.status, transaction.payment_id)
        + '</div>'  // body-more-none
        + '<div class="more-btn">'
          + '<a id="more-btn' + transaction.payment_id + '">More</a>'
        + '</div>'
      + '</div>' // body
    + '</div>' // data-box

  return card;
}

function getCardStatusClass(status) {
  switch(status) {
    case "USER_APPROVED": return 'status-box-process'
    case "PAID": return 'status-box-success'
    case "USER_REJECTED": return 'status-box-fail'
    case "BANK_REJECTED": return 'status-box-fail'
    case "BANK_PENDING": return 'status-box-process'
    default: return 'status-box-new'
  }
}

function getButtonsHtml(status, payment_id) {
  if (status != 'NEW') {
    return "";
  }

  let buttons =
  '<div class = "row" id="buttons' + payment_id + '">'
    + '<div class = "">'
      + '<button class="button button-block button-balanced" id="appBtn' + payment_id + '" ng-click="approve()">Approve</button>'
    + '</div>'
    + '<div class = "">'
      + '<button class="button button-block button-assertive" id="rejBtn' + payment_id + '" ng-click="reject()">Reject</button>'
    + '</div>'
  + '</div>' // row

  return buttons;
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
        url: '/login/',

        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
      })

      .state('transactions', {
        url: '/transactions/',

        templateUrl: 'templates/transactions.html',
        controller: 'transactionsCtrl'
      });

    $urlRouterProvider.otherwise('/login/');
  })

  .controller('loginCtrl', function ($scope, $state) {

    $scope.login = function (user) {

      btn = document.getElementById("loginBtn");

      email = document.getElementById("email")

      if (typeof user == "undefined") {
        email.classList.add("error");
        return;
      }

      email.classList.remove("error");
      btn.disabled = true;
      $scope.userData = {
        email: user.email,
        password: user.password
      };

      $state.appData = {};
      $state.appData["user"] = $scope.userData;
      httpGetTransactions(restUrl, user.email, loginUser);
    }

    function loginUser(xmlHttp) {
      response = processResponse(xmlHttp)
      document.getElementById("loginBtn").disabled = false;
      if (response.status != 200) {
        alert("Wrong email or password")
        $state.go('login');
      }
      else {
        jsonObj = beautifyTransactions(response.jsonObj)

        $state.appData["transactions"] = jsonObj;
        $state.go('transactions');
      }
    }
  })

  .controller('transactionsCtrl', function ($scope, $state, $http) {

    function updateTransactions() {
      if (typeof $state.appData === "undefined" || typeof $state.appData["transactions"] === "undefined") {
        $state.go("login");
      }
      else {
        transactions = $state.appData["transactions"]

        transactions.forEach(transaction => {

          let existingCard = document.getElementById("card-box" + transaction.payment_id)

          // If there is such card => update it
          if (existingCard) {
            updateCard(transaction.payment_id, transaction.status)
          }

          // else add new card
          else {

            // create card
            let newCard = makeCard(transaction)

            // add card
            let cardList = document.getElementById("cards")

            if (cardList) {
              cardList.insertAdjacentElement('afterbegin', newCard)

              // add eventListeners
              let moreBtn = document.getElementById('more-btn' + transaction.payment_id)
              moreBtn.addEventListener("click", moreBtnClicked)

              if (transaction.status == 'NEW') {
                let approveBtn = document.getElementById('appBtn' + transaction.payment_id)
                approveBtn.addEventListener("click", approveBtnClicked)
                let rejectBtn = document.getElementById('rejBtn' + transaction.payment_id)
                rejectBtn.addEventListener("click", rejectBtnClicked)
              }
            }
          }
        });


        // Update transactions
        httpGetTransactions(restUrl, $state.appData["user"]["email"], updateTransactionList);
      }
    }

    function updateTransactionList(xmlHttp) {
      response = processResponse(xmlHttp)
      if (response.status != 200) {
        $state.go('login');
      }
      else {
        transactions = response.jsonObj;
        $state.appData["transactions"] = beautifyTransactions(transactions);
      }
    }

    function updateCard(payment_id, status) {
      if (status == "NEW") {
        return;
      }

      let cardBox = document.getElementById('card-box' + payment_id)
      let moreBtn = document.getElementById('more-btn' + payment_id)

      // change status text
      // change status box class
      changeStatus(payment_id, status)

      if (status != 'NEW') {
        let approveButton = document.getElementById('appBtn' + payment_id)
        if (approveButton) {

          // remove buttons
          approveButton.parentElement.parentElement.remove();

          // hide space
          if (moreBtn.innerText == "Less") {
            cardBox.classList.remove("card-box-more-new");
            cardBox.classList.remove("card-box-more-processed");
            cardBox.classList.add("card-box-more-processed")
          }
        }
      }
    }

    function moreBtnClicked() {
      let payment_id = this.id.substr(8)
      let status = document.getElementById('status' + payment_id).innerText
      let cardBox = document.getElementById('card-box' + payment_id)
      let bodyMore = document.getElementById('body-more' + payment_id)

      if (this.innerText == "More") {
        this.innerText = "Less"
        cardBox.classList.remove("card-box-less");
        if (status == 'NEW') {
          cardBox.classList.add("card-box-more-new")
        }
        else {
          cardBox.classList.add("card-box-more-processed")
        }

        bodyMore.classList.remove("body-more-none");
        bodyMore.classList.add("body-more-visible")
      }
      else {
        this.innerText = "More"
        cardBox.classList.remove("card-box-more-new");
        cardBox.classList.remove("card-box-more-processed");
        cardBox.classList.add("card-box-less")

        bodyMore.classList.remove("body-more-visible");
        bodyMore.classList.add("body-more-none")
      }

      return false;
    }

    function approveBtnClicked() {
      let payment_id = this.id.substr(6)
      let cardBox = document.getElementById('card-box' + payment_id)

      // change status text
      // change status box class
      changeStatus(payment_id, 'USER_APPROVED')

      // remove buttons
      this.parentElement.parentElement.remove();

      // change card-box-more
      cardBox.classList.remove("card-box-more-new");
      cardBox.classList.add("card-box-more-processed");

      // send decision
      httpResponce = httpGetSendDecision(
        restUrl,
        $state.appData["user"]["email"],
        payment_id,
        "user_approved"
      )

      return false;
    }

    function rejectBtnClicked() {
      let payment_id = this.id.substr(6)
      let cardBox = document.getElementById('card-box' + payment_id)

      // change status text
      // change status box class
      changeStatus(payment_id, 'USER_REJECTED')

      // remove buttons
      this.parentElement.parentElement.remove();

      // change card-box-more
      cardBox.classList.remove("card-box-more-new");
      cardBox.classList.add("card-box-more-processed");

      // send decision
      httpResponce = httpGetSendDecision(
        restUrl,
        $state.appData["user"]["email"],
        payment_id,
        "user_rejected"
      )

      return false;
    }

    function changeStatus(payment_id, status) {
      let statusBox = document.getElementById('status-box' + payment_id)
      let statusText = document.getElementById('status' + payment_id)

      statusBox.classList.remove('status-box-new')
      statusBox.classList.remove('status-box-process')
      statusBox.classList.remove('status-box-fail')
      statusBox.classList.remove('status-box-success')

      statusBox.classList.add(getCardStatusClass(status))

      statusText.innerText = status
    }

    // Put all transactions
    setInterval(updateTransactions, 1000);

    $scope.logout = function () {
      $state.go('login');
    }

  })
