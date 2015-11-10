app.directive('contactAbout', function () {
    return {
        restrict:    'E',
        replace:     true,
        scope:{
            'contactHistory': '=',
            'about': '='
        },
        templateUrl: 'html/pages/Contact/_contact-about.html',
        link:        function (scope, elemn, attr) {
            scope.$watch('contactHistory', function(newVal, oldVal){});
            scope.$watch('about', function(newVal, oldVal){});

            scope.hasPrevPos = function () {
                if (scope.contactHistory && scope.contactHistory.length == 0) {
                    return false;
                }
                return true;
            }
        }
    };
});

app.directive('contactOptions', function () {
    return {
        restrict:    'E',
        replace:     true,
        scope: {
            'options': '='
        },
        templateUrl: 'html/pages/Contact/_contact-options.html',
        link:        function (scope, elemn, attr) {
            scope.$watch('options', function(newVal,oldVal){});
            scope.optInVal = function () {
                if (scope.options && scope.options.openForCommunication) {
                    return "Yes";
                }
                return "No";
            }

        }
    };
});

app.directive('contactPersonality', function () {
    return {
        restrict:    'E',
        replace:     true,
        scope: {
            'personality': '='
        },
        templateUrl: 'html/pages/Contact/_contact-personality.html',
        link:        function (scope, elemn, attr) {
            scope.$watch('personality',function(){})
        }
    };
});

app.directive('contactPosition', function () {
    return {
        restrict:    'E',
        replace:     true,
        scope:{
            'hierarchicalPosition': '='
        },
        templateUrl: 'html/pages/Contact/_contact-position.html',
        link:        function (scope, elemn, attr) {
            scope.$watch('hierarchicalPosition',function(){})
        }
    };
});

app.directive('contactRole', function () {
    return {
        restrict:    'E',
        replace:     true,
        scope: {
            'role': '='
        },
        templateUrl: 'html/pages/Contact/_contact-role.html',
        link:        function (scope, elemn, attr) {
            scope.$watch('role', function(){})
        }
    };
});

app.directive('contactType', function () {
    return {
        restrict:    'E',
        replace:     true,
        scope: {
            'contactType': '='
        },
        templateUrl: 'html/pages/Contact/_contact-type.html',
        link:        function (scope, elemn, attr) {
            scope.$watch('contactType', function(){});
            scope.setCurrentColor = function (type) {
                switch (type) {
                    case "Champion":
                        return "green-bleft";
                    case "Coach":
                        return "blue-bleft";
                    case "Enemy":
                        return "orange-bleft";
                    case "Neutral":
                        return "grey-bleft";
                }
            }
        }
    };
});

app.directive('influences', ['utilSrv', function (utilSrv) {
    return {
        restrict:    'E',
        replace:     true,
        scope:       {
            'influences': '='
        },
        templateUrl: 'html/pages/Contact/_influences.html',
        link:        function (scope, elemn, attr) {
            scope.$watch('influences',function(){});
            scope.setImage = utilSrv.setImage;

        }
    };
}]);

app.directive('powerBase', function () {
    return {
        restrict:    'E',
        replace:     true,
        scope: {
            'powerBase': '='
        },
        templateUrl: 'html/pages/Contact/_power-base.html',
        link:        function (scope, elemn, attr) {
            scope.$watch('powerBase', function(){});
        }
    };
});
