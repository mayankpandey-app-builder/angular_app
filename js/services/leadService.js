/**
 * Created by bogdan on 5/20/14.
 */
app.factory('leadService', ['connectionManagerService', function (connectionManagerService) {
    var cms = connectionManagerService;

    return {
       getLeadsList: function (data) {
            var request = {
                domain: "leads",
                event: "getLeads",
                payload: {
                    skip: data.skip,
                    limit: data.limit,
                    filters: data.filters
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        getLeadsStatistics: function () {
            var request = {
                domain: "leads",
                event: "getLeadsStatistics",
                payload: {},
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        addLead: function (data) {
            var request = {
                domain: "leads",
                event: "createLead",
                payload: {
                    leadName: data.leadName,
                    contact: {
                        // the id of an existing contact if empty at least the name is required
                        id: data.contact.id,
                        // first name and last name separated by space
                        name: data.contact.name,
                        position: data.contact.position,
                        contactInformation: data.contactInformation
                    },
                    company: {
                        // the id of an existing company if empty at least the name is required
                        id: data.company.id,
                        name: data.company.name,
                        country: data.company.country,
                        industry: data.company.industry,
                        numberOfEmployees: data.company.employees,
                        revenue: {
                            amount: data.company.revenue,
                            currency: data.company.currency
                        }
                    }
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        deleteLeads: function (data) {
            var request = {
                domain: "leads",
                event: "deleteLeads",
                payload: {
                    leads: data
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        searchLeads: function (data) {
            var request = {
                domain: "leads",
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
        searchSuggestions: function (searchText) {
            var request = {
                domain: "leads",
                event: "searchSuggestions",
                payload: {
                    value: searchText
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        getFilters: function(){
            var request = {
                domain: "leads",
                event: "getLeadsFilters",
                payload: {},
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        getLeadDetails: function(data){
            var request = {
                domain: "leads",
                event: "getLeadDetails",
                payload: {
                    leadId: data.leadId
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        updateBasicDetails: function(data,id){
            var request = {
                domain: "leads",
                event: "updateBasicDetails",
                payload: {
                    leadId: id,
                    basicDetails: data
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        updateSolutionArea: function(data){
            var request = {
                domain: "leads",
                event: "updateSolutionArea",
                payload: data,
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        assignLeadsToOrganizationMember: function(data) {
            var request = {
                domain: "leads",
                event: "assignLeadsToOrganizationMember",
                payload: {
                    memberId: data.memberId,
                    leads: data.leadIds
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        acceptDeclineLead: function (data) {
            var request = {
                domain: "leads",
                event: "acceptDeclineLead",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        getOrganizationMembersAvailableForShare: function (data) {
            var request = {
                domain: "leads",
                event: "getOrganizationMembersAvailableForShare",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        shareLeadWithOrganizationMembers: function (data) {
            var request = {
                domain: "leads",
                event: "shareLeadWithOrganizationMembers",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        getContactsAvailableForAssociation: function (data) {
            var request = {
                domain: "leads",
                event: "getContactsToAssociateWithLead",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        associateContacts: function (data) {
            var request = {
                domain: "leads",
                event: "associateContactsWithLead",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateStage: function (data) {
            var request = {
                domain: "leads",
                event: "updateStage",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        acceptDeclineLead: function (data) {
            var request = {
                domain: "leads",
                event: "acceptDeclineLead",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        mergeLeads: function (data,copy) {
            var request = {
                domain: "leads",
                event: "mergeLeads",
                payload: {
                    leads: data,
                    copyNewLeadInfo: copy
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateStatuses: function (data,status,reason) {
            var request = {
                domain: "leads",
                event: "updateStatus",
                payload: {
                    leads: data,
                    status: status,
                    reason: reason
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        convertLeadToDeal: function (data) {
            var request = {
                domain: "leads",
                event: "convertToDeal",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateQualifiers: function (data) {
            var request = {
                domain: "leads",
                event: "updateQualifiers",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateNotes: function (data) {
            var request = {
                domain: "leads",
                event: "updateNotes",
                payload: data,
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        }
    }
}]);

