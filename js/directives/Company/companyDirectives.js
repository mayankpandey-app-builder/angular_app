app.directive('companyAbout', function (utilSrv) {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Company/_company-about.html',
        scope: {
            'about': '='
        },
        link:        function (scope, elemn, attr) {
            scope.$watch('about', function (newVal, oldVal) {});
        }
    };
});

app.directive('companyDetails', function (utilSrv) {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Company/_company-details.html',
        scope: {
            'details': '='
        },
        link:        function (scope, elemn, attr) {
            scope.$watch('details', function (newVal, oldVal) {});
            scope.getFormattedAmount = utilSrv.getFormattedAmount;
        }
    };
});

app.directive('companyDeals', function (utilSrv) {
    return {
        restrict:    'E',
        replace:     true,
        scope: {
            'deals': '='
        },
        templateUrl: 'html/pages/Company/_company-deals.html',
        link:        function (scope, elemn, attr) {
            scope.setImage = utilSrv.setImage;
            scope.$watch('deals', function (newVal, oldVal) {});
        }
    };
});

app.directive('companyBasicDetails', function (utilSrv) {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Company/_company-basic-details.html',
        scope: {
            'basicDetails': '='
        },
        link:        function (scope, elemn, attr) {
            scope.$watch('basicDetails', function(newVal, oldVal){
                if (scope.basicDetails) {
                    scope.basicDetails.imageURL = scope.basicDetails.imageURL || 'images/placeholder_company.png';
                    scope.namedAccount = scope.basicDetails.namedAccount ? 'Yes' : 'No';
                }
            });

            scope.getAddressIcon = function(data){
                var list = ['street', 'city', 'state', 'postalCode'];
                var exists = false;
                _.forEach(data, function(item){
                   if(_.indexOf(list,item.contactType)>-1  && item.contactValue){
                       exists = true;
                   }
                });

                if(exists){
                    return true;
                }else{
                    return false;}
            }
        }
    };
});
