app.directive('adminCompanyDetails', function (requestManagerService, errorService, $rootScope, $location) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-company-details.html',
        link: function (scope, elemn, attr) {
            scope.validateNumber = function (evt) {
                var theEvent = evt || window.event;
                var key = theEvent.keyCode || theEvent.which;
                key = String.fromCharCode( key );
                var regex = /[0-9]|\./;
                if (!regex.test(key)) {
                    theEvent.returnValue = false;
                    if(theEvent.preventDefault) {
                        theEvent.preventDefault();
                    }
                }
            }

            scope.getCompanyDetails = function () {
                var requestObj = {
                    event: 'getOrganizationDetails',
                    payload: {}
                };
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.companyDetails = response.payload;
                        }
                    })
            }

            scope.updateCompany = function () {
                if (scope.companyDetails.logoImage.indexOf('http') !== -1) {
                    delete scope.companyDetails.logoImage;
                }
                var requestObj = {
                    event: "updateOrganizationDetails",
                    payload: scope.companyDetails
                };
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.companyDetails = response.payload;
                        }
                    });
            }

            $rootScope.$watch('uploadedImage', function (newVal, oldVal) {
                if (newVal) {
                    var path = $location.path().split('/');
                    var	isAdmin = path.indexOf('admin') > -1;
                    var base64String = newVal.resized.dataURL.split(',')[1];
                    if (scope.companyDetails && isAdmin) {
                        scope.companyDetails.logoImage = base64String;
                        scope.updateCompany();
                    }
                }
            });
        }
    };
});