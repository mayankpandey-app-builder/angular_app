/**
 * Created by bogdan on 6/9/14.
 */


app.factory('requestManagerService', ['connectionManagerService', function (connectionManagerService) {
    var cms = connectionManagerService;

    return {
        makeRequest: function (request) {
            return cms.sendRequest(request);
        },
        companiesRequest: function (request) {
            var request = {
                domain: "companies",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        contactsRequest: function (request) {
            var request = {
                domain: "contacts",
                event: request.event,
                payload: request.payload,
                //auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        leadsRequest: function (request) {
            var request = {
                domain: "leads",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        tasksRequest: function (request) {
            var request = {
                domain: "tasks",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },

        getExportFiltersRequest: function (request) {
            var request = {
                domain: "exports",
                event: 'getExportFilters',
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },

        dealsRequest: function (request) {
            var request = {
                domain: "deals",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        dealsEARequest: function (request) {
            var request = {
                domain: "deals.earningsAndAchievements",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        tagsRequest: function (request) {
            var request = {
                domain: "tags",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        meetingMinutesRequest: function (request) {
            var request = {
                domain: "meetingMinutes",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        organizationsRequest: function (request) {
            var request = {
                domain: "organizations",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        membersRequest: function (request) {
            var request = {
                domain: "members",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        linkedinRequest: function (request) {
            var request = {
                domain: "linkedIn",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        reportingRequest: function (request) {
            var request = {
                domain: "reporting",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        regionalStructureRequest: function (request) {
            var request = {
                domain: "territories",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        businessUnitsRequest: function (request) {
            var request = {
                domain: "businessUnits",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        identityRequest: function (request) {
            var request = {
                domain: "identity",
                event: request.event,
                payload: request.payload,
                auth: localStorage['auth']
            };
            console.log(cms.sendRequest(request));
            return cms.sendRequest(request);
        }
    }
}]);