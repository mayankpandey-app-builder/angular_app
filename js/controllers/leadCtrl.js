app.controller('leadCtrl',['$rootScope', '$scope', '$timeout', 'myModalService', 'errorModalService', 'validateSrv', '$location', 'requestManagerService', 'errorService', 'utilSrv', 'countriesService','$filter','$q',
    function($rootScope,$scope, $timeout, myModalService, errorModalService, validateSrv, $location, requestManagerService, errorService, utilSrv, countriesService,$filter,$q){
        $rootScope.tabs = [
        {
            tabTitle: "Create Task",
            tabIcon: "icon-createtask-menu",
            tabCls: "create-task",
            tabAction: function(){
                $rootScope.analyticsContext = 'Leads';
                $rootScope.analyticsAction = 'Create task';
                $rootScope.analyticsLabel = 'View';
                $scope.activeSection = "create-task";
                $scope.taskError=false;
                $scope.startError=false;
                $scope.dlError=false;
                $scope.membersSearchSuggestions();
            }
        },
        {
            tabTitle: "Convert To Deal",
            tabIcon: "icon-converted",
            tabCls: "convert-to-deal",
            tabAction: function(){
                $rootScope.analyticsContext = 'Leads';
                $rootScope.analyticsAction = 'Convert lead to deal';
                $rootScope.analyticsLabel = 'View';
                if (localStorage['id'] !== $scope.leadProfile.ownerId) {
                    errorModalService.setErrorModal('Oops!', 'You are not the owner of this lead, you cannot convert it into a deal');
                    $('#errorModal').modal('show');
                }
                else {
                    var requestObj = {
                        event: 'territorySettings',
                        payload: {}
                    };

                    requestManagerService.organizationsRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                $scope.territories = response.payload.territories;
                                _.forEach($scope.territories, function (territory) {
                                    territory.isSelected = false;
                                });
                                $('#convertLead').modal('show');
                            }
                        });
                }
            }
        },
        {
            tabTitle: "Add Contacts",
            tabIcon: "icon-addcontact-menu",
            tabCls: "add-contacts",
            tabAction: function(){
                $scope.changeActiveSection("add-contacts");
                getAvailableContacts();
            }
        },
        {
            tabTitle: "Assign Lead",
            tabIcon: "icon-assignlead-menu",
            tabCls: "assign-to",
            tabAction: function(){
                if ($scope.leadProfile.ownerId !== localStorage['id']) {
                    errorModalService.setErrorModal('Oops!', 'You are not the owner of this lead, you cannot assign it.');
                    $('#errorModal').modal('show');
                    return;
                }
                else {
                    $scope.changeActiveSection("assign-to");
                    getOrganizationsMembers();
                }
            }
        },
        {
            tabTitle: "Delete Lead",
            tabIcon: "icon-delete",
            tabCls: "delete-lead",
            tabAction: function(){
                $rootScope.analyticsContext = 'Leads';
                $rootScope.analyticsAction = 'Delete lead';
                $rootScope.analyticsLabel = 'View';
                myModalService.setModalContent('Delete', 'Are you sure you want to delete this lead?', 'Cancel', 'Delete', 'Delete lead', 'Leads');
                $('#myModal').modal('show');
                myModalService.setModalDeclineAction(dismissModal);
                myModalService.setModalAcceptAction(deleteLead);
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

        $rootScope.helpPage = "http://static.iseeit.com/help/leads";

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

        $scope.leadDetailsLoaded = false;
        $scope.activeSection = "";
        $scope.assigneeChecked = false;
        $scope.newNote = {};

        $scope.countries = countriesService.getCountries();
        $scope.validateTel = validateSrv.validateTel;
        $scope.validateEmail = validateSrv.validateEmail;
        $scope.setImage = utilSrv.setImage;
        $scope.isChecked = utilSrv.isChecked;

        $scope.currentUser = localStorage['user'];
        $scope.currentDate = new Date().getTime();

        $scope.searchLeadsSuggestions = function (searchText) {
            var requestObj = {
                event:   'searchSuggestions',
                payload: {
                    value: searchText
                }
            };

            requestManagerService.leadsRequest(requestObj)
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


        $scope.redirectToLead = function (leadId) {
            $location.url("/leads/" + leadId.toString());
        }

        $scope.goToTaskDetails = function(id){
            $scope.changeActiveSection("task-details");
            $scope.taskId = id;
        }

        $scope.onTaskUpdate = function(){
            $scope.getLeadDetails(id);
        }

        $scope.closeSection = function(){
            $scope.changeActiveSection('');
        }

        var dismissModal = function () {
            $('#myModal').modal('hide');
        }


        var checkIfIsAssignee = function () {
            if (localStorage['id'] === $scope.leadProfile.assigneeId) {
                $rootScope.tabs.push(
                    {
                        tabTitle:  "Accept Lead",
                        tabIcon:   "icon-acceptlead-menu",
                        tabCls:    "accept-lead",
                        tabAction: function () {
                            acceptLead();
                        }
                    },
                    {
                        tabTitle:  "Decline Lead",
                        tabIcon:   "icon-declinelead-menu",
                        tabCls:    "decline-lead",
                        tabAction: function () {
                            declineLead();
                        }
                    });
            }
            $scope.$broadcast("GET_LEAD", $scope.leadProfile);
        }


        $scope.changeActiveSection = function (newActiveSection) {
            $scope.activeSection = newActiveSection;
        }


        $scope.showSection = function () {
            if ($scope.activeSection == "") {
                return "";
            }
            utilSrv.resizeContainer();
            return "html/pages/Lead/detailsSection/lead-" + $scope.activeSection + ".html";
        }

        $scope.taskCreated = function (newTask, taskId) {
            $scope.changeActiveSection("");
            $scope.$broadcast("GET_LEAD", $scope.leadProfile);
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
                            $scope.getLeadDetails($scope.leadProfile.id);
                        }
                    });
            }
            else {
                $scope.getLeadDetails($scope.leadProfile.id);
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
                                else {
                                    $scope.membersSuggestions[i]['displayValue'] = results[i].firstName + ' ' + results[i].lastName;
                                }
                            }
                        } else {
                            $scope.membersSuggestions = [
                                {displayValue: 'No members found!'}
                            ];
                        }
                    }
                })
        }


        $scope.validate = function (field, pristine) {
            if (pristine) {
                return true;
            } else if (field) {
                return true;
            }
            return false;
        }


        var getCurrencies = function () {
            var requestObj = {
                event:   'financialSettings',
                payload: {}
            };

            requestManagerService.organizationsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.currencies = response.payload.currency;
                    }
                });
        }


        $scope.getLeadDetails = function (id) {
            var requestObj = {
                event:   "getLeadDetails",
                payload: {
                    leadId: id
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.leadProfile = response.payload;
                        $timeout(function () {
                            $scope.$broadcast("GET_LEAD", $scope.leadProfile);
                        });
                        $scope.taskContext = {
                            domain: 'leads',
                            id: $scope.leadProfile.id,
                            displayValue: $scope.leadProfile.basicDetails.leadName
                        };
                        $scope.getSolutions($scope.leadProfile);
                    }
                });
        }


        $scope.getSolutions = function (data) {
            $scope.solutions = [];
            $scope.solutionsSelected = [];
            $scope.solutionResults = data.solutionArea;

            angular.forEach($scope.solutionResults, function (solution) {
                if (solution.selected) {
                    $scope.solutionsSelected.push(solution.solutionName);
                }
                ;
                $scope.solutions.push(solution.solutionName);
            });
            if (!$scope.assigneeChecked) {
                checkIfIsAssignee();
                $scope.assigneeChecked = true;
            }
            getCurrencies();
            $scope.leadDetailsLoaded = true;
        };


        $scope.updateLeadInformation = function (data) {
            if (data.leadStatus == "Trash") {
                $('#selectReason').modal('show');
                getTags();
            } else {
                data['reason'] = '';
                var requestObj = {
                    event:   "updateBasicDetails",
                    payload: {
                        leadId: id,
                        basicDetails: data
                    }
                };

                requestManagerService.leadsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.$broadcast("GET_LEAD", $scope.leadProfile);
                        }
                    });
            }
        };

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


        $scope.updateStatuses = function (status, reason) {
            var requestObj = {
                event:   "updateStatus",
                payload: {
                    leads:  [$scope.leadProfile.id],
                    status: status,
                    reason: reason
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.reasonTag = [];
                        $('#selectReason').modal('hide');
                        $scope.$broadcast("GET_LEAD", $scope.leadProfile);
                    }
                });
        }


        var getTags = function () {
            var requestObj = {
                event:   'getDomainTags',
                payload: {
                    domain: 'leads'
                }
            };

            requestManagerService.tagsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.reasons = response.payload.results;
                    }
                });
        }

        $scope.reasonTag = [];
        $scope.selectReason = function (item) {
            $scope.reasonTag.displayValue = item.displayValue;
        }


        $scope.selectSolution = function (index) {
            $scope.leadProfile.solutionArea[index].selected = !$scope.leadProfile.solutionArea[index].selected;
            var requestObj = {
                event:   'updateSolutionArea',
                payload: {
                    leadId:       id,
                    solutionArea: $scope.leadProfile.solutionArea
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.leadProfile.solutionArea = response.payload.solutionArea;
                        //$scope.$broadcast("GET_LEAD", $scope.leadProfile);
                    }
                });
        }


        var getOrganizationsMembers = function () {
            var requestObj = {
                event:   "members",
                payload: {}
            };

            requestManagerService.organizationsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        /*for (var i = 0; i < response.payload.results.length; i += 1) {
                            if (localStorage['id'] === response.payload.results[i].id) {
                                response.payload.results.splice(i, 1);
                            }
                        }*/
                        $scope.organizationsMembers = response.payload.results;

                    }
                })
        }


        var getAvailableContacts = function () {
            var requestObj = {
                event:   "getContactsToAssociateWithLead",
                payload: {
                    leadId: id
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.selectedAvailableContacts = [];
                        $scope.contactsAvailableForAssociation = response.payload.contacts;
                    }
                });
        }


        $scope.assignLeadToContact = function (assignee) {
            if (localStorage['id'] !== $scope.leadProfile.ownerId) {
                errorModalService.setErrorModal('Oops', 'You are not the owner of this lead, you cannot assign it.');
                $('#errorModal').modal('show');
                return;
            }
            else {
                var requestObj = {
                    event:   "assignLeadsToOrganizationMember",
                    payload: {
                        memberId: assignee.id,
                        leads:  [$scope.leadProfile.id]
                    }
                };

                requestManagerService.leadsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.getLeadDetails(id);
                            $scope.changeActiveSection('');
                        }
                    });
            }
        }


        var deleteLead = function () {
            var requestObj = {
                event:   "deleteLeads",
                payload: {
                    leads: [id]
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $('#myModal').modal('hide');
                        $location.path('leads');
                    }
                    else {
                        $('#myModal').modal('hide');
                    }
                })
        }


        $scope.getSharedWithList = function () {
            var requestObj = {
                event:   "getOrganizationMembersAvailableForShare",
                payload: {
                    leadId: id
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.changeActiveSection('shared-with');
                        $scope.selectedSharedWithMembers = [];

                        for (var i = response.payload.contacts.length - 1; i >= 0; i -= 1) {
                            for (var j = 0; j < $scope.leadProfile.sharedWith.length; j += 1) {
                                if (response.payload.contacts[i].id === $scope.leadProfile.sharedWith[j].memberId) {
                                    response.payload.contacts[i].canBeDeleted = true;
                                    $scope.selectedSharedWithMembers.push(response.payload.contacts[i].id);
                                }
                            }
                        }
                        $scope.sharedWithList = response.payload.contacts;
                    }
                });
        }


        $scope.selectSharedWithMember = function (memberId) {
            var index = $scope.selectedSharedWithMembers.indexOf(memberId);
            if (index !== -1) {
                $scope.selectedSharedWithMembers.splice(index, 1);
            }
            else {
                $scope.selectedSharedWithMembers.push(memberId);
            }
            for (var i = 0; i < $scope.sharedWithList.length; i += 1) {
                if ($scope.sharedWithList[i].id === memberId) {
                    $scope.sharedWithList[i].canBeDeleted = false;
                }
            }
        }


        $scope.selectAvailableContact = function (contactId) {
            var index = $scope.selectedAvailableContacts.indexOf(contactId);
            if (index !== -1) {
                $scope.selectedAvailableContacts.splice(index, 1);
            }
            else {
                $scope.selectedAvailableContacts.push(contactId);
            }
            for (var i = 0; i < $scope.contactsAvailableForAssociation.length; i += 1) {
                if ($scope.contactsAvailableForAssociation[i].id === contactId) {
                    $scope.contactsAvailableForAssociation[i].canBeDeleted = false;
                }
            }
        }


        $scope.isSharedWithMemberChecked = function (memberId) {
            return $scope.selectedSharedWithMembers.indexOf(memberId) !== -1;
        }


        $scope.isAvailableContactChecked = function (memberId) {
            return $scope.selectedAvailableContacts.indexOf(memberId) !== -1;
        }


        $scope.shareWith = function () {
            var membersIds = $scope.leadProfile.sharedWith.map(function (member) {
                return member.memberId
            });

            var requestObj = {
                event:   "shareLeadWithOrganizationMembers",
                payload: {
                    leadId:    id,
                    memberIds: $scope.selectedSharedWithMembers
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.getLeadDetails(id);
                        $scope.changeActiveSection('');
                    }
                });
        }


        $scope.associateContacts = function () {
            var requestObj = {
                event:   "associateContactsWithLead",
                payload: {
                    leadId:     id,
                    contactIds: $scope.selectedAvailableContacts
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.getLeadDetails(id);
                        $scope.changeActiveSection('');
                    }
                });
        }


        $scope.selectAllSharedWithMembers = function (filteredSharedWithMembers) {
            var index;
            if (filteredSharedWithMembers) {
                filteredSharedWithMembers.map(function (value) {
                    index = $scope.selectedSharedWithMembers.indexOf(value.id);
                    if (index < 0) {
                        $scope.selectedSharedWithMembers.push(value.id);
                    }
                }, $scope.selectedSharedWithMembers);
            }
        }


        $scope.selectAllAvailableContacts = function (filteredAvailableContacts) {
            var index;
            if (filteredAvailableContacts) {
                filteredAvailableContacts.map(function (value) {
                    index = $scope.selectedAvailableContacts.indexOf(value.id);
                    if (index < 0) {
                        $scope.selectedAvailableContacts.push(value.id);
                    }
                }, $scope.selectedAvailableContacts);
            }
        }


        $scope.unselectAllSharedWithMembers = function () {
            $scope.selectedSharedWithMembers = [];
        }


        $scope.unselectAllAvailableContacts = function () {
            $scope.selectedAvailableContacts = [];
        }


        var acceptLead = function () {
            var requestObj = {
                event:   "acceptDeclineLead",
                payload: {
                    leadId:     id,
                    assigneeId: localStorage['id'],
                    accepted:   true
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.getLeadDetails(id);
                    }
                });
            $rootScope.tabs.splice(5, 2);
        }


        var declineLead = function () {
            var requestObj = {
                event:   "acceptDeclineLead",
                payload: {
                    leadId:     id,
                    assigneeId: localStorage['id'],
                    accepted:   false
                }
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.getLeadDetails(id);
                    }
                });
            $rootScope.tabs.splice(5, 2);
        }


        $scope.changeStageTo = function (val) {
            if ($scope.leadProfile.stage.current < 2 && $scope.leadProfile.ownerId === localStorage['id']) {
                errorModalService.setErrorModal('Oops!', 'You cannot change the stage of this lead until it has been accepted or declined.');
                $('#errorModal').modal('show');
            }
            else {
                var requestObj = {
                    event:   "updateStage",
                    payload: {
                        leadId: id,
                        stage:  val
                    }
                };

                requestManagerService.leadsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.getLeadDetails(id);
                        }
                    });
            }
        }


        $scope.convertLeadToDeal = function (territoryId) {
            var requestObj = {
                event:   "convertToDeal",
                payload: {
                    leadId: id,
                    territoryId: territoryId
                }
            };

            $('#convertLead').modal('hide');
            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        var dealId = response.payload.deal.id;
                        $location.path('/deals/' + dealId);
                    }
                });
        }


        $scope.updateQualifier = function (qualifierName, newStatus) {
            var requestObj = {
                event:   "updateQualifiers",
                payload: {
                    leadId:     id,
                    qualifiers: {}
                }
            };
            requestObj.payload.qualifiers[qualifierName] = {
                text:            $scope.leadProfile.qualifiers[qualifierName].text,
                status:          newStatus,
                explanatoryText: $scope.leadProfile.qualifiers[qualifierName].explanatoryText
            };

            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.getLeadDetails(id);
                    }
                });
        }


        $scope.addQuickNote = function (newNote, oldNotes) {
            if (newNote.text) {
                oldNotes.push({
                    timestamp: $scope.currentDate,
                    text:      newNote.text,
                    author:    $scope.currentUser,
                    fromMerge: false
                });
                $scope.newNote.text = '';
            }

            oldNotes = _.filter(oldNotes, function (note) {
                return note.text != '';
            });

            var requestObj = {
                event:   "updateNotes",
                payload: {
                    leadId: id,
                    notes:  oldNotes
                }
            };
            
            requestManagerService.leadsRequest(requestObj)
                .then(function (response) {
                    if (errorService.validateUserResponse(response)) {
                        $scope.leadProfile.notes = response.payload.notes;
                        $scope.$broadcast("GET_LEAD", $scope.leadProfile);
                    }
                })
        }

        var path = $location.path().split('/');
        var	id = path[path.length -1];
        if(/^[0-9]/i.test(id)){
            $scope.getLeadDetails(id);
        }

        utilSrv.resizeContainer();

}]);