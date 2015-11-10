app.controller('dashboardCtrl', function ($rootScope, $scope, $location, requestManagerService,  myModalService, utilSrv, validateSrv) {

    initRootScope();
    initControllerScope();
    initialRequest();

    function initRootScope() {
        $rootScope.tabs = [];
        $rootScope.search = {
            hideSearch: true
        };
        $rootScope.helpPage = "http://static.iseeit.com/help/dashboard";
    }

    function initControllerScope() {
        if(localStorage['user']){
            $scope.fullName = localStorage['user'].split(' ')[0];
        }
        $scope.getFormattedAmountFunc = getFormattedAmount;
        $scope.goTo = goTo;
        $scope.openModal = openModal;
        $scope.dismissModal = dismissModal;
        $scope.referFriend = referFriend;
    }

    function initialRequest() {
        getDashboardView();

        function getDashboardView() {
            var todayStart = moment().startOf('day').toDate().getTime();
            var todayEnd = moment().endOf('day').toDate().getTime();
            var requestObj = {
                event: 'dashboardView',
                payload: {
                    date: {
                        end: todayEnd,
                        start: todayStart
                    }
                }
            };

            requestManagerService.reportingRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.dashboardView = response.payload;
                    }

                });
        }
    }

    function getFormattedAmount(amount) {
        return utilSrv.getFormattedAmount(amount);
    }

    function goTo(path, id, query) {
        if (id) {
            path += id;
        }
        if (!query) {
            $location.path(path);
        } else {
            $location.search(query.split('=')[0], query.split('=')[1]).path(path);
        }
    }

    function openModal(modalId) {
        angular.element(modalId).modal('show');
    }

    function dismissModal(modalId) {
        angular.element(modalId).modal('hide');
    }

    function referFriend() {
        if (!validateSrv.validateEmail($scope.referralEmail, false)) {
            dismissModal('#dashboardReferralModal');
            $scope.referralEmail = '';
            openModal('#dashboardReferralError');
            return;
        }
        dismissModal('#dashboardReferralModal');

        var requestObj = {
            event: 'friendReferral',
            payload: {
                email: $scope.referralEmail
            }
        };

        requestManagerService.identityRequest(requestObj)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    $scope.referralEmail = '';
                    openModal('#dashboardSuccess');
                    
                }
            })
    }

    utilSrv.resizeContainer();
});