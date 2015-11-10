/**
 * Created by bogdan on 5/26/14.
 */
app.factory('organizationsService', ['connectionManagerService', function (connectionManagerService) {
    var cms = connectionManagerService;

    return {
        getSettings: function () {
            var request = {
                domain: "organizations",
                event: "settings",
                payload: {},
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },

        getMembers: function () {
            var request = {
                domain: "organizations",
                event: "members",
                payload: {},
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        }
    }
}]);