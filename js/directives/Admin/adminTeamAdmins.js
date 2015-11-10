app.directive('teamAdmins', function ($rootScope, requestManagerService, errorService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-team-admins.html',
        link: function (scope, elemn, attr) {
            scope.$on('GET_ADMIN_TEAM_ADMINS', function (event, data) {
                scope.admins = data.admins;
                scope.members = data.members;
                for (var i = 0; i < scope.admins.length; i += 1) {
                    if (scope.admins[i].id === localStorage['id']) {
                        scope.currentAdmin = scope.admins[i].id;
                    }
                }
                scope.nonAdmins = [];
                for (var i = 0; i < scope.members.length; i += 1) {
                    var found = -1;
                    for (var j = 0; j < scope.admins.length; j += 1) {
                        if (scope.members[i].id === scope.admins[j].id) {
                            found = i;
                            break;
                        }
                    }
                    if (found === -1) {
                        scope.nonAdmins.push(scope.members[i]);
                    }
                }
                for (var i = 0; i < scope.nonAdmins.length; i += 1) {
                    scope.nonAdmins[i].fullName = scope.nonAdmins[i].firstName + ' ' + scope.nonAdmins[i].lastName;
                }
            });

            scope.getMembersList = function () {
                var requestObj = {
                    event: 'getMembersListForAdmin',
                    payload: {}
                };
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.$broadcast('GET_ADMIN_TEAM_ADMINS', response.payload);
                            scope.$broadcast('GET_ADMIN_TEAM_PENDING', response.payload.pendingInvitations);
                        }
                    });
            }

            scope.changeAdminStatus = function (memberId, status) {
                var requestObj = {
                    event: 'changeAdminStatus',
                    payload: {
                        memberId: memberId,
                        admin: status
                    }
                };
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $rootScope.isAdmin = false;
                            localStorage['isAdmin'] = false;
                            scope.getMembersList();
                        }
                    });
            }
        }
    };
});