/**
 * Created by claudia on 28.05.2014.
 */
app.directive('listItems', ['utilSrv','$location', function (utilSrv,$location) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            'items': "=",
            'items2': "="
        },
        templateUrl: 'html/templates/_list-items.html',
        link: function (scope, elemn, attr) {
                scope.goTo = function (entityName, entityId, itemType) {
                    var taskType = ['call', 'email', 'followup', 'todo', 'channel', 'nbm', 'newcontact', 'facetoface', 'internal'];
                    if (taskType.indexOf(entityName) !== -1) {
                        entityName = 'task';
                    }
                    else{
                        entityName = itemType;
                    }
                    if (entityName === 'task'){
                        scope.$parent.goToTaskDetails(entityId);
                    }else{
                        $location.path(entityName + 's/' + entityId);
                    }
                }

                scope.$watch('items', function(newVal,oldVal){});
                scope.$watch('items2', function(newVal,oldVal){});

                switch(attr.type){
                    case "plannedActivities":
                        scope.listHeight = "double";
                        scope.title  = "Planned Activities";
                        scope.name = "name";
                        break;

                    case "leadsDeals":
                        scope.listHeight = "";
                        scope.title  = "Leads & Deals";
                        scope.name = "leadName";
                        scope.name2 = "dealName";
                        scope.itemType = "lead";
                        scope.itemType2 = "deal";
                        break;

                    case "doneTasks":
                        scope.listHeight = "";
                        scope.title  = "Completed Tasks";
                        scope.name = "name";
                        break;

                    case "tasks":
                        scope.listHeight = "double";
                        scope.title  = "Tasks";
                        scope.name = "name";
                        break;
                }
        }
    };
}]);