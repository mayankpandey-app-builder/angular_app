app.controller('contactCtrl', [	'$rootScope','$scope','$timeout','myModalService','errorModalService','errorService','$location','utilSrv','validateSrv','countriesService','requestManagerService','$filter','$q',
                       function ($rootScope,  $scope,  $timeout,  myModalService,   errorModalService, errorService,  $location,  utilSrv,  validateSrv,  countriesService,  requestManagerService,  $filter,  $q) {

	$rootScope.tabs = [
        {
            tabTitle: "Create Task",
            tabIcon: "icon-createtask-menu",
            tabCls: "create-task",
            tabAction: function () {
               $scope.activeSection = "create-task";
                $rootScope.analyticsContext = 'Contacts';
                $rootScope.analyticsAction = 'Create task';
                $rootScope.analyticsLabel = 'View';
               setContext($scope.contactProfile.id, "Contacts", '');
               $scope.membersSearchSuggestions();
            }
        },
        {
            tabTitle: "Add New Lead",
            tabIcon: "icon-createlead-menu",
            tabCls: "create-lead",
            tabAction: function () {
               $scope.activeSection = "create-lead";
                $rootScope.analyticsContext = 'Contacts';
                $rootScope.analyticsAction = 'Create lead';
                $rootScope.analyticsLabel = 'View';
               getDetailsForLead();
                getOrganizationSettings();
            }
        },
        {
            tabTitle: "Search Google",
            tabIcon: "icon-googlesearch-menu",
            tabCls: "import-contact",
            tabAction: function () {
                var win = window.open(("http://google.com#q=" + $scope.contactProfile.basicDetails.firstName + ' ' + $scope.contactProfile.basicDetails.lastName)  ,'_blank');//NOT WORKING//now working:))
            }
        },
        {
            tabTitle: "Send Email",
            tabIcon: "icon-email",
            tabCls: "import-contact",
            tabAction: function () {
                var mail = "",
                    contactInfo = $scope.contactProfile.basicDetails.contactInformation;
                for (var i = 0 ; contactInfo && i < contactInfo.length; i++){
                    if(contactInfo[i].contactType == "emailAddress" && contactInfo[i].contactValue){
                        mail = contactInfo[i].contactValue;
                    }
                }
                if(mail){
                    window.location.href = "mailto:" + mail;
                }else{
                    errorModalService.setErrorModal('Send email', 'No email was provided');
                    $('#errorModal').modal('show');
                }
            }
        },
        {
            tabTitle: "Delete Contact",
            tabIcon: "icon-deletecontact-menu",
            tabCls: "delete-contact",
            tabAction: function () {
                //$scope.activeSection = "";
                $rootScope.analyticsContext = 'Contacts';
                $rootScope.analyticsAction = 'Delete contact';
                $rootScope.analyticsLabel = 'View';
                myModalService.setModalContent('Delete', 'Are you sure you want to delete this contact? Any associated task will not be deleted.', 'Cancel', 'Delete', 'Delete contact', 'Contacts');
                $('#myModal').modal('show');
                //myModalService.setModalDeclineAction();
                myModalService.setModalAcceptAction($scope.deleteContact);
            }
        },
        {
            tabTitle: "Refer",
            tabIcon: "icon-referral",
            tabCls: "refer-contact",
            tabAction: function () {
                var email = _.find($scope.contactProfile.basicDetails.contactInformation, function (info) {
                    return info.contactType === 'emailAddress';
                });
                if (!email || !email.contactValue) {
                    errorModalService.setErrorModal('Oops!', "This contact doesn't have an email address to send a referral to.");
                    $('#errorModal').modal('show');
                    return;
                }
                var requestObj = {
                    event: 'friendReferral',
                    payload: {
                        email: email.contactValue
                    }
                };

                requestManagerService.identityRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            myModalService.setModalContent('', 'Your referral was sent.', '', 'Ok');
                            myModalService.setModalAcceptAction(dismissMyModal);
                            $('#myModal').modal('show');

                            function dismissMyModal () {
                                $('#myModal').modal('hide');
                            }
                        }
                    });
            }
        }
    ];

        $rootScope.helpPage = "http://static.iseeit.com/help/contacts";
        $rootScope.search = {
            keyupAction:        function (text) {
                $scope.searchContactsSuggestions(text);
            },
            searchSelectAction: function (item) {
                if (item.id) {
                    $scope.redirectToContact(item.id);
                }
            }
        };

        $scope.activeSection = "";
        $scope.contactProfile = {};
        $scope.socialNewtorks = [];
        $scope.userSocialAccounts = {};
        $scope.contactCompanies = [];
        $scope.contactsList = [];
        $scope.selectedContacts = [];
        $scope.influencesLoaded = null;// = false;
        $scope.loadedContactDetails = false;
        $scope.newTask={};
        $scope.newLead={};
        $scope.newLead.company={};
        $scope.newLead.contact={};
        var selectedRecipients = [];
        var selectedTags = [];
        var context = [];
        var selectedAssignee = "";

        $scope.setSocialNetworksServerFormat = utilSrv.setSocialNetworksServerFormat;
        $scope.isChecked = utilSrv.isChecked;
        $scope.validateTel = validateSrv.validateTel;
        $scope.validateEmail = validateSrv.validateEmail;
        $scope.countries = countriesService.getCountries();
        $scope.setImage  =  utilSrv.setImage

        $scope.resetCreateLeadForm = function () {
            $scope.newLead.leadName = "";
            $scope.companyError = false;
            $scope.contactError = false;
            if (!$scope.disableCompanyInfo) {
                $scope.newLead.company = {
                        name: "",
                        country: "",
                        industry: "",
                        employees: "",
                        revenue: "",
                        currency: ""
                };
            }
        }

        $scope.searchContactsSuggestions = function (searchText) {
            var requestObj = {
                event:   'searchSuggestions',
                payload: {
                    value: searchText
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        var results = response.payload.results;
                        if (results.length == 0) {
                            $scope.searchSuggestionsList = [
                                {displayValue: 'No leads found!'}
                            ];
                        } else {
                            $scope.searchSuggestionsList = results;
                        }
                    }
                })
        }


        $scope.getTags = function (item) {
            var defer = $q.defer();
            var requestObj = {
                event:   'getDomainTags',
                payload: {
                    domain: 'tasks'
                }
            };

            requestManagerService.tagsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        var tag = response.payload.results;
                        var suggestionTag = [];
                        for (var i = 0; i < tag.length; i += 1) {
                            if (tag[i].displayValue && tag[i].displayValue.toLowerCase().indexOf(item.toLowerCase()) > -1) {
                                suggestionTag.push({displayValue: tag[i].displayValue, id: tag[i].id});
                            }
                        }
                        return defer.resolve(suggestionTag);
                    }
                })
            return defer.promise;
        }


        var setContext = function (id, domain, qualifierId) {
            context.push({id: id, domain: domain, qualifierId: qualifierId});
            selectedRecipients.push({id: $scope.contactProfile.id, entityType: 'contact', displayValue: $scope.contactProfile.basicDetails.firstName + ' ' + $scope.contactProfile.basicDetails.lastName });
            $scope.newTask.recipients = [
                {id: $scope.contactProfile.id, entityType: 'contact', displayValue: $scope.contactProfile.basicDetails.firstName + ' ' + $scope.contactProfile.basicDetails.lastName }
            ];
        };


        $scope.$watch('newTask.start', function () {
            if (!$scope.newTask.allDay) {
                var temp_start = new Date($scope.newTask.start);
                var temp_end = new Date(temp_start.getTime() + (60 * 60 * 1000));
                if ($scope.newTask.start) {
                    $scope.newTask.end = $filter('date')(temp_end, 'dd MMM, yyyy  HH:mm');
                }
            } else {
                var temp_start = new Date($scope.newTask.start);
                var temp_end = new Date($scope.newTask.end);
                if (temp_end - temp_start !== 86340000) {
                    $scope.newTask.allDay = false;
                    $scope.newTask.end = $filter('date')(new Date(temp_start.getTime() + (60 * 60 * 1000)), 'dd MMM, yyyy  HH:mm');
                }
            }
        })


        $scope.$watch('newTask.end', function () {
            var temp_start = new Date($scope.newTask.start);
            var temp_end = new Date($scope.newTask.end);
            if ($scope.newTask.start) {
                if (temp_end - temp_start > 0) {
                    $scope.newTask.end = $filter('date')(temp_end, 'dd MMM, yyyy  HH:mm');
                    if (temp_end - temp_start !== 86340000) {
                        $scope.newTask.allDay = false;
                    }
                } else {
                    $scope.newTask.end = $filter('date')(temp_start, 'dd MMM, yyyy  HH:mm');
                    errorModalService.setErrorModal('Oops', 'End date should be bigger than the start date.');
                    $('#errorModal').modal('show');
                }
            }
        })


        $scope.setAllDay = function () {
            if ($scope.newTask.allDay) {
                if ($scope.newTask.start) {
                    var dateStart = $scope.newTask.start;
                    var dateEnd = $scope.newTask.end;
                    var temp_dateStart = new Date(dateStart);
                    var temp_dateEnd = new Date(dateEnd);

                    temp_dateStart.setHours(0, 0, 0);
                    $scope.newTask.start = $filter('date')(temp_dateStart, 'dd MMM, yyyy  HH:mm');
                    temp_dateEnd.setHours(23, 59, 0);
                    $scope.newTask.end = $filter('date')(temp_dateEnd, 'dd MMM, yyyy  HH:mm');
                } else {
                    $scope.newTask.start = new Date();
                    $scope.newTask.start.setHours(0, 0, 0);
                    $scope.newTask.start = $filter('date')($scope.newTask.start, 'dd MMM, yyyy  HH:mm');
                    $scope.newTask.end = new Date();
                    $scope.newTask.end.setHours(23, 59, 0);
                    $scope.newTask.end = $filter('date')($scope.newTask.end, 'dd MMM, yyyy  HH:mm');
                }
            }
        }


        $scope.selectTaskType = function (name, type, pristine) {
            $scope.deadline = false;
            $scope.newTask.taskType = type;
            $scope.newTask.taskName = name;

            if (pristine) {
                $scope.newTask.name = name;
            }

            else if (!pristine && !$scope.newTask.name) {
                $scope.newTask.name = name;
            }
            if (name == 'Email' || name == 'Follow-up' || name == 'To do') {
                $scope.deadline = true;
            }

        }


        $scope.selectItem = function (type) {
            switch (type) {
                case 'recipient':
                {
                    selectedRecipients = [];
                    var recipient = $scope.newTask.recipients;
                    if (recipient) {
                        for (var i = 0; i < recipient.length; i += 1) {
                            selectedRecipients.push({id: recipient[i].id, entityType: recipient[i].entityType});
                        }
                    }
                };break;

                case 'tag':
                {
                    selectedTags = [];
                    var tag = $scope.newTask.tagsList;
                    if (tag) {
                        for (var i = 0; i < tag.length; i += 1) {
                            selectedTags.push(tag[i].id);

                        }
                    }
                };break;

                default:
                    console.error('Select item function has no parameter!');
            }

        }


        var getOrganizationSettings = function () {
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
        }

       $scope.taskCreated = function (newTask, taskId) {
           $scope.changeActiveSection("");
           $scope.$broadcast("GET_PROFILE", $scope.contactProfile);
           var meetingTasks = ['call', 'channel', 'nbm', 'newcontact', 'facetoface', 'internal'];
           if (meetingTasks.indexOf(newTask.taskType) !== -1 && taskId) {
               var requestObj = {
                   event: 'getMeetingAttendees',
                   payload: {
                       taskId: taskId
                   }
               };

               requestManagerService.tasksRequest(requestObj)
                   .then(function (response) {
                       if (errorService.validateUserResponse(response)) {
                           $scope.meetingAttendees = response.payload.attendees;
                           $scope.taskId = taskId;
                           if ($scope.meetingAttendees.length > 0) {
                               $('#meetingInvite').modal('show');
                           }
                           $scope.getContactDetails($scope.contactProfile.id);
                       }
                   });
           }
           else {
               $scope.getContactDetails($scope.contactProfile.id);
           }
       }

       $scope.sendMeetingInvite = function (requestObj) {
           requestManagerService.tasksRequest(requestObj)
               .then(function (response) {
                   if (errorService.validateUserResponse(response)) {
                       $('#meetingInvite').modal('hide');
                   }
               });
       }

       $scope.goToTaskDetails = function(id){
           $scope.changeActiveSection("task-details");
           $scope.taskId = id;
       }

      $scope.onTaskUpdate = function(){
            $scope.getContactDetails(id);
      }

      $scope.closeSection = function(){
          $scope.changeActiveSection('');
      }

        $scope.selectAssignee = function (data) {
            selectedAssignee = data.id;
        }


        $scope.recipientsSearchSuggestions = function (searchText) {
            var defer = $q.defer();
            var requestObj = {
                event:   "recipientsSearchSuggestions",
                payload: {
                    value: searchText
                }
            };

            requestManagerService.tasksRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        var results = response.payload.results;
                        $scope.recipientsSuggestions = results;
                        var suggestionList = [];
                        for (var i = 0; i < results.length; i += 1) {
                            if (results[i].displayValue) {
                                suggestionList.push({displayValue: results[i].displayValue, id: results[i].id, entityType: results[i].entityType });
                            }
                        }
                        return defer.resolve(suggestionList);
                    }
                })
            return defer.promise;
        }


        $scope.membersSearchSuggestions = function () {
            var requestObj = {
                event:   "members",
                payload: {}
            };

            requestManagerService.organizationsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        var results = response.payload.results;
                        if (results) {
                            $scope.membersSuggestions = results;
                            for (var i = 0; i < results.length; i += 1) {
                                if (localStorage.id === results[i].id) {
                                    results.splice(i, 1);
                                }
                                $scope.membersSuggestions[i]['displayValue'] = results[i].firstName + ' ' + results[i].lastName;
                            }
                        } else {
                            $scope.membersSuggestions = [
                                {displayValue: 'No members found!'}
                            ];
                        }
                    }
                })
        }


        var getDetailsForLead = function () {
            var user = $scope.contactProfile.basicDetails;

            if (user.firstName) {
                $scope.disableContactInfo = true;
                $scope.contactError = false;
                $scope.newLead.contact.id = $scope.contactProfile.id;
                $scope.newLead.contact.name = user.firstName + ' ' + user.lastName;
                $scope.newLead.contact.position = user.position;
                if (user.contactInformation) {
                    for (var i = 0; i < user.contactInformation.length; i += 1) {
                        if (user.contactInformation[i].contactType == "mobilePhoneNumber") {
                            $scope.newLead.contact.mobileNo = user.contactInformation[i].contactValue || '';
                        }
                        if (user.contactInformation[i].contactType == "emailAddress") {
                            $scope.newLead.contact.email = user.contactInformation[i].contactValue || '';
                        }
                    }
                }
            }
            if (!$scope.contactProfile.company.id) {
                return;
            }

            var requestObj = {
                event: 'getCompanyDetails',
                payload: {
                    companyId: $scope.contactProfile.company.id
                }
            };

            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        var company = response.payload;
                        $scope.disableCompanyInfo = false;
                        $scope.disableCompanyInfo = false;

                        if (company.basicDetails.name) {
                            if (company.id) {
                                $scope.newLead.company.id = company.id;
                            }
                            $scope.disableCompanyInfo = true;
                            $scope.companyError = false;
                            $scope.newLead.company = {
                                name: company.basicDetails.name,
                                country: company.basicDetails.country,
                                industry: company.specificDetails.industry,
                                employees: company.specificDetails.numberOfEmployees,
                                currency: company.specificDetails.revenue.currency,
                                revenue: company.specificDetails.revenue.amount
                            };
                        }
                    }
                });
        }


        $scope.companiesSearchSuggestions = function (searchText) {
            if (searchText) {
                var requestObj = {
                    event:   "searchSuggestions",
                    payload: {
                        value: searchText
                    }
                };

                requestManagerService.companiesRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.contactCompanies = response.payload.results;
                        }
                    })
            }
        }


        $scope.contactsSearchSuggestions = function (searchText) {
            if (searchText) {
                var requestObj = {
                    event:   "searchSuggestions",
                    payload: {
                        value: searchText
                    }
                };

                requestManagerService.contactsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.contactsSuggestions = response.payload.results;
                        }
                    })
            }
        }


        $scope.selectCompany = function (data) {
            var requestObj = {
                event:   "getCompanyDetails",
                payload: {
                    companyId: data.id
                }
            };

            requestManagerService.companiesRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        var company = response.payload;
                        $scope.newLead.company.id = data.id;
                        $scope.newLead.company.country = company.basicDetails.country;
                        $scope.newLead.company.employees = company.specificDetails.numberOfEmployees;
                        $scope.newLead.company.revenue = company.specificDetails.revenue.amount;
                        $scope.newLead.company.currency = company.specificDetails.revenue.currency;
                        $scope.newLead.company.industry = company.specificDetails.industry;
                        $scope.disableCompanyInfo = true;
                    }
                })
        }

        $scope.selectContact = function (data) {
            data['contactId'] = data.id;
            var requestObj = {
                event:   "getContactDetails",
                payload: {
                    contactId: data.contactId
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        var contact = response.payload;

                        $scope.newLead.contact.position = contact.basicDetails.position;
                        var contactInformation = contact.basicDetails.contactInformation;
                        for (var i = 0; i < contactInformation.length; i += 1) {
                            if (contactInformation[i].contactType == 'emailAddress') {
                                $scope.newLead.contact.email = contactInformation[i].contactValue;
                            }
                            if (contactInformation[i].contactType == 'mobilePhoneNumber') {
                                $scope.newLead.contact.mobileNo = contactInformation[i].contactValue;
                            }
                        }

                        $scope.disableContactInfo = true;
                    }
                })
        }


        $scope.addLead = function (newLead) {
            if (!newLead.contact.name && !newLead.company.name) {
                $scope.contactError = true;
                $scope.companyError = true;
                return;
            }
            if (!newLead.contact.name) {
                $scope.contactError = true;
                return;
            }
            if (!newLead.company.name) {
                $scope.companyError = true;
                return;
            }
            var contactInformation = [
                {
                    contactType:  "emailAddress",
                    contactValue: (newLead.contact.email) ? newLead.contact.email : ''
                },
                {
                    contactType:  "mobilePhoneNumber",
                    contactValue: (newLead.contact.mobileNo) ? newLead.contact.mobileNo : ''
                }
            ];
            newLead.contact.contactInformation = contactInformation;
            newLead.leadName = newLead.leadName || '';
            newLead.contact.position = newLead.contact.position || '';
            newLead.company.country = newLead.company.country || '';
            newLead.company.numberOfEmployees = newLead.company.employees || 0;
            newLead.company.revenue = {
                amount: newLead.company.revenue || 0,
                currency: newLead.company.currency || ''
            };

            delete newLead.contact.email;
            delete newLead.company.currency;
            var requestObj = {
                event:   'createLead',
                payload: newLead
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.disableContactInfo = false;
                        $scope.disableCompanyInfo = false;
                        $scope.companyError = false;
                        $scope.contactError = false;
                        $scope.changeActiveSection("");
                        $scope.$broadcast("GET_PROFILE", $scope.contactProfile);
                        $scope.getContactDetails($scope.contactProfile.id);
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


        $scope.selectMatch = function (item) {
            $scope.contactProfile.company.name = item.displayValue;
            $scope.updateContactInformation($scope.contactProfile.basicDetails);

        }


        $scope.redirectToContact = function (contactId) {
            $location.url("/contacts/" + contactId.toString());
        }


        $scope.deleteContact = function () {
            $scope.dismissModal();
            var contactId = $scope.contactProfile.id;
            var requestObj = {
                event:   "deleteContacts",
                payload: {
                    contactsToDelete: [contactId]
                }
            };
            //TODO: refactor this function
            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        if (response.payload.contacts.length > 0) {
                            $scope.forceDeleteData = response.payload.contacts;
                            showForceDeleteModal();
                        }
                        else {
                            $location.path('contacts');
                        }
                    }
                });
        }

        function showForceDeleteModal () {
            myModalService.setModalContent('Oops!', 'This contact is linked to at least 1 lead. By deleting this contact you are also deleting the leads associated with it, for you and your colleagues. Are you sure you want to continue?', 'Cancel', 'Delete');
            $('#myModal').modal('show');
            myModalService.setModalDeclineAction($scope.dismissModal);
            myModalService.setModalAcceptAction($scope.forceDeleteContact);
        }

        $scope.forceDeleteContact = function () {
            if ($scope.forceDeleteData) {
                var requestObj = {
                    event:   "forceDeleteContacts",
                    payload: {
                        contacts: $scope.forceDeleteData
                    }
                };
                $scope.dismissModal();
                requestManagerService.contactsRequest(requestObj)
                    .then(function (response) {
                        $scope.$broadcast("GET_PROFILE", $scope.contactProfile);
                        $location.path('contacts');
                    });
            }
        }

        function removeBackdrop () {
            $('.modal-backdrop').remove();
        }

        $scope.dismissModal = function () {
            $('#myModal').modal('hide');
            removeBackdrop();
        }


        $scope.setSocialNetworksModelFormat = function (data) {
            for (var i = 0; data && i < data.length; i++) {
                $scope.socialNewtorks[data[i].name] = data[i].URL;
                $scope.userSocialAccounts[data[i].name] = data[i].URL;
            }
        }


        $scope.changeActiveSection = function (newActiveSection) {
            $scope.activeSection = newActiveSection;
        }


        $scope.showSection = function () {
            if (!$scope.activeSection) { //activeSection can be also 0(check influences)
                return "";
            }

            if ($scope.activeSection === "influences" && $scope.influencesLoaded === false) {
                $scope.influencesLoaded = true;
                $scope.getContactsList();
            }
            utilSrv.resizeContainer();
            return "html/pages/Contact/detailsSection/contact_" + $scope.activeSection + ".html";
        }


        $scope.getCompanies = function () {
            var requestObj = {
                event:   "getCompanies",
                payload: {}
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactCompanies = response.payload.results;
                    }
                })
        }


        $scope.getContactsList = function () {
            var requestObj = {
                event:   "getContacts",
                payload: {
                    skip:  0,
                    limit: 0
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactsList = response.payload.results;
                    }
                })
        }


        $scope.getContactDetails = function (contactId) {
            var requestObj = {
                event:   "getContactDetails",
                payload: {
                    contactId: contactId
                }
            };

            if (!contactId) {
                console.error('undefined contactId', contactId);
            }

            requestManagerService.contactsRequest(requestObj)
                .then(function (response1) {
                    if (errorService.validateUserResponse(response1)) {
                        $scope.contactProfile = response1.payload;
                        $scope.selectedContacts = [];

                        if ($scope.contactProfile.influences && $scope.contactProfile.influences.contacts && $scope.contactProfile.influences.contacts.length) {
                            $scope.contactProfile.influences.contacts.map(function (value) {
                                $scope.selectedContacts.push(value.id);
                            }, $scope.selectedContacts);
                        }

                        $scope.setSocialNetworksModelFormat(response1.payload.socialNetworks);
                        $scope.loadedContactDetails = true;

                        $scope.taskContext = {
                            domain: 'contacts',
                            id: $scope.contactProfile.id,
                            displayValue: $scope.contactProfile.basicDetails.firstName + ' ' + $scope.contactProfile.basicDetails.lastName
                        };
                    }

                });

        }


        $scope.updateContactSocialAccounts = function (data) {
            var prop;
            for (prop in data) {
                if (!validateSrv.validHttp(data[prop]) && data[prop]) {
                    data[prop] = "http://" + data[prop];
                }
            }
            var socialNetworks = $scope.setSocialNetworksServerFormat(data);

            data = $scope.setSocialNetworksServerFormat(data);

            var requestObj = {
                event:   "updateSocialNetworks",
                payload: {
                    contactId:      $scope.contactProfile.id,
                    socialNetworks: data
                }
            };
            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.socialNetworks = response.payload.socialNetworks;
                        $scope.contactProfile.currentView = "contact";
                        $scope.setSocialNetworksModelFormat(response.payload.socialNetworks);
                        $scope.$broadcast("GET_PROFILE", $scope.contactProfile);
                    }
                });
        }


        $scope.updateContactInformation = function (data) {
            if (!$scope.contactProfile.basicDetails.firstName && !$scope.contactProfile.basicDetails.lastName) {
                $scope.firstNameError = true;
                $scope.lastNameError = true;
            } else
            if (!$scope.contactProfile.basicDetails.firstName) {
                $scope.firstNameError = true;
            } else
            if (!$scope.contactProfile.basicDetails.lastName) {
                $scope.lastNameError = true;
            } else {

                data.company = $scope.contactProfile.company.name;
                var requestObj = {
                    event: "updateBasicDetails",
                    payload: {
                        contactId: $scope.contactProfile.id,
                        basicDetails: data
                    }
                };

                requestManagerService.contactsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.contactProfile.basicDetails = response.payload.basicDetails;
                            $scope.contactProfile.company = response.payload.company;
                            $scope.$broadcast("GET_PROFILE", $scope.contactProfile);
                        }
                    });
            }
        }


        $scope.addField = function (array, contactType) {
            array = utilSrv.addDetail(array, contactType);
            $scope.contactProfile.currentView = "contact";
            $scope.contactProfile.contactInformation = array;
            $scope.$broadcast("GET_PROFILE", $scope.contactProfile);
        }

        $rootScope.$watch('uploadedImage', function (newVal, oldVal) {
           if (newVal) {
               var path = $location.path().split('/');
               var	id = path[path.length -1];
               var base64String = newVal.resized.dataURL.split(',')[1];
               if (id === $scope.contactProfile.id) {
                   $scope.contactProfile.basicDetails.imageData = base64String;
                   $scope.updateContactInformation($scope.contactProfile.basicDetails);
               }
           }
        });

        $scope.deleteContacts = function (contacts) {
            var requestObj = {
                event:   "deleteContacts",
                payload: {
                    contactsToDelete: contacts
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.basicDetails = response.payload.basicDetails;
                        $scope.$broadcast("GET_PROFILE", $scope.contactProfile);
                    }
                })
        }


        $scope.selectOptionsType = function (newType) {
            $scope.contactProfile.options.positionType = newType;
            $scope.updateOptions();
        }


        $scope.selectOptIn = function (newOptIn) {
            $scope.contactProfile.options.openForCommunication = newOptIn;
            $scope.updateOptions();
        }


        $scope.selectIntrest = function (index) {
            $scope.contactProfile.options.solutionAreas[index].selected = !$scope.contactProfile.options.solutionAreas[index].selected;
            $scope.updateOptions();
        }


        $scope.updateOptions = function () {
            var requestObj = {
                event:   "updateOptions",
                payload: {
                    contactId: $scope.contactProfile.id,
                    options:   $scope.contactProfile.options
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.options = response.payload.options;
                    }
                })
        }


        $scope.selectPosition = function (newPos) {
            $scope.contactProfile.hierarchicalPosition.selectedValue = newPos;
            $scope.updatePosition();
        }


        $scope.updatePositionComments = function (newComments) {
            $scope.contactProfile.hierarchicalPosition.comments = newComments;
            $scope.updatePosition();
        }


        $scope.updatePosition = function () {
            var requestObj = {
                event:   "updateHierarchicalPosition",
                payload: {
                    contactId: $scope.contactProfile.id,
                    hierarchicalPosition: $scope.contactProfile.hierarchicalPosition
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.hierarchicalPosition = response.payload.hierarchicalPosition;
                        //console.log('UPDATE hierarchicalPosition', response);
                    }
                })
        }


        $scope.selectPersonality = function (newPos) {
            $scope.contactProfile.personality.selectedValue = newPos;
            $scope.updatePersonality();
        }


        $scope.updatePersonalityComments = function (newComments) {
            $scope.contactProfile.personality.comments = newComments;
            $scope.updatePersonality();
        }


        $scope.updatePersonality = function () {
            var requestObj = {
                event:   "updatePersonality",
                payload: {
                    contactId:  $scope.contactProfile.id,
                    personality: $scope.contactProfile.personality
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.personality = response.payload.personality;
                        //$scope.$broadcast("GET_PROFILE",$scope.contactProfile);
                        //console.log('UPDATE personality', response);
                    }
                })
        }


        $scope.searchSuggestions = function (searchText) {
            var requestObj = {
                event:   "searchSuggestions",
                payload: {
                    value: searchText
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactsList = response.payload.results;
                    }
                })
        }


        $scope.selectRole = function (newRole) {
            $scope.contactProfile.role.selectedValue = newRole;
            $scope.updateRole();
        }


        $scope.updateRole = function () {
            var requestObj = {
                event:   "updateRole",
                payload: {
                    contactId: $scope.contactProfile.id,
                    role:   $scope.contactProfile.role
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.role = response.payload.role;
                        $scope.$broadcast("GET_PROFILE", $scope.contactProfile);
                        console.log('UPDATE role', response);
                    }
                })
        }


        $scope.setColor = function (type) {
            switch (type) {
                case "Champion":
                    return "c-green";
                case "Coach":
                    return "c-blue";
                case "Enemy":
                    return "c-orange";
                case "Neutral":
                    return "c-grey";
            }
        }


        $scope.selectType = function (newType) {
            $scope.contactProfile.contactType.selectedValue = newType;
            $scope.updateType();
        }

        $scope.updateType =  function(){
            var requestObj = {
                event:   "updateType",
                payload: {
                    contactId:$scope.contactProfile.id,
                    contactType: $scope.contactProfile.contactType
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function(response){
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.contactType = response.payload.contactType;
                        //$scope.$broadcast("GET_PROFILE",$scope.contactProfile);
                        //onsole.log('UPDATE type', response);
                    }
                })
        }


        $scope.selectPowerBase = function (newPowerBase) {
            $scope.contactProfile.powerBase.selectedValue = newPowerBase;
            $scope.updatePowerBase();
        }


        $scope.updatePowerBase = function () {
            var requestObj = {
                event:   "updatePowerBase",
                payload: {
                    contactId: $scope.contactProfile.id,
                    powerBase: $scope.contactProfile.powerBase
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.powerBase = response.payload.powerBase;
                        //$scope.$broadcast("GET_PROFILE",$scope.contactProfile);
                        // console.log('UPDATE powerBase', response);
                    }
                })
        }


        $scope.matchContact = function (item) {
            //$scope.selectedContacts.push(item.id);
            $scope.contactProfile.influences.contacts.push(item);
        }


        $scope.selectContact = function(contactId){
            var index = $scope.selectedContacts.indexOf(contactId);
            if(index >= 0){
                $scope.selectedContacts.splice(index, 1);
            }
            else{
                $scope.selectedContacts.push(contactId);
            }
        }


        $scope.updateInfluences = function () {
            $scope.activeSection = "";
            var requestObj = {
                event:   "updateInfluences",
                payload: {
                    contactId:  $scope.contactProfile.id,
                    influences: {
                        explanatoryText: $scope.contactProfile.influences.explanatoryText,
                        contacts:        $scope.selectedContacts
                    }
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.influences = response.payload.influences;
                        //$scope.$broadcast("GET_PROFILE",$scope.contactProfile);

                    }
                })
        }


        $scope.isInfluenceChecked = function (contactId) {
            if ($scope.selectedContacts.indexOf(contactId) >= 0) {
                return true;
            }
            return false;
        }


        $scope.selectAll = function (filteredContacts) {
            var index;
            if (filteredContacts) {
                filteredContacts.map(function (value) {
                    index = $scope.selectedContacts.indexOf(value.id);
                    if (index < 0) {
                        $scope.selectedContacts.push(value.id);
                    }
                }, $scope.selectedContacts);
            }
        }


        $scope.unselectAll = function () {
            $scope.selectedContacts = [];
        }


        $scope.updateAbout = function () {
           var requestObj = {
                event:   "updateAbout",
                payload: {
                    contactId:      $scope.contactProfile.id,
                    about:          $scope.contactProfile.about,
                    contactHistory: $scope.contactProfile.contactHistory
                }
            };

            requestManagerService.contactsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.contactProfile.about = response.payload.about;
                    }
                })
        }

        $scope.goToCompany = function (companyId) {
            if (companyId) {
                $location.path('companies/' + companyId);
            }
        }

       utilSrv.resizeContainer();

        var path = $location.path().split('/');
        var	id = path[path.length -1];
        if(/^[0-9]/i.test(id)){
            $scope.influencesLoaded = false;
            $scope.getContactDetails(id);
        }

}]);
