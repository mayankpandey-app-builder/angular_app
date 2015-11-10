app.directive('teamStructure', function ($rootScope, requestManagerService, errorService, errorModalService, $q, validateSrv) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-team-structure.html',
        link: function (scope, elemn, attr) {
            scope.$on('GET_ADMIN_TEAM_STRUCTURE', function (event, data) {
                scope.data = data;
            });

            scope.newContact = {};
            scope.newContactModal = {};
            var selectedRecipients = [];

            scope.getTabs = function () {
                scope.milestoneSelected=false;
                scope.qualifierSelected=false;
                if (scope.sections['teamCollapsed']) {
                    scope.tabs = [
                        {
                            tabTitle: "Add new member",
                            tabIcon: "icon-addcontact-menu",
                            tabCls: "add-member",
                            tabAction: function () {
                                scope.region = '';
                                scope.businessUnit = '';
                                scope.changeActiveSection('add-member');
                            }
                        },
                        {
                            tabTitle: "Invite member",
                            tabIcon: "icon-addcontact-menu",
                            tabCls: "invite-member",
                            tabAction: function () {
                                scope.changeActiveSection('invite-member');
                            }
                        }
                    ];
                }
                else {
                    scope.tabs = [];
                }
            }
            scope.changeActiveSection = function (newActiveSection) {
                scope.activeSection = newActiveSection;
            }

            scope.showSection = function() {
                if (scope.activeSection == "") {
                    return "";
                }
                return "html/pages/Admin/detailsSection/_admin-" + scope.activeSection + ".html";
            }

            var teamStructureRetrieved = false;

            var level = 0;
            var setMemberLevel = function (members) {
                for (var i = 0; i < members.length; i += 1) {
                    members[i].level = level;
                }
                for (var i = 0; i < members.length; i += 1) {
                    if (members[i].subordinates.length > 0) {
                        level = members[i].level + 1;
                        setMemberLevel(members[i].subordinates);
                    }
                }
            }

            scope.getTeamStructure = function (device) {
                level = 0;
                if (device) {
                    $rootScope.device = device;
                }
                scope.changeActiveSection('');
                var requestObj = {
                    event: 'getMembersListForAdmin',
                    payload: {}
                };
                if (!teamStructureRetrieved) {
                    requestManagerService.organizationsRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                teamStructureRetrieved = true;
                                scope.admins = response.payload.admins;
                                scope.members = response.payload.members;
                                setMemberLevel(scope.members);
                                scope.pendingInvitations = response.payload.pendingInvitations;
                                scope.$broadcast('GET_ADMIN_TEAM_STRUCTURE', scope.members);
                                scope.$broadcast('GET_ADMIN_TEAM_PENDING', scope.pendingInvitations);
                                scope.$broadcast('GET_ADMIN_TEAM_ADMINS', response.payload);
                                scope.gerOrganizationMembers();
                            }
                        });
                }
            }

            var readImage = function (input) {
                if (input[0].files && input[0].files[0]) {
                    var reader = new FileReader();

                    reader.onload = function (e) {
                        scope.imageData = e.target.result;
                        scope.$apply();
                    }
                    reader.readAsDataURL(input[0].files[0]);
                }
            }

            var readImageForUpload = function(input) {

                var files = input.context.files;
                var file = files[0];
                if(files && file){
                    var reader = new FileReader();

                    reader.onload = function (readerEvt) {
                        var binaryString = readerEvt.target.result;

                        scope.newContact.imageData = btoa(binaryString);
                    };

                    reader.readAsBinaryString(file);
                }
            }

            scope.fileNameChaged = function(input){
                readImage(input);
                readImageForUpload(input);
            }

            scope.gerOrganizationMembers = function(){
                requestManagerService.organizationsRequest({ event: 'members', payload: {}})
                    .then(function(response){
                        if (errorService.validateUserResponse(response)) {
                            var results = response.payload.results;
                            scope.recipientsSuggestions = results;
                            scope.suggestionList = [];
                            for (var i = 0; i < results.length; i += 1) {
                                scope.suggestionList.push({displayValue: results[i].firstName + ' ' + results[i].lastName, id: results[i].id});
                            }
                            scope.getBusinessUnits();
                        }
                    });
            }

            scope.searchInSuggestionList = function (searchText) {
                var defer = $q.defer();
                var suggestionList = [];
                for (var i = 0; i < scope.suggestionList.length; i += 1) {
                    if (scope.suggestionList[i].displayValue.indexOf(searchText) !== -1) {
                        suggestionList.push(scope.suggestionList[i]);
                    }
                }
                defer.resolve(suggestionList);
                return defer.promise;
            }

            scope.selectItem = function (type) {
                switch (type) {
                    case 'allocatedTo':{
                        selectedRecipients = [];
                        var recipient = scope.newContact.allocatedTo;
                        if (recipient) {
                            for (var i = 0; i < recipient.length; i += 1) {
                                selectedRecipients.push(recipient[i].id);
                            }
                        }
                    }; break;

                    default: console.error('Select item function has no parameter!');
                }

            }

            scope.getBusinessUnits = function () {
                requestManagerService.businessUnitsRequest({ event: 'getBusinessUnitsList', payload: {}})
                    .then(function(response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.businessUnits = response.payload.businessUnits;
                            scope.getRegionalStructure();
                        }
                    });
            }

            scope.flattenTerritories = [];
            scope.getFlattenTerritories = function (territories) {
                for (var i = 0; i < territories.length; i += 1) {
                    if (!checkTerritoryInList(territories[i].id, territories[i].displayValue)) {
                        scope.flattenTerritories.push({id: territories[i].id, displayValue: territories[i].displayValue});
                    }
                    if (territories[i].territories.length > 0) {
                        scope.getFlattenTerritories(territories[i].territories);
                    }
                }
            }

            var checkTerritoryInList = function (territoryId, territoryName) {
                for (var i = 0; i < scope.flattenTerritories.length; i += 1) {
                    if (scope.flattenTerritories[i].id === territoryId && scope.flattenTerritories[i].displayValue === territoryName) {
                        return true;
                    }
                }
                return false;
            }

            scope.editMemberFromModal = function (memberModal) {
                if (memberModal.detailsModified) {
                    if (!memberModal.firstName) {
                        scope.firstnameError = true;
                    }
                    else {
                        scope.firstnameError = false;
                    }
                    if (!memberModal.lastName) {
                        scope.lastnameError = true;
                    }
                    else {
                        scope.lastnameError = false;
                    }
                    if (!memberModal.position) {
                        scope.positionError = true;
                    }
                    else {
                        scope.positionError = false;
                    }
                    if (!memberModal.firstName || !memberModal.lastName || !memberModal.position) {
                        return;
                    }
                    else {
                        scope.editMember(memberModal);
                    }
                }
                if (memberModal.roleModified) {
                    if (!memberModal.role) {
                        scope.roleError = true;
                    }
                    else {
                        scope.roleError = false;
                    }
                    if (!memberModal.role) {
                        return;
                    }
                    else {
                        scope.editMemberRole(memberModal.role, memberModal.id);
                    }
                }
                if (memberModal.regionModified) {
                    if (!memberModal.region) {
                        scope.regionError = true;
                    }
                    else {
                        scope.regionError = false;
                    }
                    if (!memberModal.region) {
                        return;
                    }
                    else {
                        scope.editMemberRegion(memberModal.region, memberModal.id);
                    }
                }
                if (memberModal.businessUnitModified) {
                    scope.editMemberBU(memberModal.businessUnit, memberModal.id);
                }
                $('#editMemberModal').modal('hide');
            }

            scope.addNewMemberFromModal = function (newMemberModal) {
                if (!newMemberModal.firstName) {
                    scope.firstnameError = true;
                }
                else {
                    scope.firstnameError = false;
                }
                if (!newMemberModal.lastName) {
                    scope.lastnameError = true;
                }
                else {
                    scope.lastnameError = false;
                }
                if (!newMemberModal.email) {
                    scope.emailError = true;
                }
                else {
                    scope.emailError = false;
                }
                if (!newMemberModal.position) {
                    scope.positionError = true;
                }
                else {
                    scope.positionError = false;
                }
                if (!newMemberModal.role) {
                    scope.roleError = true;
                }
                else {
                    scope.roleError = false;
                }
                if (!newMemberModal.region) {
                    scope.regionError = true;
                }
                else {
                    scope.regionError = false;
                }
                if (!newMemberModal.firstName || !newMemberModal.lastName || !newMemberModal.email || !newMemberModal.position || !newMemberModal.role || !newMemberModal.region) {
                    return;
                }
                if (scope.subordinateOf) {
                    newMemberModal.reportsTo = scope.subordinateOf.id;
                }
                requestManagerService.identityRequest({ event: 'addNewMember', payload: newMemberModal})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.subordinateOf = '';
                            scope.getTeamStructure();
                            $('#addMemberModal').modal('hide');
                        }
                    });
            }

            scope.addNewMember = function (newContact) {
                newContact.allocatedTo = selectedRecipients;
                if (scope.selectedRegion && scope.selectedRegion.id) {
                    newContact.region = scope.selectedRegion.id;
                }
                newContact.contactInformation = [
                    {
                        contactType: "emailAddress",
                        contactValue: newContact.email
                    },
                    {
                        contactType: "mobilePhoneNumber",
                        contactValue: newContact.mobileNo
                    },
                    {
                        contactType: "officePhoneNumber",
                        contactValue: newContact.officeNo
                    },
                    {
                        contactType: "skypeName",
                        contactValue: newContact.skypeName
                    },
                    {
                        contactType: "street",
                        contactValue: newContact.street
                    },
                    {
                        contactType: "city",
                        contactValue: newContact.city
                    },
                    {
                        contactType: "postalCode",
                        contactValue: newContact.postalCode
                    },
                    {
                        contactType: "state",
                        contactValue: newContact.state
                    }
                ];
                if (scope.subordinateOf) {
                    newContact.reportsTo = scope.subordinateOf.id;
                }
                requestManagerService.identityRequest({ event: 'addNewMember', payload: newContact})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.subordinateOf = '';
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.teamTree = {
                dragStop: function (event) {
                    updateMemberReportTo(event);
                }
            }

            var updateMemberReportTo = function (data) {
                var parentId = '';
                var nodeId = data.source.nodeScope.$modelValue.id;
                if (data.dest.nodesScope.$parent.$modelValue) {
                    parentId = data.dest.nodesScope.$parent.$modelValue.id;
                }
                var payload = {
                    memberId: nodeId,
                    reportsTo: parentId
                };
                requestManagerService.membersRequest({ event: 'updateReportsTo', payload: payload})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.updateUserRole = function (newRole, data) {
                var nodeId = data.$nodeScope.$modelValue.id;
                var payload = {
                    memberId: nodeId,
                    roleInOrganization: newRole
                };
                requestManagerService.membersRequest({ event: 'updateRole', payload: payload})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.editMemberRole = function (newRole, id) {
                var payload = {
                    memberId: id,
                    roleInOrganization: newRole
                };
                requestManagerService.membersRequest({ event: 'updateRole', payload: payload})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.updateBusinessUnitForTeamStructure = function (newBusinessUnit, data) {
                var nodeId = data.$nodeScope.$modelValue.id;
                var payload = {
                    memberId: nodeId,
                    businessUnitId: newBusinessUnit
                };
                requestManagerService.membersRequest({ event: 'updateBusinessUnit', payload: payload})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.editMemberBU = function (newBusinessUnit, id) {
                var payload = {
                    memberId: id,
                    businessUnitId: newBusinessUnit
                };
                requestManagerService.membersRequest({ event: 'updateBusinessUnit', payload: payload})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.updateActivationStatus = function (newStatus, data) {
                var nodeId = data.$nodeScope.$modelValue.id;
                var payload = {
                    memberIds: [nodeId],
                    active: !newStatus
                };
                requestManagerService.membersRequest({ event: 'changeActivationStatus', payload: payload})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.addNewSubordinate = function (data) {
                scope.region = '';
                scope.businessUnit = '';
                scope.subordinateOf = data.$nodeScope.$modelValue;
                scope.changeActiveSection('add-member');
                scope.newContact = {};
            }

            scope.addNewSubordinateModal = function (data) {
                scope.region = '';
                scope.businessUnit = '';
                scope.subordinateOf = data.$nodeScope.$modelValue;
                scope.newContactModal = {};
                $('#addMemberModal').modal('show');
            }


            scope.editSubordinateModal = function (data) {
                if (data) {
                    scope.editContactModal = data.$nodeScope.$modelValue;
                    scope.region = data.$nodeScope.$modelValue.region;
                    scope.businessUnit = jQuery.isEmptyObject(data.$nodeScope.$modelValue.businessUnit) ? '' : data.$nodeScope.$modelValue.businessUnit;
                    $('#editMemberModal').modal('show');
                }
            }

            scope.showEditMember = function (data) {
                if (data) {
                    scope.editedContact = data.$nodeScope.$modelValue;
                    scope.region = data.$nodeScope.$modelValue.region;
                    scope.businessUnit = jQuery.isEmptyObject(data.$nodeScope.$modelValue.businessUnit) ? '' : data.$nodeScope.$modelValue.businessUnit;
                    scope.changeActiveSection('edit-member');
                }
            }

            scope.editMember = function (memberInfo) {
                if (!memberInfo.firstName) {
                    scope.firstnameError = true;
                }
                else {
                    scope.firstnameError = false;
                }
                if (!memberInfo.lastName) {
                    scope.lastnameError = true;
                }
                else {
                    scope.lastnameError = false;
                }
                if (!memberInfo.position) {
                    scope.positionError = true;
                }
                else {
                    scope.positionError = false;
                }
                if (!memberInfo.role) {
                    scope.roleError = true;
                }
                else {
                    scope.roleError = false;
                }
                if (!memberInfo.region) {
                    scope.regionError = true;
                }
                else {
                    scope.regionError = false;
                }
                if (!memberInfo.firstName || !memberInfo.lastName || !memberInfo.position || !memberInfo.role || !memberInfo.region) {
                    return;
                }
                var requestObj = {
                    event: 'adminUpdateMemberBasicDetails',
                    payload: {
                        memberId: memberInfo.id,
                        firstName: memberInfo.firstName,
                        lastName: memberInfo.lastName,
                        position: memberInfo.position
                    }
                };
                requestManagerService.membersRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            if (memberInfo.id === localStorage['id']) {
                                $rootScope.$broadcast('topNameChanged', memberInfo.firstName + ' ' + memberInfo.lastName);
                            }
                            teamStructureRetrieved = false;
                            scope.subordinateOf = '';
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.getAllocatedTo = function (data) {
                scope.changeActiveSection('edit-allocatedto');
                scope.whoIsAllocated = data.$nodeScope.$modelValue;
                var allocated = [];
                for (var i = 0; i < scope.whoIsAllocated.allocatedTo.length; i += 1) {
                    allocated.push({displayValue: scope.whoIsAllocated.allocatedTo[i].firstName + ' ' + scope.whoIsAllocated.allocatedTo[i].lastName, id: scope.whoIsAllocated.allocatedTo[i].id});
                }
                scope.whoIsAllocated.allocatedTo = allocated;
            }

            scope.updateAllocatedTo = function (data) {
                var allocatedTo = [];
                for (var i = 0; i < data.allocatedTo.length; i += 1) {
                    allocatedTo.push(data.allocatedTo[i].id);
                }
                var payload = {
                    memberId: scope.whoIsAllocated.id,
                    allocatedTo: allocatedTo
                };
                requestManagerService.membersRequest({ event: 'updateAllocatedTo', payload: payload})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.updateUserRegion = function (regionId, data) {
                var nodeId = data.$nodeScope.$modelValue.id;
                var payload = {
                    memberId: nodeId,
                    regionId: regionId
                };
                requestManagerService.membersRequest({ event: 'updateRegion', payload: payload})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.editMemberRegion = function (regionId, id) {
                var payload = {
                    memberId: id,
                    regionId: regionId
                };
                requestManagerService.membersRequest({ event: 'updateRegion', payload: payload})
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            teamStructureRetrieved = false;
                            scope.getTeamStructure();
                        }
                    });
            }

            scope.deleteUserNode = function () {
                if (scope.subordinateOf) {
                    for (var i = 0; i < scope.subordinateOf.subordinates.length; i += 1) {
                        if (!scope.subordinateOf.subordinates[i].id) {
                            scope.subordinateOf.subordinates.splice(i, 1);
                        }
                    }
                }
            }

            scope.inviteNewMember = function (newMemberEmail) {
               if (newMemberEmail) {
                   var regEmail = RegExp(/[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}/);
                   if (!regEmail.test(newMemberEmail.email)) {
                       errorModalService.setErrorModal('Oops', "Please enter a valid email address.");
                       $('#errorModal').modal('show');
                       return;
                   }
                   var payload = {
                       email: newMemberEmail.email
                   };
                   requestManagerService.organizationsRequest({ event: 'inviteTeamMember', payload: payload})
                       .then(function (response) {
                           if (errorService.validateUserResponse(response)) {
                               scope.getMembersList();
                           }
                       });
               }
            }

            scope.showAddMemberModal = function () {
                scope.region = '';
                scope.businessUnit = '';
                $('#addMemberModal').modal('show');
            }
        }
    };
});