/**
 * Created by bogdan on 5/29/14.
 */
app.factory('tagsService', ['connectionManagerService', function (connectionManagerService) {
    var cms = connectionManagerService;

    return {
        getTags: function (domain) {
            var request = {
                domain: "tags",
                event: "getDomainTags",
                payload: {
                    domain: domain
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        createTag:function(domain, displayValue){
            var request={
                domain: "tags",
                event: "create",
                payload: {
                    domain: domain,
                    displayValue: displayValue
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        }
    }
}]);