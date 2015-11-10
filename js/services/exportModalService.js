app.factory('exportModalService', ['$rootScope', 'connectionManagerService', function ($rootScope, connectionManagerService) {
    var cms = connectionManagerService;
    return {
        exportModal: {title: "*", info: "***"},
        setModalContent: function (exportFilters, title, info, decline, accept, contacts, filtersPayload, sortByFilter) {
            this.exportModal.width = '68%';
            this.exportModal.title = title;
            this.exportModal.info = info;
            this.exportModal.decline = decline;
            this.exportModal.accept = accept;
            this.exportModal.contacts = contacts;
            this.exportModal.exportFilters = exportFilters;
            this.exportModal.filtersPayload = filtersPayload;
            this.exportModal.sortByFilter = sortByFilter;
            $rootScope.contactExportFilters = exportFilters;
        },
        getModalContent: function () {
            return this.exportModal;
        },
        setModalDeclineAction: function (functParam) {
            this.exportModal.declineAction = functParam;
        },
        setModalAcceptAction: function (functParam) {
            this.exportModal.acceptAction = functParam;
        },
        getFiltersdata: function (){
            return $rootScope.contactExportFilters;
        },

        getAvailableFields: function () {
            var availableFields = [
                                    {'id': 'firstName', 'name': 'First Name', 'position': 0},
                                    {'id': 'lastName', 'name': 'Last Name', 'position': 1},
                                    {'id': 'email', 'name': 'Email', 'position': 2},
                                    {'id': 'mobileNo', 'name': 'Mobile', 'position': 3},
                                    {'id': 'company', 'name': 'Company', 'position': 4},
                                    {'id': 'country', 'name': 'Country', 'position': 5},
                                    {'id': 'position', 'name': 'Position', 'position': 6},
                                    {'id': 'positionType', 'name': 'Positon Type', 'position': 7},
                                    {'id': 'hierarchicalPosition', 'name': 'Hierarchical Position', 'position': 8},
                                    {'id': 'role', 'name': 'Role', 'position': 9},
                                    {'id': 'about', 'name': 'About', 'position': 10},
                                    {'id': 'openforCommunication', 'name': 'Open For Comm.', 'position': 11},
                                    {'id': 'solutionAreas', 'name': 'Solution Areas', 'position': 12},
                                    {'id': 'personality', 'name': 'Personality', 'position': 13},
                                    {'id': 'contactType', 'name': 'Contact Type', 'position': 14},
                                    {'id': 'socialNetworks', 'name': 'Social Networks', 'position': 15},
                                    {'id': 'skype', 'name': 'Skype', 'position': 16},
                                    {'id': 'powerBase', 'name': 'Powerbase', 'position': 17},
                                ];
            return availableFields;
        },
        getFilters: function (data) {
            var request = {
                domain: "exports",
                event: "getExportFilters",
                payload: {

                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        exportContacts:function (data) {
            var request = {
                domain: "exports",
                event: "getContactsToExport",
                payload: {
                    exportfilter: data.exportfilter,
                    email: data.email,
                    download: data.download,
                    filters: this.exportModal.filtersPayload
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);
        },
        saveFilterSettings:function (data){

             var request = {
                domain: "exports",
                event: "createExportsFilter",
                payload: {setting:{
                    export_setting_name: data.filterName,
                    fields: data.exportfilter,
                    available_for_all: data.available_for_all,
                    id:data.Set_id
                }
                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);

        },
         deleteExportSetting:function (data){

             var request = {
                domain: "exports",
                event: "deleteExportSetting",
                payload: {

                    type: "contact",
                    id: data.id


                },
                auth: localStorage['auth']
            };
            return cms.sendRequest(request);

        }

    }
}]);