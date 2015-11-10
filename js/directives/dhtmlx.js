app.directive('dhxScheduler', function(requestManagerService,errorService) {
    return {
        restrict: 'A',
        scope: false,
        transclude: true,
        template:'<div class="dhx_cal_navline" ng-transclude></div><div class="dhx_cal_header"></div><div class="dhx_cal_data"></div>',

        link:function ($scope, $element, $attrs){

            //default state of the scheduler
            if (!$scope.scheduler) $scope.scheduler = {};
            $scope.scheduler.mode = localStorage['calendarView'] || "day";
            if(localStorage['calendarView'] === 'day'){
                $scope.showStartingDay=false;
            }else{
                $scope.showStartingDay=true;
            }
            $scope.scheduler.date = $scope.scheduler.date || new Date();
            scheduler.config.scroll_hour = 8;
            scheduler.config.preserve_scroll = false;
            scheduler.config.quick_info_detached = false;
            scheduler.config.full_day = true;
            scheduler.config.start_on_monday= parseInt(localStorage['monday']);
            if(scheduler.config.start_on_monday){
                $scope.startWeek= 'monday';
            }else{
                $scope.startWeek= 'sunday';
            }


            scheduler.attachEvent("onClick", function (id,$event) {
                if (angular.element($event.target).parent().hasClass('selected')){
                    angular.element($event.target).parent().removeClass('selected');
                    $scope.taskSelectTab('filters');
                    $scope.$apply();
                }else{
                    angular.element('.dhx_cal_event_line').removeClass('selected');
                    angular.element('.dhx_cal_event').removeClass('selected');
//                    angular.element($event.target).parent().addClass('selected');
                    $scope.openTaskDetails(id);
                    $scope.$apply();
                }
            });

            scheduler.attachEvent("onDblClick", function (id, e){
            });

            scheduler.attachEvent("onEventChanged", function(id,ev){
                var model = {
                    name : ev.task.name,
                    location: ev.task.location,
                    allDay: ev.task.allDay,
                    start: ev.start_date.getTime(),
                    duration: ev.end_date.getTime() - ev.start_date.getTime()
                }
                $scope.updateBasicTaskDetails(id,model);

            });

            //watch data collection, reload on changes
            $scope.$watch($attrs.data, function(collection){
                scheduler.clearAll();
                scheduler.parse(collection, "json");
            }, true);

            $scope.goToDateFct = function(newDate){
                scheduler.setCurrentView(newDate.getTime(), 'day');

            }

            //watch mode and date
            $scope.$watch(function(){
                return $scope.scheduler.mode + $scope.scheduler.date.toString();
            }, function(nv, ov) {
                var mode = scheduler.getState();
                if (nv.date != mode.date || nv.mode != mode.mode)
                    scheduler.setCurrentView($scope.scheduler.date, $scope.scheduler.mode);
            }, true);

            //size of scheduler
            $scope.$watch(function() {
                return $element[0].offsetWidth + "." + $element[0].offsetHeight;
            }, function() {
                scheduler.setCurrentView();
            });


            $scope.setCalendarView = function(type){
                localStorage['calendarView'] = type;
                $scope.scheduler.mode = localStorage['calendarView'];

            }

            //styling for dhtmlx scheduler
            $element.addClass("dhx_cal_container");

            $scope.setWeekStartingDay = function(day){
                var schedulerState = scheduler.getState();
                if(day==='sunday'){
                    scheduler.config.start_on_monday = false;
                    localStorage['monday'] = 0;
                    $scope.startWeek= 'sunday';
                }else{
                    scheduler.config.start_on_monday = true;
                    localStorage['monday'] = 1;
                    $scope.startWeek= 'monday';
                }
                scheduler.setCurrentView($scope.scheduler.date, schedulerState.mode);
            }

            $scope.updateBasicTaskDetails = function (id,model){
                var requestObj = {
                    event: "updateBasicDetails",
                    payload: {
                        taskId: id,
                        basicDetails:model
                    }
                };

                if(model.name.length>0){
                    requestManagerService.tasksRequest(requestObj)
                        .then(function (response) {
                            if (errorService.validateUserResponse(response)) {
                               $scope.$broadcast('TASK_DATE_UPDATE', response.payload.basicDetails);
                            }
                        });
                }

            }

            $scope.updateEventCalendar = function(id){
                scheduler.updateEvent(id);
            }

            //init scheduler
            scheduler.init($element[0], $scope.scheduler.date, $scope.scheduler.mode);
        }
    }
});

app.directive('dhxTemplate', ['$filter', function($filter){
    scheduler.aFilter = $filter;

    return {
        restrict: 'AE',
        terminal:true,

        link:function($scope, $element, $attrs, $controller){
            $element[0].style.display = 'none';

            var template = $element[0].innerHTML;
            template = template.replace(/[\r\n]/g,"").replace(/"/g, "\\\"").replace(/\{\{event\.([^\}]+)\}\}/g, function(match, prop){
                if (prop.indexOf("|") != -1){
                    var parts = prop.split("|");
                    return "\"+scheduler.aFilter('"+(parts[1]).trim()+"')(event."+(parts[0]).trim()+")+\"";
                }
                return '"+event.'+prop+'+"';
            });
            var templateFunc = Function('sd','ed','event', 'return "'+template+'"');
            scheduler.templates[$attrs.dhxTemplate] = templateFunc;
        }
    };
}]);