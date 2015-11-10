/**
 * Created by bogdan on 5/29/14.
 */
app.factory('membersService', ['connectionManagerService', function (connectionManagerService) {
    var cms = connectionManagerService;

    return {
        getMember: function (id) {
            var request = {
                domain: "members",
                event: "getProfile",
                payload: {
                    id: id
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        membersSearchSuggestions:function(searchText){
            var request = {
                domain: "members",
                event: "searchSuggestions",
                payload: {
                    value: searchText
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        }
    }
}]);