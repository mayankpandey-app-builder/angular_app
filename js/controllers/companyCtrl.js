app.controller('companyCtrl',
    ['$rootScope', '$scope', '$timeout', 'requestManagerService','myModalService', 'errorModalService', 'validateSrv', '$location', 'errorService', 'utilSrv', 'countriesService',
    function($rootScope,$scope, $timeout,requestManagerService,myModalService, errorModalService, validateSrv, $location, errorService, utilSrv, countriesService) {
    $rootScope.tabs = [
        {
            tabTitle: "Add Contact",
            tabIcon: "icon-addcontact-menu",
            tabCls: "add-contact",
            tabAction: function () {
                $rootScope.analyticsContext = 'Companies';
                $rootScope.analyticsAction = 'Create contact';
                $rootScope.analyticsLabel = 'View';
                $scope.resetCreateContactForm();
                $scope.changeActiveSection("add-contact");
            }
        },
        {
            tabTitle: "Search On Google",
            tabIcon: "icon-googlesearch-menu",
            tabCls: "assing-lead",
            tabAction: function () {
                var win = window.open(("http://google.com#q=" + $scope.companyProfile.basicDetails.name)  ,'_blank');
            }
        },
        {
            tabTitle: "Delete Company",
            tabIcon: "icon-delete",
            tabCls: "delete-company",
            tabAction: function () {
                $rootScope.analyticsContext = 'Companies';
                $rootScope.analyticsAction = 'Delete company';
                $rootScope.analyticsLabel = 'View';
                myModalService.setModalContent('Delete', 'Are you sure you want to delete selected company? Any associated tasks will not be deleted.', 'Cancel', 'Delete', 'Delete company', 'Companies');
                $('#myModal').modal('show');
                myModalService.setModalAcceptAction(deleteCompany);
            }
        }
    ];

    $rootScope.helpPage = "http://static.iseeit.com/help/companies";

    var path = $location.path().split('/');
    $scope.id = path[path.length -1];
    $scope.activeSection = "";
    $scope.newContact = {};
    $scope.countries = countriesService.getCountries();
    $scope.validateTel = validateSrv.validateTel;

    $scope.setError = function (errorName, value) {
        $scope[errorName] = value;
    }

    $scope.resetCreateContactForm = function () {
        $scope.firstnameError = false;
        $scope.lastnameError = false;
        $scope.newContact = {
            firstName: "",
            lastName: "",
            position: "",
            emailAddress: "",
            mobileNo: "",
            officeNo: "",
            skypeName: ""
        };
    }

    $scope.changeActiveSection = function (newActiveSection) {
        $scope.activeSection = newActiveSection;
    }

    $scope.showSection = function() {
        if ($scope.activeSection == "") {
            return "";
        }
        return "html/pages/Company/detailsSection/company-" + $scope.activeSection + ".html";
    }

        var getOrganizationSettings = function () {
           /* var requestObj = {
                event:   'settings',
                payload: {}
            };*/

            var requestObj = {
                event:   'financialSettings',
                payload: {}
            };

            requestManagerService.organizationsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.companyCurrencies = response.payload.currency;

                        var requestSecObj = {
                            event: 'industriesAndSolutionAreaSettings',
                            payload: {}
                        };

                        requestManagerService.organizationsRequest(requestSecObj)
                            .then(function (response) {
                                if (errorService.validateUserResponse(response)) {
                                    $scope.companyIndustries = response.payload.industries;
                                }
                            });
                    }
                });
           /* requestManagerService.organizationsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.companyIndustries = response.payload.industries;
                        $scope.companyCurrencies = response.payload.currency;
                    }
                });*/
        }

        var getCompanyDetails = function (id) {
            var requestObj = {
                event:   'getCompanyDetails',
                payload: {
                    companyId: id
                }
            };

            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.companyProfile = response.payload;
                        getOrganizationSettings();
                        //$scope.$broadcast("GET_COMPANY", $scope.companyProfile);
                    }
                });
        }

        getCompanyDetails($scope.id);

        $scope.updateAbout = function () {
            var requestObj = {
                event:   'updateAbout',
                payload: {
                    companyId: $scope.id,
                    about:     {
                        defaultText: $scope.companyProfile.about.defaultText,
                        text:        $scope.companyProfile.about.text
                    }
                }
            };

            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.companyProfile.about = response.payload.about;
                        //$scope.$broadcast("GET_COMPANY", $scope.companyProfile);
                    }
                })
        }

        $scope.selectSolution = function (index) {
            $scope.companyProfile.solutionArea[index].selected = !$scope.companyProfile.solutionArea[index].selected;
            updateSolutionArea();
        };

        var updateSolutionArea = function () {
            var requestObj = {
                event:   'updateSolutionArea',
                payload: {
                    companyId:    $scope.id,
                    solutionArea: $scope.companyProfile.solutionArea
                }
            };

            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.companyProfile.solutionArea = response.payload.solutionArea;
                        //$scope.$broadcast("GET_COMPANY", $scope.companyProfile);
                    }
                })
        }

        $scope.updateSpecificDetails = function () {
            var requestObj = {
                event:   'updateSpecificDetails',
                payload: {
                    companyId:       $scope.id,
                    specificDetails: $scope.companyProfile.specificDetails
                }
            };

            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.companyProfile.specificDetails = response.payload.specificDetails;
                        //$scope.$broadcast("GET_COMPANY", $scope.companyProfile);
                    }
                });
        }

        $scope.updateBasicDetails = function () {
            var emailAdr = {
                index: -1,
                value: ''
            };
            for (var i = 0; i < $scope.companyProfile.basicDetails.contactInformation.length; i += 1) {
                if ($scope.companyProfile.basicDetails.contactInformation[i].contactType !== 'street' &&
                    $scope.companyProfile.basicDetails.contactInformation[i].contactType !== 'postalCode' &&
                    $scope.companyProfile.basicDetails.contactInformation[i].contactType !== 'city' &&
                    $scope.companyProfile.basicDetails.contactInformation[i].contactType !== 'state' && !$scope.companyProfile.basicDetails.contactInformation[i].contactValue) {
                    $scope.companyProfile.basicDetails.contactInformation.splice(i, 1);
                }
                if ($scope.companyProfile.basicDetails.contactInformation[i] && $scope.companyProfile.basicDetails.contactInformation[i].contactType === 'emailAddress') {
                    emailAdr.index = i;
                    emailAdr.value = $scope.companyProfile.basicDetails.contactInformation[i].contactValue;
                }
            }

            var availableNumbers = ['mobilePhoneNumber', 'personalPhoneNumber', 'officePhoneNumber'];
            for (var i = 0; i < $scope.companyProfile.basicDetails.contactInformation.length; i += 1) {
                if (availableNumbers.indexOf($scope.companyProfile.basicDetails.contactInformation[i].contactType) !== -1 &&
                    !$scope.validateTel($scope.companyProfile.basicDetails.contactInformation[i].contactValue, false)) {
                        return;
                    }
            }
            if (emailAdr.value && !validateSrv.validateEmail(emailAdr.value, false)) {
                return;
            }
            else {
                var requestObj = {
                    event: 'updateBasicDetails',
                    payload: {
                        companyId: $scope.id,
                        basicDetails: $scope.companyProfile.basicDetails
                    }
                };

                requestManagerService.companiesRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.companyProfile.basicDetails = response.payload.basicDetails;
                            //$scope.$broadcast("GET_COMPANY", $scope.companyProfile);
                        }
                    });
            }
        }

        $scope.addField = function (array, contactType) {
            array = utilSrv.addDetail(array, contactType);
            $scope.companyProfile.contactInformation = array;
            //$scope.$broadcast("GET_PROFILE", $scope.companyProfile);
        }

        $rootScope.$watch('uploadedImage', function (newVal, oldVal) {
            if (newVal) {
                var path = $location.path().split('/');
                var	id = path[path.length -1];
                var base64String = newVal.resized.dataURL.split(',')[1];
                if ($scope.companyProfile && id === $scope.companyProfile.id) {
                    $scope.companyProfile.basicDetails.imageData = base64String;
                    $scope.updateBasicDetails();
                }
            }
        });

        var deleteCompany = function () {
            var requestObj = {
                event:   'deleteCompanies',
                payload: {
                    companiesToDelete:    [$scope.id]
                }
            };

            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $('#myModal').modal('hide');
                        $location.path('/companies');
                    }
                });
        }

        $scope.validate = function (field, pristine) {
            return pristine || field;
        }

        $scope.addContact = function () {
            if (!$scope.newContact.firstName && !$scope.newContact.lastName) {
                $scope.firstnameError = true;
                $scope.lastnameError = true;
                return;
            }
            if (!$scope.newContact.firstName) {
                $scope.firstnameError = true;
                return;
            }
            if (!$scope.newContact.lastName) {
                $scope.lastnameError = true;
                return;
            }
            var contactInformation = [];
            contactInformation.push({
                contactType:  'officePhoneNumber',
                contactValue: $scope.newContact.officePhoneNumber
            });
            contactInformation.push({
                contactType:  'mobilePhoneNumber',
                contactValue: $scope.newContact.mobilePhoneNumber
            });
            contactInformation.push({
                contactType:  'skypeName',
                contactValue: $scope.newContact.skypeName
            });
            contactInformation.push({
                contactType:  'emailAddress',
                contactValue: $scope.newContact.emailAddress
            });

            var requestObj = {
                event:   'createContactWithoutConflictDetection',
                payload: {
                    contactData: {
                        company: $scope.companyProfile.basicDetails.name,
                        firstName: $scope.newContact.firstName,
                        lastName: $scope.newContact.lastName,
                        position: $scope.newContact.position,
                        contactInformation: contactInformation
                    }
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        getCompanyDetails($scope.id);
                        $scope.changeActiveSection('');
                    }
                });
        }

        $scope.getFormattedAmount = function (amount) {
            return utilSrv.getFormattedAmount(amount);
        }

        $scope.validateNumber = function (evt) {
            var theEvent = evt || window.event;
            var key = theEvent.keyCode || theEvent.which;
            key = String.fromCharCode( key );
            var regex = /[0-9]|\./;
            if (!regex.test(key)) {
                theEvent.returnValue = false;
                if(theEvent.preventDefault) {
                    theEvent.preventDefault();
                }
            }
        }

        utilSrv.resizeContainer();
    }]);