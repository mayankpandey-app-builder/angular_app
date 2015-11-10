app.controller('leadsCtrl',['$rootScope', '$scope','myModalService', 'errorModalService','leadService', 'LeadsList', 'contactService','validateSrv','organizationsService','companyService','tagsService','errorService','utilSrv','$location', 'countriesService','requestManagerService',
    function($rootScope,$scope,myModalService,errorModalService,leadService,LeadsList,contactService,validateSrv,organizationsService,companyService,tagsService,errorService,utilSrv,$location,countriesService ,requestManagerService){
        $rootScope.tabs = [
       /* {

          tabTitle: "Search Prospect",
          tabIcon: "icon-createtask-menu",
          tabCls: "search-prospect",
          tabAction: function(){
              $scope.changeActiveSection("search-prospect");
          }
        },*/
        { 

          tabTitle: "Add New Lead",
          tabIcon: "icon-createlead-menu",
          tabCls: "create-lead",
          tabAction: function(){
              $rootScope.analyticsContext = 'Leads';
              $rootScope.analyticsAction = 'Create lead';
              $rootScope.analyticsLabel = 'View';
              $scope.changeActiveSection("create-lead");
              $scope.disableCompanyInfo=false;
              $scope.disableContactInfo=false;
              $scope.resetCreateLeadForm();
              getOrganizationSettings();
          }
        },
        {
            tabTitle: "Tutorial",
            tabIcon: "icon-playbook-leftmenu",
            tabCls: "tutorial-lead",
            tabAction: function (){
                var win = window.open(("http://static.iseeit.com/playbook/leads")  ,'_blank');
            }
        }
      ];

        $rootScope.helpPage = "http://static.iseeit.com/help/leads";

        $rootScope.subTabs = [
            {
                tabTitle: "Assign Leads",
                tabIcon: "icon-assignlead-menu",
                tabCls: "assign-to",
                tabAction: function () {
                    $scope.changeActiveSection("assign-to");
                    getOrganizationsMembers();
                }
            },
            {
                tabTitle: "Mark As Hot",
                tabIcon: "icon-hot-lead",
                tabCls: "mark-hot",
                tabAction: function () {
                    $scope.markAs('Hot');

                }
            },
            {
                tabTitle: "Mark As Warm",
                tabIcon: "icon-warm-lead",
                tabCls: "mark-warm",
                tabAction: function () {
                    $scope.markAs('Warm');
                }
            },
            {
                tabTitle: "Mark As Cold",
                tabIcon: "icon-cold-lead",
                tabCls: "mark-cold",
                tabAction: function () {
                    $scope.markAs('Cold');
                }
            },
            {
                tabTitle: "Send To Trash",
                tabIcon: "icon-unsorted-leads",
                tabCls: "send-trash",
                tabAction: function () {
                    $scope.markAs('Trash');
                    getTags();
                }
            },
            {
                tabTitle: "Merge Leads",
                tabIcon: "icon-merge",
                tabCls: "merge-leads",
                tabAction: function () {

                    if (selectedLeads.length === 2){
                        if (selectedCompanyId[0] === selectedCompanyId[1]){
                            myModalService.setModalContent('Merge Leads', 'Do you want to copy (append) the information from the new lead to the old one?', 'No', 'Yes');
                            $('#myModal').modal('show');
                            myModalService.setModalDeclineAction($scope.mergeLeadsFalse);
                            myModalService.setModalAcceptAction($scope.mergeLeadsTrue);
                        } else {
                            errorModalService.setErrorModal('Merge Leads', 'The selected leads belong to different companies. You cannot merge them.');
                            $('#errorModal').modal('show');
                        }

                    } else {
                        errorModalService.setErrorModal('Merge Leads', 'Please select two leads to merge');
                        $('#errorModal').modal('show');
                    }
                }
            },
            {
                tabTitle: "Delete Leads",
                tabIcon: "icon-delete",
                tabCls: "delete-leads",
                tabAction: function () {
                    $rootScope.analyticsContext = 'Leads';
                    $rootScope.analyticsAction = 'Delete lead';
                    $rootScope.analyticsLabel = 'View';
                    myModalService.setModalContent('Delete', 'Are you sure you want to delete the selected lead(s)?', 'Cancel', 'Delete');
                    $('#myModal').modal('show');
                    myModalService.setModalDeclineAction($scope.dismiss);
                    myModalService.setModalAcceptAction($scope.deleteLeads);
                }
            },
            {
                tabTitle: "Tutorial",
                tabIcon: "icon-playbook-leftmenu",
                tabCls: "create-lead",
                tabAction: function (){
                    var win = window.open(("http://static.iseeit.com/playbook/leads")  ,'_blank');
                }
            }
        ];
        $rootScope.search = {
                keyupAction: function(text){
                    $scope.searchLeadsSuggestions(text);
                },
                searchSelectAction: function (item) {
                    if (item.id){
                        $scope.redirectToLead(item.id);
                    }
                }
            };

    $scope.resetCreateLeadForm = function () {
        $scope.contactError = false;
        $scope.companyError = false;
        $scope.newLead = {
            leadName: "",
            company: {
                name: "",
                country: "",
                industry: "",
                employees: "",
                revenue: "",
                currency: ""
            },
            contact: {
                name: "",
                position: "",
                mobileNo: "",
                email: ""
            }
        };
    }

    $scope.searchLeadsSuggestions = function(searchText){
        var requestObj = {
            event:   'searchSuggestions',
            payload: {
                value: searchText
            }
        };

        requestManagerService.leadsRequest(requestObj)
                .then(function(response){
                    if (errorService.validateUserResponse(response)) {
                        var results = response.payload.results;
                        if (results.length == 0){
                            $scope.searchSuggestionsList = [{displayValue : 'No leads found!'}];
                        } else {
                            $scope.searchSuggestionsList = results;
                        }

                    }
                })
    }

    $scope.activeSection = "filters";
    $scope.validateTel = validateSrv.validateTel;
    $scope.validateEmail = validateSrv.validateEmail;
    $scope.changeActiveSection = function(newActiveSection){
        $scope.activeSection = newActiveSection;
    }
    $scope.showSection = function(){
        if($scope.activeSection == "") {
            return "";
        }
        return "html/pages/Lead/detailsSection/lead-" + $scope.activeSection + ".html";
    }

    $scope.validate = function(field,pristine){
        if(pristine) {
            return true;
        } else if(field){
            return true;
        }
        return false;
    }

    $scope.clearAllFilters = function () {
//        $scope.leadFilters = [];
        $scope.allFilters = [];
        $scope.filterList = [];
        $scope.industryFilters = [];
        $scope.countryFilters = [];
        $scope.countryAppliedFilters = [];
        $scope.industryAppliedFilters = [];
        $scope.emailAppliedFilters = [];
        $scope.phoneAppliedFilters = [];
        $scope.namedAppliedFilters = [];
        $scope.stagesAppliedFilters = [];
        $scope.sourcesAppliedFilters = [];
        $scope.bantScoreAppliedFilters = [];
        uncheckAll();
        $scope.getLeads();
    }

    var uncheckAll = function(){
        angular.element('input:checkbox').removeAttr('checked');
        angular.element('input:radio').removeAttr('checked');
    }

    $scope.leadFilters = [];
    $scope.allFilters = [];
    $scope.filterList = [];
    $scope.countryFilters = [];
    $scope.countryAppliedFilters = [];
    $scope.industryFilters = [];
    $scope.industryAppliedFilters = [];
    $scope.emailFilters = [];
    $scope.emailAppliedFilters = [];
    $scope.phoneFilters = [];
    $scope.phoneAppliedFilters = [];
    $scope.namedFilters = [];
    $scope.namedAppliedFilters = [];
    $scope.stagesFilters = [];
    $scope.stagesAppliedFilters = [];
    $scope.sourcesFilters = [];
    $scope.sourcesAppliedFilters = [];
    $scope.bantScoreFilters = [];
    $scope.bantScoreAppliedFilters = [];
    $scope.payload = {};
    $scope.payload.filters = {};
    $scope.newLead = {};

    var checkIfIsInFilters = function (filterType, filterName) {
        for (var i = 0; i < $scope[filterType].length; i += 1) {
            if ($scope[filterType][i] === filterName) {
                return i;
            }
        }
        return -1;
    }

    var checkIfIsInAllFilters = function (modelName, filterName, filterType) {
        for (var i = 0; i < $scope[modelName].length; i += 1) {
            if ($scope[modelName][i]['name'] === filterName && $scope[modelName][i]['type'] === filterType) {
                return i;
            }
        }
        return -1;
    }

    $scope.selectFilter = function (filterType, filterName, selectedModel) {
        if (checkIfIsInFilters(filterType, filterName) === -1){
            $scope[filterType].push(filterName);

            var type_temp=filterType.replace(/([A-Z])/g, ' $1');
            var filter_type = type_temp.substr(0,type_temp.indexOf(' '));
            var display_name = filter_type[0].toUpperCase() + filter_type.slice(1);
            $scope.applyFilter(filter_type, filterName, display_name);
        }
        $scope[selectedModel] = '';
    }

    $scope.applyFilter = function (filterType, filterName, displayName) {
        var appliedFilterPosition = checkIfIsInFilters(filterType + 'AppliedFilters', filterName);
        var allAppliedFilterPosition = checkIfIsInAllFilters('allFilters', filterName, filterType);
        if (appliedFilterPosition === -1) {
            $scope[filterType + 'AppliedFilters'].push(filterName);
            if (allAppliedFilterPosition === -1){
                $scope.allFilters.push({displayName: displayName, name: filterName, type: filterType});
                $scope.filterList[filterName] = true;
            }
        }
        else {
            $scope[filterType + 'AppliedFilters'].splice(appliedFilterPosition, 1);
            if (allAppliedFilterPosition !== -1){
                $scope.allFilters.splice(allAppliedFilterPosition, 1);
            }
        }
        $scope.getLeads();
    }

    var getLeadsListFiltersPayload = function () {
        var filtersPayload = {};
        if ($scope.countryAppliedFilters.length > 0) {
            filtersPayload['countries'] = $scope.countryAppliedFilters;
        }
        if ($scope.industryAppliedFilters.length > 0) {
            filtersPayload['industries'] = $scope.industryAppliedFilters;
        }
        if ($scope.bantScoreAppliedFilters.length > 0) {
            filtersPayload['bantScores'] = $scope.bantScoreAppliedFilters;
        }
        if ($scope.emailAppliedFilters.length > 0) {
            if ($scope.emailAppliedFilters[0] === 'Yes'){
                filtersPayload['hasEmail'] = ['Yes'];
            }else{
                filtersPayload['hasEmail'] = ['No'];
            }
        }
        if ($scope.phoneAppliedFilters.length > 0) {
            if ($scope.phoneAppliedFilters[0] === 'Yes'){
                filtersPayload['hasPhone'] = ['Yes'];
            }else{
                filtersPayload['hasPhone'] = ['No'];
            }
        }
        if ($scope.namedAppliedFilters.length > 0) {
            if ($scope.namedAppliedFilters[0] === 'Yes'){
                filtersPayload['namedAccount'] = ['Yes'];
            }else{
                filtersPayload['namedAccount'] = ['No'];
            }
        }
        if ($scope.sourcesAppliedFilters.length > 0) {
            filtersPayload['sources'] = $scope.sourcesAppliedFilters;
        }
        if ($scope.stagesAppliedFilters.length > 0) {
            filtersPayload['stages'] = $scope.stagesAppliedFilters;
        }
        if ($scope.payload.filters){
            filtersPayload['statuses'] = $scope.payload.filters['statuses'];

        }
        return filtersPayload;
    }

    $scope.removeFilter = function (filterType, filterName) {
        if (filterType !== 'bantScore' || filterType !== 'stages' || filterType !== 'sources' ) {
            var removeFilterAtPosition = checkIfIsInFilters(filterType + 'Filters', filterName);
        }

        var removeFilterAtPositionFromApplied = checkIfIsInFilters(filterType + 'AppliedFilters', filterName);
        var removeFilterAtPositionFromAll = checkIfIsInAllFilters('allFilters', filterName, filterType);
        if (removeFilterAtPositionFromApplied !== -1) {
            if (filterType !== 'bantScore' || filterType !== 'stages' || filterType !== 'sources' ) {
                $scope[filterType + 'Filters'].splice(removeFilterAtPosition, 1);
            }
            $scope[filterType + 'AppliedFilters'].splice(removeFilterAtPositionFromApplied, 1);
            $scope['allFilters'].splice(removeFilterAtPositionFromAll, 1);
            $scope.filterList[filterName]=false;
        }
        $scope.getLeads();
    }

    var getOrganizationSettings = function(){
        var requestObj = {
            event:   'financialSettings',
            payload: {}
        };

        requestManagerService.organizationsRequest(requestObj)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    $scope.currencies = response.payload.currency;

                    var requestSecObj = {
                        event: 'industriesAndSolutionAreaSettings',
                        payload: {}
                    };

                    requestManagerService.organizationsRequest(requestSecObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                $scope.industries = response.payload.industries;
                            }
                        });
                }
            });
        /*organizationsService.getSettings()
            .then(function (response){
                $scope.currencies = response.payload.currency;
                $scope.industries = response.payload.industries;
               // $scope.getLeadsList("Open");
            });*/
    }

    var getOrganizationsMembers = function () {
        organizationsService.getMembers()
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    /*for (var i = 0; i < response.payload.results.length; i += 1) {
                        if (localStorage.id === response.payload.results[i].id) {
                            response.payload.results.splice(i, 1);
                        }
                    }*/
                    $scope.organizationsMembers = response.payload.results;
                }
            })
    }

    $scope.dismiss = function(){
        $('#myModal').modal('hide');
    }

    $scope.deleteLeads = function(){
        leadService.deleteLeads(selectedLeads)
            .then(function(response){
                $('#myModal').modal('hide');
                $('#main-actions').removeClass('unselected');
                $('#sub-actions').removeClass('selected');
                is_selected = false;
                $scope.getLeads();
                selectedLeads = [];
            });
    }


    $scope.selectCompany = function(data){
        companyService.getCompanyDetails(data)
            .then(function(response){
                if (errorService.validateUserResponse(response)) {
                var company = response.payload;
                $scope.newLead.company.id = company.id;
                $scope.newLead.company.country = company.basicDetails.country;
                $scope.newLead.company.employees = company.specificDetails.numberOfEmployees;
                $scope.newLead.company.revenue = company.specificDetails.revenue.amount;
                $scope.newLead.company.currency = company.specificDetails.revenue.currency;
                $scope.newLead.company.industry = company.specificDetails.industry;
                $scope.disableCompanyInfo = true;
                }
            })
    }
    $scope.selectContact = function(data){
            data['contactId'] = data.id;
            contactService.getContactDetails(data)
                .then(function(response){
                    if (errorService.validateUserResponse(response)) {
                    var contact = response.payload;
                    $scope.newLead.contact.id = contact.id;
                    $scope.newLead.contact.position = contact.basicDetails.position;
                    var contactInformation = contact.basicDetails.contactInformation;
                    for (var i = 0; i < contactInformation.length; i += 1){
                        if (contactInformation[i].contactType == 'emailAddress' ){
                            $scope.newLead.contact.email = contactInformation[i].contactValue;
                        }
                        if (contactInformation[i].contactType == 'mobilePhoneNumber' ){
                            $scope.newLead.contact.mobileNo = contactInformation[i].contactValue;
                        }
                    }

                    $scope.disableContactInfo = true;
                    }
                })
        }

    $scope.getLeadsList = function (status) {

        if (status){
            if (status=="Open"){
                $scope.payload.filters['statuses'] = ["Hot", "Warm"];
            }else{
                $scope.payload.filters['statuses'] = [status];
            }
        }
        $scope.getLeads();
    };

    $scope.searchLead = function (lead) {
        var payload = {
             skip: 0,
             limit: 100,
             value: lead
        };

        leadService.searchLeads(payload)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                $scope.leadsResultsList = response.payload.results;
                }
            });
    };

    $scope.getLeads = function () {
        async.series([
            function(callback){
                leadService.getLeadsStatistics()
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.leadsStatistics = response.payload;
                            $scope.$broadcast("LEADS_STATISTICS", $scope.leadsStatistics);
                            callback(null,  response.payload);
                        }
                    });
            },
        function(callback){
            var filtersPayload = getLeadsListFiltersPayload();
            $scope.leadsList = new LeadsList(filtersPayload);
            callback(null);
        }],

        function(err, results){
            console.log("err", err, "LEADS results",results);
        });
    };

    $scope.setError = function (errorName, value) {
        $scope[errorName] = value;
    }

    $scope.addLead = function (newLead) {
        if (!newLead.contact || !newLead.contact.name) {
            $scope.contactError = true;
        }
        if (!newLead.company || !newLead.company.name) {
            $scope.companyError = true;
        }
        if ($scope.contactError && $scope.companyError) {
            return;
        }
        var contactInformation = [
            {
                contactType: "emailAddress",
                contactValue: (newLead.contact.email)?newLead.contact.email: null
            },
            {
                contactType: "mobilePhoneNumber",
                contactValue: (newLead.contact.mobileNo)?newLead.contact.mobileNo : null
            }
        ];
        newLead.contactInformation = contactInformation;
        leadService.addLead(newLead)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                $scope.changeActiveSection("filters");
                $scope.getLeads();
                $scope.newLead= {};
                $scope.disableCompanyInfo=false;
                $scope.disableContactInfo=false;
                $scope.contactError = false;
                $scope.companyError = false;
                }
            });
    }

    $scope.countries = countriesService.getCountries();
    $scope.companiesSearchSuggestions = function(searchText){
        if (searchText){
            companyService.searchSuggestions(searchText)
                .then(function(response){
                if (errorService.validateUserResponse(response)) {
                    $scope.contactCompanies = response.payload.results;
          }
                })
        }
    }
    $scope.contactsSearchSuggestions = function(searchText){
        if (searchText){
            contactService.searchSuggestions(searchText)
                .then(function(response){
                if (errorService.validateUserResponse(response)) {
                    $scope.contactsSuggestions = response.payload.results;
              }
                })
        }
    }


    $scope.getInitialData =  function () {
        //$scope.getLeads("first");

        async.series([
                function(callback){

                    $scope.payload.filters['statuses'] = ["Hot", "Warm"];
                    var payload = {
                        skip: 0,
                        limit: 54,
                        filters: $scope.payload.filters
                    }
                    leadService.getLeadsList(payload)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                var items = response.payload.results;
                                $scope.leadsList = {
                                    items: items,
                                    nextPage: function(){
                                        $scope.leadsList = new LeadsList(payload);

                                    }
                                }
                                callback(null,  response.payload);
                            }
                        });
                },
                function(callback){
                    leadService.getLeadsStatistics()
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                $scope.leadsStatistics = response.payload;
                                $scope.$broadcast("LEADS_STATISTICS", $scope.leadsStatistics);
                                callback(null,  response.payload);
                            }
                        });
                },

                function(callback){
                    leadService.getFilters()
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                $scope.leadFilters.bantScores = response.payload.bantScores;
                                $scope.leadFilters.countries = response.payload.countries;
                                $scope.leadFilters.sources = response.payload.sources;
                                $scope.leadFilters.stages = response.payload.stages;
                                callback(null,  response.payload);
                            }
                        });
                },
                function(callback){
                    var requestSecObj = {
                        event: 'industriesAndSolutionAreaSettings',
                        payload: {}
                    };

                    requestManagerService.organizationsRequest(requestSecObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                $scope.industries = response.payload.industries;
                                callback(null,  response.payload);
                            }
                        });
                }
            ],
            function(err, results){
                $scope.leadsList={};
                $scope.leadsList['items']=results[0].results;
            });
    };
    $scope.getInitialData();

    $scope.redirectToLead = function(leadId){
        $location.url("/leads/" + leadId.toString());//just in case is a number
    }

    var getTags= function(){
        tagsService.getTags('leads')
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    $scope.reasons = response.payload.results;
                }
            });
    }

    $scope.selectReason = function(item){
        $scope.reasonTag=item.displayValue;
    }

    $scope.markAs = function (status)
    {
        var reason='';
        if (status=='Trash'){
                $('#selectReason').modal('show');

        } else {
            $scope.updateStatuses(status, reason);
        }

    }

    $scope.updateStatuses = function (status, reason){
        leadService.updateStatuses(selectedLeads,status,reason)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    selectedLeads=[];
                    $scope.reasonTag = '';
                    $('#selectReason').modal('hide');
                    $scope.getLeads();
                }
            });
    }

    $scope.mergeLeadsTrue= function(){
        leadService.mergeLeads(selectedLeads, true)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    selectedLeads = [];
                    selectedCompanyId=[];
                    $('#myModal').modal('hide');
                    $scope.getLeads();
                }
            });
    }

    $scope.mergeLeadsFalse= function(){
        leadService.mergeLeads(selectedLeads, false)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    selectedLeads = [];
                    selectedCompanyId=[];
                    $('#myModal').modal('hide');
                    $scope.getLeads();
                }
            });
    }

    $scope.mergeLeads = function(copy)
    {
           leadService.mergeLeads(selectedLeads, copy)
                .then(function (response) {
                   if (errorService.validateUserResponse(response)) {
                       selectedLeads = [];
                       selectedCompanyId=[];
                       $('#myModal').modal('hide');
                       $scope.getLeads();
                   }
                });
    }

    $scope.assignLeadToContact = function (assignee) {
        var payload = {
            memberId: assignee.id,
            leads: selectedLeads
        };
        leadService.assignLeadsToOrganizationMember(payload)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                    $scope.getLeads();
                    $scope.changeActiveSection('filters');
                }
            })
    }

    $scope.setImage = utilSrv.setImage;

    var is_selected = false;
    var selectedLeads=[];
    var selectedCompanyId=[];

    var getLeadsIdFromLeadsList = function () {
        for (var i = 0; i < $scope.leadsList.items.length; i += 1) {
            selectedLeads.push($scope.leadsList.items[i].id);
        }
        return selectedLeads;
    }

    var getSelectedLeadPosition = function (leadId) {
        for (var i = 0; i < selectedLeads.length; i += 1) {
            if (selectedLeads[i] === leadId) {
                return i;
            }
        }
        return -1;
    }



    $scope.selectCard = function (card, $event) {

        $($event.target).parents('.check-uncheck').toggleClass('selected');
        $($event.target).parents('.check-uncheck').next().toggleClass('selected');

        if (is_selected === false) {
            $('#main-actions').toggleClass('unselected');
            $('#sub-actions').toggleClass('selected');
            is_selected = true;
        }

        if ($(":checkbox:checked").length === 0) {
            $('#main-actions').removeClass('unselected');
            $('#sub-actions').removeClass('selected');
            is_selected = false;

        }
        var leadPosition = getSelectedLeadPosition(card.lead.id);
        if (leadPosition !== -1) {
            selectedLeads.splice(leadPosition, 1);
            selectedCompanyId.splice(leadPosition, 1);
        }
        else {
            selectedLeads.push(card.lead.id);
            selectedCompanyId.push(card.lead.company.id);

        }
    }
    $scope.selectAll = function () {
        $('.general-card .check-uncheck').addClass('selected');
        $('.general-card .inner-box').addClass('selected');

        $('.check-uncheck input:checkbox').each(function() { //loop through each checkbox
            this.checked = true;  //select all checkboxes with class "checkbox1"
        });

        $('.icon-checkbox_empty').css('display','none');
        $('.icon-checkbox').css('display','block');

        /* reset actions menus */
        $('#main-actions').addClass('unselected');
        $('#sub-actions').addClass('selected');
        is_selected = true;
        getLeadsIdFromLeadsList();
    }

    $scope.unselectAll = function () {
        $('input:checkbox').removeAttr('checked');
        $('.general-card .check-uncheck').removeClass('selected');
        $('.general-card .inner-box').removeClass('selected');

        is_selected = false;

        /* reset actions menus */
        $('#main-actions').removeClass('unselected');
        $('#sub-actions').removeClass('selected');
        selectedLeads = [];
        selectedCompanyId = [];
    }

        utilSrv.resizeContainer();
}]);

app.factory('LeadsList',['$rootScope','$http','leadService', 'errorService',function($rootScope, $http, leadService, errorService) {
    var LeadsList = function(filters) {
        this.items = [];
        this.busy = false;
        this.isEnd = false;
        this.after = '';
        this.payload = {
            skip: 0,
            limit: 54
        };
        if (filters) {
            this.payload['filters'] = filters;
        }
        this.nextPage();
    }

    LeadsList.prototype.nextPage = function() {
        if (this.busy) return;
        this.busy = true;
        leadService.getLeadsList(this.payload)
            .then(function (response) {
                if (errorService.validateUserResponse(response)) {
                var items = response.payload.results;

                for (var i = 0; i < items.length; i += 1) {
                    this.items.push(items[i]);
                }
                this.payload.skip += items.length;
                if (items.length === 0)
                    this.isEnd = true;
                else
                    this.busy = false;
            }
            }.bind(this));
    }

    return LeadsList;
}]);