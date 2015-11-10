/**
 * Created by bogdan on 06/10/14.
 */

app.controller('adminCtrl',
['$scope',
'$location',
'$rootScope',
'$q',
'errorService',
'requestManagerService',
function ($scope,
          $location,
          $rootScope,
          $q,
          errorService,
          requestManagerService)
{

    $scope.activeSection = "";
    $rootScope.tabs = [
    ];

    $rootScope.search = {
        hideSearch: true
    };

    var getOrgSettings = function () {
        var requestObj = {
            event: "settings",
            payload: {}
        }
        requestManagerService.organizationsRequest(requestObj)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    console.log('hiiiiiiasasaii'+JSON.stringify(response));
                    $scope.organization = response.payload;
                    $scope.dealQualifierStatuses = response.payload.dealQualifierStatuses;
                    $scope.dealMilestoneStatuses = response.payload.dealMilestoneStatuses;
                    $scope.dealProducts = response.payload.dealProducts;
                }
            });
    };

    $scope.collapse= function(section, value){
        $scope.sections={'structureCollapsed':false, 'industriesCollapsed':false,'financialCollapsed':false, 'dealsCollapsed':false, 'teamCollapsed':false, 'companyCollapsed':false};
        $scope.sections[section]=value;
    };

    if (localStorage['auth']) {
        $scope.isAuthenticated = true;
        getOrgSettings();
    }
    else {
        $scope.isAuthenticated = false;
    }

    if ($location.$$url === '/admin-console'){
        var wrapperStyle = {
            width:    '100%',
            minWidth: '1024px'
        };
        var contentStyle = {
            marginLeft: '30px',
            marginTop:  '-50px'
        };
        angular.element('.main-wrapper').css(wrapperStyle );
        angular.element('.main-content').css(contentStyle);
    }

}]);

app.controller('ScrollCtrl', function($scope, $location, anchorSmoothScroll) {

    $scope.scrollToElement = function (eID){
        // call $anchorScroll()
        anchorSmoothScroll.scrollTo(eID);

    };
});
