app.factory('utilSrv', function (requestManagerService,$q,$window) {

    return {
        addDetail : function(array,contactType){// $scope.userProfile.contactInformation
          array.push({contactType: contactType, contactValue: ''});
          var mobilePhoneNumber = [],
             personalPhoneNumber = [],
             officePhoneNumber = [],
             emailAddress = [],
             others = [];

          for(var i = 0; array &&  i < array.length; i++){
                if(array[i].contactType === 'mobilePhoneNumber'){
                    mobilePhoneNumber.push(array[i]);
                }
                else if(array[i].contactType === 'personalPhoneNumber'){
                    personalPhoneNumber.push(array[i]);
                }
                else if(array[i].contactType === 'officePhoneNumber'){
                    officePhoneNumber.push(array[i]);
                }
                else if(array[i].contactType === 'emailAddress'){
                    emailAddress.push(array[i]);
                }
                else{
                    others.push(array[i]);
                }
             }

             array = mobilePhoneNumber.concat(personalPhoneNumber, officePhoneNumber,emailAddress,others);
              return array;
        },
        setSocialNetworksServerFormat : function(userSocialAccountsData){
            var socialNewtorks = [];

            if(userSocialAccountsData['facebook']){
              socialNewtorks.push({name:'facebook', URL: userSocialAccountsData['facebook']});
            }

            if( userSocialAccountsData['linkedIn']){
              socialNewtorks.push({name:'linkedIn', URL: userSocialAccountsData['linkedIn']});
            }
             if(userSocialAccountsData['googlePlus']){
              socialNewtorks.push({name:'googlePlus', URL: userSocialAccountsData['googlePlus']});
            }
             if( userSocialAccountsData['twitter']){
              socialNewtorks.push({name:'twitter', URL: userSocialAccountsData['twitter']});
            }

            return socialNewtorks;
       },

        isChecked: function(checkVal, checkValName){
            if(checkValName && checkValName && checkValName == checkVal){
                return true;
            }
            return false;

        },


        setType: function(array, type){
            var newArray = [];
                if(type == "lead") {
                    for(var i = 0 ; array && i < array.length; i++) {
                        newArray.push({
                            id: array [i].id,
                            name: array [i].leadName,
                            taskType: type
                        });
                    }
                }
                if(type == "deal") {
                    for(var i = 0 ; array && i < array.length; i++) {
                        newArray.push({
                            id: array [i].id,
                            name: array [i].dealName,
                            taskType: type
                        });
                    }
                }

                return newArray;
        },

        setImage  :  function(imageURL){
            return imageURL || 'images/placeholder_contact-photo.png';
        },

        createdAgo : function (timeframe){
                if (timeframe > 0) {
                    var time = timeframe / 1000;
                    var min = time / 60;
                    var hours = min / 60;

                    if ($window.Math.floor(hours) == 0) {
                        return $window.Math.floor(min) + "m";
                    } else if ($window.Math.floor(hours) < 24) {
                        return $window.Math.floor(hours) + "h";
                    } else {
                            return $window.Math.floor(hours / 24) + "d, " + $window.Math.floor(hours % 24) + "h";
                    }
                }
        },

        getFormattedAmount : function(amount){
            if (amount) {
                if (amount / 1000000000 > 1) {
                    return parseFloat((amount / 1000000000).toFixed(1)) + 'bn';
                } else if (amount / 1000000 > 1) {
                    return parseFloat((amount / 1000000).toFixed(1)) + 'm';
                } else if ((amount / 100000 > 1) || (amount / 10000 > 1) || (amount / 1000 > 1)) {
                    return parseFloat((amount / 1000).toFixed(1)) + 'k';
                } else {
                    return parseFloat(amount);
                }
            }
        },

        validateLetters : function (evt) {
            var theEvent = evt || window.event;
            var key = theEvent.keyCode || theEvent.which;
            key = String.fromCharCode(key);
            var regex = /^[-A-Za-z .,]+$/;
            if (!regex.test(key)) {
                theEvent.returnValue = false;
                if (theEvent.preventDefault) {
                    theEvent.preventDefault();
                }
            }
        },

        resizeContainer : function (){
            var clientWHeight = $(window).height();
            var clientHeight = clientWHeight - 50;

            var mainLeftStyle = {
                height : clientHeight + 'px',
                minHeight: '475px'
            };
            var asideStyle = {
                height : clientHeight - 10 + 'px',
                minHeight: '500px'
            };
            var sbStyle = {
                height : clientHeight-90 + 'px'
            };

            var tsStyle = {
                height : clientHeight-117 + 'px',
                minHeight: '500px',
                overflow: 'auto'
            };
            var llStyle = {
                height : clientHeight-135 + 'px',
                minHeight: '475px',
                overflow: 'auto'
            };

            var pmsbStyle = {
                height : clientHeight-280 + 'px',
                overflow: 'auto'
            };

            var tplStyle = {
                height : clientHeight-290 + 'px',
                overflow: 'auto'
            };

            var tplImportStyle = {
                height : clientHeight-350 + 'px',
                overflow: 'auto'
            };

            var dashboardStyle = {
                height : clientHeight-130 + 'px',
                minHeight:'430px'
            };

            var dashboardResetStyle = {
                height : '430px'
            };

            angular.element('.main-left').css(mainLeftStyle);
            angular.element('aside.right').css(asideStyle);
            angular.element('.scroll-box').css(sbStyle);

            angular.element('#task-scheduler').css(tsStyle);
            angular.element('#list-view').css(sbStyle);
            angular.element('#leads-list').css(llStyle);
            angular.element('#deal-view-scroll').css(pmsbStyle);
            angular.element('#probable-scroll').css(pmsbStyle);
            angular.element('.tplPerson').css(tplStyle);
            angular.element('.import-vcard').css(tplImportStyle);
//            angular.element('#deal-sheet').css(llStyle);
            angular.element('#deal-timeline').css(llStyle);
            if(clientHeight>760){
                angular.element('.subset-tasks').css(dashboardStyle);
                angular.element('.subset-deals').css(dashboardStyle);
                angular.element('.tasks-box').css(dashboardStyle);
                angular.element('.deals-box').css(dashboardStyle);
            }else{
                angular.element('.subset-tasks').css(dashboardResetStyle);
                angular.element('.subset-deals').css(dashboardResetStyle);
                angular.element('.tasks-box').css(dashboardResetStyle);
                angular.element('.deals-box').css(dashboardResetStyle);
            }
        }
    }
});

app.service('anchorSmoothScroll', function(){

    this.scrollTo = function(eID) {

        // This scrolling function
        // is from http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript

        var startY = currentYPosition();
        var stopY = elmYPosition(eID);
        var distance = stopY > startY ? stopY - startY : startY - stopY;
        if (distance < 100) {
            scrollTo(0, stopY); return;
        }
        var speed = Math.round(distance);
        if (speed >= 20) speed = 20;
        var step = Math.round(distance / 50);
        var leapY = stopY > startY ? startY + step : startY - step;
        var timer = 0;
        if (stopY > startY) {
            for ( var i=startY; i<stopY; i+=step ) {
                setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
                leapY += step; if (leapY > stopY) leapY = stopY; timer++;
            } return;
        }
        for ( var i=startY; i>stopY; i-=step ) {
            setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
            leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
        }

        function currentYPosition() {
            // Firefox, Chrome, Opera, Safari
            if (self.pageYOffset) return self.pageYOffset;
            // Internet Explorer 6 - standards mode
            if (document.documentElement && document.documentElement.scrollTop)
                return document.documentElement.scrollTop;
            // Internet Explorer 6, 7 and 8
            if (document.body.scrollTop) return document.body.scrollTop;
            return 0;
        }

        function elmYPosition(eID) {
            var elm = document.getElementById(eID);
            var y = elm.offsetTop;
            var node = elm;
            while (node.offsetParent && node.offsetParent != document.body) {
                node = node.offsetParent;
                y += node.offsetTop;
            } return y;
        }

    };

});