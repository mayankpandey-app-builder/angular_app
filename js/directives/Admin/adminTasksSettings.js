app.directive('defaultTags', function (requestManagerService,errorService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-tasks-tags.html',
        link: function (scope, elemn, attr) {

            scope.getTasksConfig= function(){
                var requestObj = {
                    event: "organizationTaskConfiguration",
                    payload: {}
                }
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.tags = response.payload.defaultTagNames;
                            scope.progressStages = response.payload.progressStages;
                        }
                    });
            };

            var doRequest = function () {
                var requestObj = {
                    event: "updateOrganizationTaskConfiguration",
                    payload: {
                        tagNames: scope.tags,
                        progressStages: scope.progressStages
                    }
                };
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.tags = response.payload.tagNames;
                            scope.newTag='';
                        }
                    });
            }

            scope.addTag = function (displayValue) {
                if (displayValue){
                    scope.tags.push(displayValue);
                    doRequest();
                }
            };
            scope.updateTag = function (index, tag) {
                console.log(index, tag)
                if (!tag) {
                    scope.tags.splice(index, 1);
                }
                else {
                    scope.tags[index] = tag;
                }
                doRequest();
            };
        }
    };
});

app.directive('progressStages', function (requestManagerService, errorService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-tasks-stages.html',
        link: function (scope, elemn, attr) {
            scope.getTasksConfig= function(){
                var requestObj = {
                    event: "organizationTaskConfiguration",
                    payload: {}
                }
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.tags = response.payload.defaultTagNames;
                            scope.progressStages = response.payload.progressStages;
                        }
                    });
            };

            var doRequest = function () {
                var requestObj = {
                    event: "updateOrganizationTaskConfiguration",
                    payload: {
                        tagNames: scope.tags,
                        progressStages: scope.progressStages
                    }
                };
                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.progressStages = response.payload.progressStages;
                            scope.newStage = '';
                        }
                    });
            }

            scope.addProgressStage = function (progressStage) {
                if (!progressStage) {
                    return;
                }
                scope.progressStages.push(progressStage);
                doRequest();
            }

            scope.updateStage = function (index, progressStageName) {
                if (!progressStageName) {
                    scope.progressStages.splice(index, 1);
                }
                else {
                    scope.progressStages[index] = progressStageName;
                }
                doRequest();
            }


        }
    };
});