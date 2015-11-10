app.directive('basicLeadInfo', ['errorModalService', '$window','utilSrv', function (errorModalService, $window,utilSrv) {
    return {
        restrict:    'E',
        replace:     true,
        scope:       {
            'basicDetails': '='
        },
        templateUrl: 'html/pages/Lead/_basic-lead-info.html',
        link:        function (scope, elem, attr) {
            scope.$watch('basicDetails', function (newVal, oldVal) {
                if (scope.basicDetails) {
                    scope.namedAccount = (scope.basicDetails.namedAccount) ? 'Yes' : 'No';
                    scope.created = scope.basicDetails.createdSince;
                    scope.createdAgo = utilSrv.createdAgo(scope.created);
                }
            });

            scope.getFormattedAmountFunc = utilSrv.getFormattedAmountFunc;
        }
    };
}]);

app.directive('leadContacts', function (utilSrv) {
    return {
        restrict:    'E',
        replace:     true,
        scope:{
            'associatedContacts': '='
        },
        templateUrl: 'html/pages/Lead/_lead-contacts.html',
        link:        function (scope, elemn, attr) {
            scope.setImage = utilSrv.setImage;
            scope.$watch('associatedContacts', function(newVal, oldVal){});
        }
    };
});

app.directive('leadSharedWith', function (utilSrv) {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Lead/_lead-shared-with.html',
        scope: {
            'sharedWith': '='
        },
        link:        function (scope, elemn, attr) {
            scope.$watch('sharedWith', function (newVal, oldVal) {
                if (scope.sharedWith) {
                    scope.shareWithContacts = scope.sharedWith.sharedWith;
                    scope.ownerId = scope.sharedWith.ownerId;
                    scope.assigneeId = scope.sharedWith.assigneeId;
                }
            });
            scope.setImage = utilSrv.setImage;
        }
    };
});

app.directive('leadQualifier', function () {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Lead/_lead-pain.html',
        scope:       {
            qualifiers: '=',
            key: '@'
        },
        link:        function (scope, elemn, attr) {
            scope.$watch('qualifiers', function (newVal, oldVal) {
                if (scope.qualifiers && scope.key) {
                    scope.qualifierStatus = scope.qualifiers[scope.key].status;
                }
            });
            scope.$watch('key', function (newVal, oldVal) {
                scope.qualifierName = scope.key === 'timeframe' ? 'Time Frame' : scope.key.charAt(0).toUpperCase() + scope.key.slice(1);
            });
        }
    }
});

app.directive('leadQuicknotes', function () {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Lead/_lead-quicknotes.html',
        scope: {
            notes: '='
        },
        link:        function (scope, elemn, attr) {
            scope.$watch('notes', function (newVal, oldVal) {});
        }
    }
});

app.directive('leadRating', function () {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Lead/_lead-rating.html',
        scope: {
            'leadRating': '='
        },
        link:        function (scope, elemn, attr) {
            scope.$watch('leadRating', function (newVal, oldVal) {});
        }
    }
});

app.directive('leadStages', function () {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Lead/_lead-stages.html',
        scope: {
            'currentStage': '='
        },
        link:        function (scope, elemn, attr) {
            scope.$watch('currentStage', function (newVal, oldVal) {});

            scope.changeStageTo = scope.$parent.changeStageTo;
        }
    }
});

app.directive('solutionArea',  function () {
    return {
        restrict:    'E',
        replace:     true,
        scope:       {
            'areas': '='
        },
        templateUrl: 'html/pages/Lead/_solution-area.html',
        link:        function (scope, elem, attr) {
            scope.$watch('areas', function (newVal, oldVal) {
                if (scope.areas) {
                    solutionsFct(scope.areas);
                }
            });

            var solutionsFct = function(data){
                scope.solutions = [];
                scope.solutionsSelected = [];
                scope.solutionResults = data;

                angular.forEach(scope.solutionResults, function (solution) {
                    if (solution.selected) {
                        scope.solutionsSelected.push(solution.solutionName);
                    }
                    ;
                    scope.solutions.push(solution.solutionName);
                });
            }
        }
    };
});

app.directive('convertLead', function (errorModalService) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            'territories': '=',
            'onTerritorySelected': '='
        },
        templateUrl: 'html/pages/Lead/_lead-convert.html',
        link: function (scope, elem, attr) {
            scope.convertLeadToDeal = function () {
                var foundTerritory = _.find(scope.territories, function (territory) {
                    return territory.id === scope.territoryId;
                });
                if (foundTerritory) {
                    scope.onTerritorySelected(scope.territoryId);
                    scope.territoryId = null;
                }
                else {
                    errorModalService.setErrorModal('Oops!', 'Please select a territory first.');
                    $('#errorModal').modal('show');
                }
            }

            scope.selectTerritory = function (selectedTerritory) {
                _.forEach(scope.territories, function (territory) {
                    territory.isSelected = territory.id === selectedTerritory.id;
                });
                scope.territoryId = selectedTerritory.id;
            }
        }
    };
});