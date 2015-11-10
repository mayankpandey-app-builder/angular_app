app.directive('forgotPassword', [
    'requestManagerService',
    'errorService',
    'errorModalService',
    'validateSrv',
    function (
        requestManagerService,
        errorService,
        errorModalService,
        validateSrv) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            'myModal': '='
        },
        templateUrl: 'html/pages/Login-Register/forgotPassword.html',
        controller: function ($scope) {

            $scope.forgotPassword = function (email, validForm) {
                $scope.resetSubmit = true;
                if (email && validForm) {
                    $('#forgotPassword').modal('hide');
                    var requestObj={
                        event: 'forgotPassword',
                        payload:{
                                email: email
                        }
                    };

                    requestManagerService.identityRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                errorModalService.setErrorModal('Success', "Password sent.");
                                $('#errorModal').modal('show');
                            }
                    });
                }

            },
            $scope.validate = validateSrv.validateEmail;
            $scope.getValidationCls = validateSrv.getValidationCls;
        },
        link: function(scope, elem, attr){
            scope.resetSubmit = false;
        }
    };
}]);

app.directive('passwordMatch', [function () {
    return {
        restrict: 'A',
        scope: true,
        require: 'ngModel',
        link: function (scope, elem, attrs, control) {
            var checker = function () {

                //get the value of the first password
                var e1 = scope.$eval(attrs.ngModel);

                //get the value of the other password
                var e2 = scope.$eval(attrs.passwordMatch);
                return e1 == e2;
            };
            scope.$watch(checker, function (n) {

                //set the form control to valid if both
                //passwords are the same, else invalid
                control.$setValidity("unique", n);
            });
        }
    };
}]);