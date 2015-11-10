app.controller('companiesCtrl',
    ['$timeout',
        '$rootScope',
        '$scope',
        'myModalService',
        'errorModalService',
        'errorService',
        'countriesService',
        '$location',
        'CompaniesList',
        'validateSrv',
        'utilSrv',
        'requestManagerService',
    function ($timeout,
              $rootScope,
              $scope,
              myModalService,
              errorModalService,
              errorService,
              countriesService,
              $location,
              CompaniesList,
              validateSrv,
              utilSrv,
              requestManagerService) {
    $rootScope.tabs = [
        {
            tabTitle: "Add New Company",
            tabIcon: "icon-addcompany-menu",
            tabCls: "add-company",
            tabAction: function () {
                $rootScope.analyticsContext = 'Companies';
                $rootScope.analyticsAction = 'Create company';
                $rootScope.analyticsLabel = 'View';
                $scope.activeSection = "add-company";
                $scope.resetCreateCompanyForm();
            }
        }
    ];

        $rootScope.helpPage = "http://static.iseeit.com/help/companies";

        $rootScope.subTabs = [
            {
                tabTitle:  "Merge Companies",
                tabIcon:   "icon-merge",
                tabCls:    "merge-companies",
                tabAction: function () {
                    if (selectedCompanies.length === 2) {
                        myModalService.setModalContent('Merge', 'Are you sure you want to merge the selected companies?', 'Cancel', 'Merge')
                        $('#myModal').modal('show');
                        myModalService.setModalAcceptAction($scope.mergeCompanies);
                    } else {
                        errorModalService.setErrorModal('Merge Leads', 'Please select two companies to merge');
                        $('#errorModal').modal('show');
                    }
                }
            },
            {
                tabTitle:  "Delete Companies",
                tabIcon:   "icon-delete",
                tabCls:    "delete-companies",
                tabAction: function () {
                    myModalService.setModalContent('Delete', 'Are you sure you want to delete the selected company/companies?', 'Cancel', 'Delete');
                    $('#myModal').modal('show');
                    myModalService.setModalAcceptAction($scope.deleteCompanies);
                }
            }
        ];
        $rootScope.search = {
            keyupAction:        function (text) {
                $scope.searchCompaniesSuggestions(text);
            },
            searchSelectAction: function (item) {
                if (item.id) {
                    $scope.redirectToCompany(item.id);
                }
            }
        };

        var requestObj = {}
        var is_selected = false;
        var selectedCompanies = [];

        $scope.activeSection = "";
        $scope.allFilters = [];
        $scope.filterList = [];
        $scope.selectedCompany = undefined;
        $scope.selectedCountry = undefined;
        $scope.countryFilters = [];
        $scope.countryAppliedFilters = [];
        $scope.industryAppliedFilters = [];
        $scope.industryFilters = [];
        $scope.positionAppliedFilters = [];

        $scope.countries = countriesService.getCountries();
        $scope.validateTel = validateSrv.validateTel;
        $scope.validateEmail = validateSrv.validateEmail;


        $scope.typeNumber = /^[0-9]+$/;
        $scope.typePhone = /^[-.() \d]+$/;
        $scope.typeEmail = /^(([^<>()[\]\\.,;:\W@\"]+(\.[^<>()[\]\\.,;:\W@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        $scope.newCompany = {};

        $scope.resetCreateCompanyForm = function () {
            $scope.companynameError = false;
            $scope.newCompany = {
                name: "",
                industry: "",
                country: "",
                contactInformation: {
                    city: "",
                    state: "",
                    street: "",
                    postalCode: "",
                    phoneNo: "",
                    emailAddress: ""
                },
                revenue: {
                    amount: "",
                    currency: ""
                },
                numberOfEmployees: ""
            };
        }

        $scope.searchCompaniesSuggestions = function (searchText) {
            requestObj['event'] = "searchSuggestions";
            requestObj['payload'] = {
                value: searchText
            };
            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        var results = response.payload.results;
                        if (results.length == 0) {
                            $scope.searchSuggestionsList = [
                                {displayValue: 'No companies found!'}
                            ];
                        } else {
                            $scope.searchSuggestionsList = results;
                        }
                    }
                })
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
            var companyPosition = getSelectedCompanyPosition(card.company.id);
            if (companyPosition !== -1) {
                selectedCompanies.splice(companyPosition, 1);
            }
            else {
                selectedCompanies.push(card.company.id);
            }
        }

        $scope.selectAll = function () {
            $('.general-card .check-uncheck').addClass('selected');
            $('.general-card .inner-box').addClass('selected');

            $('.check-uncheck input:checkbox').each(function () { //loop through each checkbox
                this.checked = true;  //select all checkboxes with class "checkbox1"
            });

            $('.icon-checkbox_empty').css('display', 'none');
            $('.icon-checkbox').css('display', 'block');

            /* reset actions menus */
            $('#main-actions').addClass('unselected');
            $('#sub-actions').addClass('selected');
            is_selected = true;
            getCompaniesIdFromCompaniesList();
        }

        var getCompaniesIdFromCompaniesList = function () {
            for (var i = 0; i < $scope.companies.items.length; i += 1) {
                selectedCompanies.push($scope.companies.items[i].id);
            }
            return selectedCompanies;
        }

        $scope.unselectAll = function () {
            $('input:checkbox').removeAttr('checked');
            $('.general-card .check-uncheck').removeClass('selected');
            $('.general-card .inner-box').removeClass('selected');

            is_selected = false;

            /* reset actions menus */
            $('#main-actions').removeClass('unselected');
            $('#sub-actions').removeClass('selected');
            selectedCompanies = [];
        }

        $scope.mergeCompanies = function () {
            if (selectedCompanies.length === 2) {
                requestObj['event'] = "mergeCompanies";
                requestObj['payload'] = {
                    companiesToMerge: selectedCompanies
                };
                requestManagerService.companiesRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            selectedCompanies = [];
                            $scope.unselectAll();
                            $('#myModal').modal('hide');
                            var filtersPayload = getCompaniesListFiltersPayload();
                            $scope.companies = new CompaniesList(filtersPayload);
                        }
                    });
            }
        }

        var getSelectedCompanyPosition = function (companyId) {
            for (var i = 0; i < selectedCompanies.length; i += 1) {
                if (selectedCompanies[i] === companyId) {
                    return i;
                }
            }
            return -1;
        }

        $scope.changeActiveSection = function (newActiveSection) {
            $scope.activeSection = newActiveSection;
        }

        $scope.showSection = function () {
            if ($scope.activeSection === "") {
                return "html/pages/Company/detailsSection/company-filters.html";
            }
            return "html/pages/Company/detailsSection/company_" + $scope.activeSection + ".html";
        }

        $scope.setError = function (errorName, value) {
            $scope[errorName] = value;
        }

        $scope.addCompany = function (newCompany) {
            if (!newCompany.name) {
                $scope.companynameError = true;
                return;
            }

            if (newCompany.contactInformation) {
                var contactInformation = [];
                var results = newCompany.contactInformation;
                for (var key in results) {
                    if (results.hasOwnProperty(key)) {
                        contactInformation.push({contactType: key, contactValue: results[key]})
                    }
                }
                newCompany.contactInformation = contactInformation;
            }
            requestObj['event'] = "createCompany";
            requestObj['payload'] = {
                name:               newCompany.name,
                industry:           newCompany.industry,
                country:            newCompany.country,
                revenue:            newCompany.revenue,
                contactInformation: newCompany.contactInformation,
                numberOfEmployees:  newCompany.numberOfEmployees
            };
            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.companies = new CompaniesList();
                        $scope.changeActiveSection('');
                        $scope.newCompany = {};
                    }
                });
        }


        var checkIfIsInFilters = function (filterType, filterName) {
            for (var i = 0; i < $scope[filterType].length; i += 1) {
                if ($scope[filterType][i] === filterName) {
                    return i;
                }
            }
            return -1;
        }

        var checkIfIsInAllFilters = function (filterType, filterName) {
            for (var i = 0; i < $scope[filterType].length; i += 1) {
                if ($scope[filterType][i]['name'] === filterName) {
                    return i;
                }
            }
            return -1;
        }

        var removeCountryFromCountriesList = function (countryToRemove) {
            for (var i = 0; i < $scope.companyFilters.countries.length; i += 1) {
                if ($scope.companyFilters.countries[i] === countryToRemove) {
                    $scope.companyFilters.countries.splice(i, 1);
                    break;
                }
            }
        }

        $scope.selectFilter = function (filterType, filterName, selectedModel) {
            if (checkIfIsInFilters(filterType, filterName) === -1) {
                $scope[filterType].push(filterName);

                var type_temp = filterType.replace(/([A-Z])/g, ' $1');
                var filter_type = type_temp.substr(0, type_temp.indexOf(' '));
                var display_name = filter_type[0].toUpperCase() + filter_type.slice(1);
                $scope.applyFilter(filter_type, filterName, display_name);
                if (filterType === 'countryFilters') {
                    removeCountryFromCountriesList(selectedModel);
                }
            }
            $scope[selectedModel] = '';
        }

        $scope.applyFilter = function (filterType, filterName, displayName) {
            var appliedFilterPosition = checkIfIsInFilters(filterType + 'AppliedFilters', filterName);
            var allAppliedFilterPosition = checkIfIsInAllFilters('allFilters', filterName);
            if (appliedFilterPosition === -1) {
                $scope[filterType + 'AppliedFilters'].push(filterName);
                if (allAppliedFilterPosition === -1) {
                    $scope.allFilters.push({displayName: displayName, name: filterName, type: filterType});
                    $scope.filterList[filterName] = true;
                }
            }
            else {
                $scope[filterType + 'AppliedFilters'].splice(appliedFilterPosition, 1);
                if (allAppliedFilterPosition !== -1) {
                    $scope.allFilters.splice(allAppliedFilterPosition, 1);
                }
            }
            var filtersPayload = getCompaniesListFiltersPayload();
            $scope.companies = new CompaniesList(filtersPayload);
        }

        var getCompaniesListFiltersPayload = function () {
            var filtersPayload = {};
            if ($scope.countryAppliedFilters.length > 0) {
                filtersPayload['countries'] = $scope.countryAppliedFilters;
            }
            if ($scope.industryAppliedFilters.length > 0) {
                filtersPayload['industries'] = $scope.industryAppliedFilters;
            }

            return filtersPayload;
        }

        $scope.clearAllFilters = function () {
            $scope.countryAppliedFilters = [];
            $scope.industryAppliedFilters = [];
            $scope.allFilters = [];
            $scope.filterList = [];
            $scope.industryFilters = [];
            $scope.countryFilters = [];
            uncheckAll();
            $scope.companies = new CompaniesList();
            $scope.companyFilters.countries = countriesService.getCountries();
        }

        var uncheckAll = function () {
            angular.element('input:checkbox').removeAttr('checked');
            angular.element('input:radio').removeAttr('checked');
        }

        $scope.removeFilter = function (filterType, filterName) {
            if (filterType === 'country') {
                $scope.companyFilters.countries.push(filterName);
            }
            if (filterType !== 'position') {
                var removeFilterAtPosition = checkIfIsInFilters(filterType + 'Filters', filterName);
            }
            if (filterType == 'date') {
                $scope.date = '';
            }
            var removeFilterAtPositionFromApplied = checkIfIsInFilters(filterType + 'AppliedFilters', filterName);
            var removeFilterAtPositionFromAll = checkIfIsInAllFilters('allFilters', filterName);
            if (removeFilterAtPositionFromApplied !== -1) {
                if (filterType !== 'position') {
                    $scope[filterType + 'Filters'].splice(removeFilterAtPosition, 1);
                }
                $scope[filterType + 'AppliedFilters'].splice(removeFilterAtPositionFromApplied, 1);
                $scope['allFilters'].splice(removeFilterAtPositionFromAll, 1);
                $scope.filterList[filterName] = false;
            }
            var filtersPayload = getCompaniesListFiltersPayload();
            $scope.companies = new CompaniesList(filtersPayload);
        }

        $scope.redirectToCompany = function (companyId) {
            $location.url("/companies/" + companyId.toString());
        }

        $scope.deleteCompanies = function () {
            requestObj['event'] = "deleteCompanies";
            requestObj['payload'] = {
                companiesToDelete: selectedCompanies
            };
            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {

                        $('#myModal').modal('hide');
                        var filtersPayload = getCompaniesListFiltersPayload();
                        $scope.companies = new CompaniesList(filtersPayload);
                        selectedCompanies = []
                        $scope.unselectAll();
                    }
                });
        }


        $scope.validate = function (field, pristine) {
            if (pristine) {
                return true;
            } else if (field) {
                return true;
            }
            return false;
        }

        $scope.getInitialData = function () {
            async.series([
                function (callback) {
                    requestObj['event'] = "getCompanies";
                    requestObj['payload'] = {
                        skip:  0,
                        limit: 54
                    };
                    requestManagerService.companiesRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                var items = response.payload.results;
                                $scope.companies = {
                                    items:    items,
                                    nextPage: function () {
                                        $scope.companies = new CompaniesList();
                                    }
                                }
                                //$scope.companies = new CompaniesList();
                                callback(null, $scope.companies);
                            }
                        });
                },

                function (callback) {
                    requestObj['event'] = "getCompanyFilters";
                    requestObj['payload'] = {};
                    requestManagerService.companiesRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                $scope.companyFilters = response.payload;
                                callback(null, response.payload);
                            }
                        });
                },

                function (callback) {
                    var requestObj = {
                        event:   'financialSettings',
                        payload: {}
                    };

                    requestManagerService.organizationsRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                $scope.companyFiltersCurrency = response.payload.currency;

                                var requestSecObj = {
                                    event: 'industriesAndSolutionAreaSettings',
                                    payload: {}
                                };

                                requestManagerService.organizationsRequest(requestSecObj)
                                    .then(function (response) {
                                        if (errorService.validateUserResponse(response)) {
                                            $scope.companyFiltersIndustry = response.payload.industries;
                                            callback(null, response.payload);
                                        }
                                    });
                            }
                        });
                }
            ]);

        }

        $scope.getFormattedAmountFunc = function (amount) {
            return utilSrv.getFormattedAmount(amount);
        }

        $scope.getInitialData();
        utilSrv.resizeContainer();

}]);

app.factory('CompaniesList',['$rootScope','$http','requestManagerService',function($rootScope, $http, requestManagerService) {
    var CompaniesList = function(filters) {
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

    CompaniesList.prototype.nextPage = function() {
        var requestObj = {};
        if (this.busy) return;
        this.busy = true;
        requestObj['event']= "getCompanies";
        requestObj['payload'] = {
            skip: this.payload.skip,
            limit: this.payload.limit,
            filters: this.payload.filters
        };
        requestManagerService.companiesRequest(requestObj)
            .then(function (response) {
                var items = response.payload.results;
                for (var i = 0; i < items.length; i += 1) {
                    this.items.push(items[i]);
                }
                this.payload.skip += items.length;
                if (items.length === 0)
                    this.isEnd = true;
                else
                    this.busy = false;
            }.bind(this));
    }

    return CompaniesList;
}]);
