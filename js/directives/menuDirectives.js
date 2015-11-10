app.directive('mainMenu', [ '$rootScope', function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: 'html/templates/mainMenu.html',
        link: function (scope) {
            console.log(scope);
        }
    };
}]);

app.directive('topMenu',[ '$rootScope',function($rootScope){
    return {
        restrict: 'AE',
        replace: true,
        templateUrl: 'html/templates/topMenuTpl.html',
        link: function(scope, attr){
            scope.tabs = $rootScope.tabs;
            scope.search = $rootScope.search;
            scope.user = localStorage['user'] ;
            scope.userProfileImg = localStorage['profileImage'];

            $rootScope.$on('topInfoChanged', function (event, data) {
                localStorage['user'] = data.firstName + ' ' + data.lastName;
                localStorage['profileImage'] = data.imageURL;
                scope.user = data.firstName + ' ' + data.lastName;
                scope.userProfileImg = data.imageURL;
            });
        }
    }
}]);

app.directive('ipadMenu', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'AE',
        replace: true,
        templateUrl: 'html/templates/ipadMenuTpl.html',
        link: function(scope, attr){
            scope.tabs = $rootScope.tabs;
        }
    }
}]);

app.directive('defaultMenu', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'AE',
        replace: true,
        templateUrl: 'html/templates/defaultMenuTpl.html',
        link: function(scope, attr){
            scope.tabs = $rootScope.tabs;
        }
    }
}]);