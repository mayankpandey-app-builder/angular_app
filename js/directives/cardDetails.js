app.directive('cardDetails', ['errorModalService','validateSrv', function (errorModalService,validateSrv) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            'basicDetails':'='
        },
        templateUrl: 'html/templates/cardDetails.html',
        link: function (scope, elem, attr) {

            scope.displayIcon = function(contactInfo, typeName){

                if(typeName == "adress"){
                    for (var i = 0; contactInfo && i < contactInfo.length; i++) {
                        if ((contactInfo[i].contactType == "street" || 
                             contactInfo[i].contactType == "city" || 
                             contactInfo[i].contactType == "postalCode" ||
                             contactInfo[i].contactType == "state"  ) && contactInfo[i].contactValue) {
                            return true;
                        }

                    }

                }
                else{
                    for (var i = 0; contactInfo && i < contactInfo.length; i++) {
                        if (contactInfo[i].contactType == typeName && contactInfo[i].contactValue) {
                            return true;
                        }

                    }
                }
                return false;
            }
            /*scope.$emit("NEED_PROFILE");
            scope.$on("GET_PROFILE", function (event, data) {
                scope.basicDetails = data.basicDetails;
                var imageData = data.basicDetails.imageURL;
                scope.basicDetails.imageData = imageData ? imageData : "images/placeholder_contact-big.png";

            })*/
            scope.$watch('basicDetails', function(newVal, oldVal){});
        }

    };
}]);