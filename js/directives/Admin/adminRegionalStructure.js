
app.directive('organizationStructure', function (requestManagerService,errorService,errorModalService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-structure-organizationStructure.html',
        link: function (scope, elemn, attr) {
            scope.getRegionalStructure = function () {

                var requestObj = {
                    event: "getRegionalStructure",
                    payload: {}
                }
                requestManagerService.regionalStructureRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.territories = response.payload.territories;
                            scope.getFlattenTerritories(scope.territories);
                            scope.getBusinessUnitsList();
                        }
                    });
            };

            var addTerritory = function (displayValue, parent) {
//        console.log($scope.territories);
//        searchTree($scope.territories[0], displayValue);
                var requestObj = {
                    event: "createTerritory",
                    payload: {
                        displayValue: displayValue,
                        parent:       parent
                    }
                }
                requestManagerService.regionalStructureRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            console.log(response);
                        }
                    });
            };

            var searchTree = function(element, displayValue){
                if(element.displayValue == displayValue){
                    alert('Found it!');
                }else if (element.territories != null){
                    var result = null;
                    for(var i=0; result == null && i < element.territories.length; i++){
                        result = searchTree(element.territories[i], displayValue);
                    }
                    return result;
                }
                return null;
            }

            var updateTerritory = function (id, displayValue, parent) {
                var requestObj = {
                    event:   "updateTerritory",
                    payload: {
                        territory: {
                            id:           id,
                            displayValue: displayValue,
                            parent:       parent
                        }
                    }
                }
                requestManagerService.regionalStructureRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                        }
                    });
            };

            scope.deleteTerritory = function (item) {
                if (item.territories.length === 0){
                    var requestObj = {
                        event: "deleteTerritory",
                        payload: {
                            territoryId: item.id
                        }
                    }
                    requestManagerService.regionalStructureRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                scope.getRegionalStructure();
                            }
                        });
                }else{

                    if (item.territories.length === 1){
                        var multiples=' territory!'
                    }else{
                        var multiples=' territories!'
                    }
                    errorModalService.setErrorModal('Delete', 'You cannot delete ' + item.displayValue + ' territory. It has '+item.territories.length + ' other '+multiples);
                    $('#errorModal').modal('show');
                }

            };

            scope.regionalTree = {
                dragStop: function(event) {
                    scope.updateRegion('dragStop',event);
                }
            }

            scope.updateRegion = function(event,data){

                if (event && data){
                    switch (event) {
                        case 'dragStop':
                            var parentId = '';
                            var nodeId = data.source.nodeScope.$modelValue.id;
                            var nodeDisplayValue = data.source.nodeScope.$modelValue.displayValue;
                            if (data.dest.nodesScope.$parent.$modelValue) {
                                parentId = data.dest.nodesScope.$parent.$modelValue.id;
                            }
                            updateTerritory(nodeId,nodeDisplayValue,parentId);
                            break;

                        case 'updateName':
                            var parentId = '';
                            var nodeId = '';
                            nodeId = data.$nodeScope.$modelValue.id;
                            var nodeDisplayValue = data.$nodeScope.$modelValue.displayValue;
                            if (data.$nodeScope.$parentNodeScope) {
                                parentId = data.$nodeScope.$parentNodeScope.$modelValue.id;
                            }
                            if (!nodeId && nodeDisplayValue){
                                addTerritory(nodeDisplayValue,parentId);
                            }else{
                                updateTerritory(nodeId,nodeDisplayValue,parentId);
                            }
                            break;

                        default:
                            break;
                    }

                }
            };
        }
    };
});
app.directive('businessUnit', function (requestManagerService,errorService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-structure-businessUnit.html',
        link: function (scope, elemn, attr) {

            scope.getBusinessUnitsList = function () {
                var requestObj = {
                    event: "getBusinessUnitsList",
                    payload: {}
                }
                requestManagerService.businessUnitsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.businessUnits = response.payload.businessUnits;
                        }
                    });
            };

            scope.addBusinessUnit = function (displayValue) {
                if (displayValue){
                    var requestObj = {
                        event: "createBusinessUnit",
                        payload: {
                            displayValue: displayValue
                        }
                    }
                    requestManagerService.businessUnitsRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                scope.newBusiness='';
                                scope.getBusinessUnitsList();
                            }
                        });
                }

            };
            scope.deleteBusinessUnit = function (item) {
                var requestObj = {
                    event: "deleteBusinessUnit",
                    payload: {
                        businessUnitId: item.business.id
                    }
                }
                requestManagerService.businessUnitsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.getBusinessUnitsList();
                        }
                    });
            };
            scope.updateBusinessUnit = function (item,displayValue) {
                if (displayValue){
                    var requestObj = {
                        event: "updateBusinessUnit",
                        payload: {
                            businessUnit: {
                                id: item.business.id,
                                displayValue: displayValue
                            }
                        }
                    }
                    requestManagerService.businessUnitsRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                                scope.getBusinessUnitsList();
                            }
                        });
                }
            };
//            scope.$on('GET_ADMIN', function (event, data) {
//                console.log(data);
//            });
        }
    };
});
app.directive('solutionAreas', function (errorModalService,requestManagerService,errorService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-structure-solutionAreas.html',
        link: function (scope, elemn, attr) {

            scope.addSolution= function (displayValue) {
                var duplicate = false;

                if (displayValue) {

                    for (var i = 0; i < scope.organization.solutionArea.length; i += 1) {
                        if (displayValue == scope.organization.solutionArea[i]) {
                            errorModalService.setErrorModal('New Solution Area', 'The solution area already exists.');
                            $('#errorModal').modal('show');
                            scope.newSolution = '';
                            duplicate = true;
                        }
                    }

                    if (!duplicate) {
                        scope.organization.solutionArea.push(displayValue);
                        var requestObj = {
                            event:   "updateOrganizationWideConfiguration",
                            payload: {
                                industries: scope.organization.industries,
                                solutionAreas: scope.organization.solutionArea
                            }
                        }
                        requestManagerService.organizationsRequest(requestObj)
                            .then(function (response) {
                                if (errorService.validateUserResponse(response)) {
                                    scope.newSolution = '';
                                    scope.organization.solutionArea = response.payload.solutionAreas;
                                }
                            });
                    }

                }

            };

            scope.updateSolutionArea = function (index, newValue) {
                if (!newValue) {
                    scope.organization.solutionArea.splice(index, 1);
                }
                else {
                    scope.organization.solutionArea[index] = newValue;
                }
                var requestObj = {
                    event:   "updateOrganizationWideConfiguration",
                    payload: {
                        industries: scope.organization.industries,
                        solutionAreas: scope.organization.solutionArea
                    }
                }

                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.organization.solutionArea = response.payload.solutionAreas;
                        }
                    });
            }

        }
    };
});
app.directive('industriesList', function (errorModalService,requestManagerService,errorService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-structure-industriesList.html',
        link: function (scope, elemn, attr) {
            scope.seeMore = function(less){
                if (less){
                    scope.isMore=false;
                    scope.limit=14;
                }else{
                    scope.isMore=true;
                    scope.limit=300;
                }
            }

            scope.addIndustry = function (displayValue) {
                var duplicate = false;
                if (displayValue) {

                    for (var i = 0; i < scope.organization.industries.length; i += 1) {
                        if (displayValue == scope.organization.industries[i]) {
                            errorModalService.setErrorModal('New Industry', 'The industry already exists.');
                            $('#errorModal').modal('show');
                            scope.newIndustry = '';
                            duplicate = true;
                        }
                    }

                    if (!duplicate) {
                        scope.organization.industries.push(displayValue);
                        var requestObj = {
                            event:   "updateOrganizationWideConfiguration",
                            payload: {
                                industries: scope.organization.industries,
                                solutionAreas: scope.organization.solutionAreas
                            }
                        }

                        requestManagerService.organizationsRequest(requestObj)
                            .then(function (response) {
                                if (errorService.validateUserResponse(response)) {
                                    scope.newIndustry = '';
                                    scope.organization.industries = response.payload.industries;
                                }
                            });
                    }

                }

            };

            scope.updateIndustry = function (index, newValue) {
                if (!newValue) {
                    scope.organization.industries.splice(index, 1);
                }
                else {
                    scope.organization.industries[index] = newValue;
                }
                var requestObj = {
                    event:   "updateOrganizationWideConfiguration",
                    payload: {
                        industries: scope.organization.industries,
                        solutionAreas: scope.organization.solutionAreas
                    }
                };

                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.organization.industries = response.payload.industries;
                        }
                    });
            }
        }
    };
});