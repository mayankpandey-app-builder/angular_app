/**
 * Created by bogdan on 6/4/14.
 */
/**
 * Created by bogdan on 5/20/14.
 */
app.factory('companyService', ['connectionManagerService', function (connectionManagerService) {
    var cms = connectionManagerService;

    return {
       addCompany: function (data) {
            var request = {
                domain: "companies",
                event: "createCompany",
                payload: {
                    name: data.name,
                    industry: data.industry,
                    country: data.country,
                    revenue: data.revenue,
                    contactInformation: data.contactInformation,
                    numberOfEmployees: data.numberOfEmployees
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        deleteCompanies: function (data) {
            var request = {
                domain: "companies",
                event: "deleteCompanies",
                payload: {
                    companiesToDelete: data
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        forceDeleteCompanies: function (data) {
            var request = {
                domain: "companies",
                event: "forceDeleteCompanies",
                payload: {
                    companies: data
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        getCompanies: function(data){
            var request = {
                domain: "companies",
                event: "getCompanies",
                payload: {
                    skip: data.skip,
                    limit: data.limit,
                    filters: data.filters
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        searchCompanies: function (data) {
            var request = {
                domain: "companies",
                event: "search",
                payload: {
                    skip: data.skip,
                    limit: data.limit,
                    value: data.value
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        searchSuggestions: function (data) {
            var request = {
                domain: "companies",
                event: "searchSuggestions",
                payload: {
                    value: data
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        getFilters: function(){
            var request = {
                domain: "companies",
                event: "getCompanyFilters",
                payload: {},
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        getCompanyDetails: function(data){
            var request = {
                domain: "companies",
                event: "getCompanyDetails",
                payload: {
                    companyId: data.id
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        updateBasicDetails: function(data,id){
            var request = {
                domain: "companies",
                event: "updateBasicDetails",
                payload: {
                    companyId: id,
                    basicDetails: data
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        updateSolutionArea: function(data,id){
            var request = {
                domain: "companies",
                event: "updateSolutionArea",
                payload: {
                    companyId: id,
                    solutionArea: data.solutions
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        mergeCompanies: function(data){
            var request = {
                domain: "companies",
                event: "mergeCompanies",
                payload: {
                    companiesToMerge: data
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        updateAbout: function (data) {
            var request = {
                domain: "companies",
                event: "updateAbout",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateSolutionArea: function (data) {
            var request = {
                domain: "companies",
                event: "updateSolutionArea",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateSpecificDetails: function (data) {
            var request = {
                domain: "companies",
                event: "updateSpecificDetails",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateBasicDetails: function (data) {
            var request = {
                domain: "companies",
                event: "updateBasicDetails",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        }


    }
}]);

