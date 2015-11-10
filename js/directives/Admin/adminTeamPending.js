app.directive('teamPending', function (requestManagerService, errorService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-team-pending.html',
        link: function (scope, elemn, attr) {
            scope.$on('GET_ADMIN_TEAM_PENDING', function (event, data) {
                scope.pendingUsers = data;
            });

            scope.showInviteMemberModal = function () {
                $('#inviteMemberModal').modal('show');
            }

            scope.inviteNewMemberFromModal = function (emailAddress) {
                if (!emailAddress) {
                    scope.emailInviteError = true;
                    return;
                }
                else {
                    scope.emailInviteError = false;
                }
                var requestObj = {
                    event: 'inviteTeamMember',
                    payload: emailAddress
                };
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $('#inviteMemberModal').modal('hide');
                            scope.getMembersList();
                        }
                    });
            }
        }
    };
});