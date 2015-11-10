
//FOCUS ME -- How to use it:
//<button class="btn" ng-click="showForm=true; focusInput=true">show form and focus input</button>
//<div ng-show="showForm">
//<input type="text" focus-me="focusInput">
//</div>
//OR http://plnkr.co/edit/gmaQCl?p=preview

app.directive('focusMe', function() {
    return {
        scope: {
            trigger: '=focusMe'
        },
        link: function(scope, element) {
            scope.$watch('trigger', function(value) {
                if(value === true) {
                    element[0].focus();
                    scope.trigger = false;
                }
            });
        }
    };
});

app.directive("autofill", function () {
    return {
        require: "ngModel",
        link: function (scope, element, attrs, ngModel) {
            scope.$on("autofill:update", function() {
                ngModel.$setViewValue(element.val());
            });
        }
    }
});