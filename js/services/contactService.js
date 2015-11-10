app.factory('contactService', ['connectionManagerService', function (connectionManagerService) {
    var cms = connectionManagerService;

    return {
        addContact: function (data) {
            console.log('show data'+JSON.stringify(data))
            var request = {
                domain: "contacts",
                event: "createContactWithoutConflictDetection",
                payload: {
                    contactData: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        country: data.country,
                        position: data.position,
                        company: data.company,
                        imageData: data.imageData,
                        contactInformation: data.contactInformation
                    }
                },
               // auth: localStorage['auth']
            };
            console.log('helllo');
            return cms.sendRequest(request);
        },

        getContactsList: function (data) {
            var request = {
                domain: "contacts",
                event: "getContacts",
                payload: {
                    skip: data.skip,
                    limit: data.limit,
                },
               // auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },

        getContactsFilters: function () {
            var request = {
                domain: "contacts",
                event: "getContactFilters",
                payload: {},
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },

        getContactDetails: function(data){
            var request = {
                domain: "contacts",
                event: "getContactDetails",
                payload: {
                    contactId: data.contactId

                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },

        updateSocialNetworks: function(data){
            var request = {
                domain: "contacts",
                event: "updateSocialNetworks",
                payload: {
                    contactId: data.contactId,
                    socialNetworks: data.socialNetworks
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        updateBasicDetails: function (data, id) {
            var request = { domain: "contacts",
                event: "updateBasicDetails",
                payload: {
                    contactId: id,
                    basicDetails: data
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        getCompanies: function(){
            var request = {
                domain: "companies",
                event: "getCompanies",
                payload: {},
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        createCompany: function(data) {
            var request = {
                domain: "companies",
                event: "createCompany",
                payload: {
                    name:data.name,
                    industry: data.industry,
                    country: data.country,
                    revenue: {
                        amount: data.amount,
                        currency: data.currency
                    },
                    contactInformation: [{
                        contactType: data.contactType,
                        contactValue: data.contactValue
                    }],
                    numberOfEmployees: data.numberOfEmployees
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateAbout: function(data){
            var request = {
                domain: "contacts",
                event: "updateAbout",
                payload: {
                    contactId: data.contactId,
                    about: data.about,
                    contactHistory:data.contactHistory

                },
                auth: localStorage['auth']
            }
            return cms.sendRequest(request);
        },
        updateOptions: function(data){
            var request = {
                domain: "contacts",
                event: "updateOptions",
                payload: {
                    contactId: data.contactId,
                    options:{
                        openForCommunication: data.options.openForCommunication,
                        positionType: data.options.positionType,
                        solutionAreas: data.options.solutionAreas
                    }
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updatePosition: function(data){
            var request = {
                domain: "contacts",
                event: "updateHierarchicalPosition",
                payload: {
                    contactId: data.contactId,
                    hierarchicalPosition: {
                        comments: data.hierarchicalPosition.comments,
                        selectedValue: data.hierarchicalPosition.selectedValue,
                        explanatoryText :data.hierarchicalPosition.explanatoryText
                    }
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updatePersonality: function(data){
            var request = {
                domain: "contacts",
                event: "updatePersonality",
                payload: {
                    contactId: data.contactId,
                    personality: {
                        comments: data.personality.comments,
                        selectedValue: data.personality.selectedValue,
                        explanatoryText :data.personality.explanatoryText
                    }
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },

        deleteContacts: function(data){
             var request = {
                domain: "contacts",
                event: "deleteContacts",
                payload: {
                    contactsToDelete: data
                    },
                auth: localStorage['auth']
            }

            return cms.sendRequest(request);
        },
        forceDeleteContacts: function (data) {
            var request = {
                domain: "contacts",
                event: "forceDeleteContacts",
                payload: {
                    contacts: data
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        mergeContacts: function (data) {
            var request = {
                domain: "contacts",
                event: "mergeContacts",
                payload: {
                    contactsToMerge: data
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },

        searchSuggestions: function(searchText){
            var request = {
                domain: "contacts",
                event: "searchSuggestions",
                payload: {
                    value: searchText
                },
                auth: localStorage['auth']
            }
            return cms.sendRequest(request);
        },
        updateRole: function(data){
            var request = {
                domain: "contacts",
                event: "updateRole",
                payload: {
                    contactId: data.contactId,
                    role: {
                        comments: data.role.comments,
                        selectedValue: data.role.selectedValue,
                        explanatoryText :data.role.explanatoryText
                    }
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateType: function(data){
            var request = {
                domain: "contacts",
                event: "updateType",
                payload: {
                    contactId: data.contactId,
                    contactType: {
                        comments: data.contactType.comments,
                        selectedValue: data.contactType.selectedValue,
                        explanatoryText :data.contactType.explanatoryText
                    }
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        }
        ,
        updatePowerBase: function(data){
            var request = {
                domain: "contacts",
                event: "updatePowerBase",
                payload: {
                    contactId: data.contactId,
                    powerBase: {
                        comments: data.powerBase.comments,
                        selectedValue: data.powerBase.selectedValue,
                        explanatoryText :data.powerBase.explanatoryText
                    }
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        updateInfluences: function(data) {
            var request = {
                domain: "contacts",
                event: "updateInfluences",
                payload: {
                    contactId: data.contactId,//"String",
                    influences: {
                        explanatoryText: data.influences.explanatoryText,//"String",
                        contacts: data.influences.contacts//["String"]
                    }
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        createBatchContacts: function (data) {
            var request = {
                domain: "contacts",
                event: "createBatchContacts",
                payload: {
                    contacts: data
                },
                auth: localStorage['auth']
            };

            return cms.sendRequest(request);
        },
        manageConflicts: function (data) {
            var request = {
                domain: "contacts",
                event: "manageConflicts",
                payload: {
                    selected: data
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        }
    }
}]);