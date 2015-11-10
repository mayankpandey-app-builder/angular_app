app.directive('myModal', ['myModalService', function (myModalService) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            //'myModal':'='
        },
        templateUrl: 'html/templates/myModal.html',
        controller: function ($scope) {
            $scope.myModal = myModalService.getModalContent();
        }
    };
}]);


app.directive('errorModal', ['errorModalService', function (errorModalService) {//$rootScope) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            //'errorModal':'=' //this fucks up everything
        },
        templateUrl: 'html/templates/errorModal.html',
        controller: function ($scope) {
            $scope.errorModal = errorModalService.getErrorModal();
        }
    };
}]);

app.directive('exportModal', ['$filter','$window', 'exportModalService', 'myModalService', 'errorModalService', 'errorService', function ($filter,$window, exportModalService,myModalService, errorModalService, errorService) {//$rootScope) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            //'exportModal':'=' //this fucks up everything
        },
        templateUrl: 'html/templates/exportModal.html',
        controller: function ($scope) {
            $scope.showFilter = true;
            $scope.allowExport = false;
            $scope.savedFilter = false;
            $scope.showDelete = false;
            $scope.EMAIL_REGEXP = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            $scope.availableFields = exportModalService.getAvailableFields();
            $scope.fieldsToAdd = [];
            $scope.exportModal = exportModalService.getModalContent();


            $scope.editModal = function() {
                $scope.showFilter = false;
            };
            $scope.filterModal = function() {
                $scope.showFilter = true;
            };

            $scope.$watch('availableFields', function () {
                $scope.setScroller();
            });

            $scope.setScroller = function () {
                var scrollerWidth = 100 * $scope.availableFields.length;
                angular.element(".data-scoller").css("width", scrollerWidth);
            };

            $scope.removeField = function (id) {
                $scope.fieldsToAdd.push($scope.availableFields[id]);
                $scope.availableFields.splice(id,1);
                $scope.savedFilter = true;
                angular.element('#export-all').text('');
                $scope.show=true;
            };

            $scope.moveToAdded = function (field) {
                $scope.availableFields.push({'id': field.id, 'name': field.name, 'position': field.position});
                var idToSplice = 0;
                angular.forEach($scope.fieldsToAdd, function (a) {
                    if(angular.element(a)[0].id === field.id) {
                        $scope.fieldsToAdd.splice(idToSplice,1);
                    }
                    idToSplice++;
                });
                $scope.setScroller();
            };
            $scope.closeModal = function (){
                //$scope.availableFields='';
            };

             $scope.updateFilter = function (filter) {
                if(filter == ''){
                    $scope.availableFields = exportModalService.getAvailableFields();
                    $scope.available_for_all= false;
                     $scope.fieldsToAdd = [];
                    $scope.savedFilter = false;
                    $scope.filterName = '';
                    $scope.selectedFilter = '';
                    return ;
                }
                $scope.showDelete = true;
                $scope.dd = exportModalService.getFiltersdata();
                $scope.tempAvailable = exportModalService.getAvailableFields();

                angular.forEach($scope.dd, function (f){
                    if(f.id == filter){
                         $scope.filterName = f.export_setting_name;
                         $scope.selectedFilterId = f.id;
                         $scope.availableFields = f.fields;
                         $scope.available_for_all=f.available_for_all;
                    }
                });

                $scope.selectedFilter = filter;
                $scope.fieldsToAdd = [];

                angular.forEach($scope.availableFields, function (a) {
                    var idToSplice = 0;
                    angular.forEach($scope.tempAvailable, function (t) {
                        if(a.id === t.id){
                            $scope.tempAvailable.splice(idToSplice,1);
                        }
                        idToSplice++;
                    });
                });
                $scope.fieldsToAdd = $scope.tempAvailable;
                $scope.savedFilter = false;
                $scope.show=false;
            };

            $scope.createFileName = function (){
                var date = new Date();
               var curDate = $filter('date')(new Date(), 'yyyy-MM-dd');
                var fname = 'iseeit-contact-'+curDate+'.csv';
                return fname;
            };

            $scope.exportContacts = function () {
                var data = {'download': false, 'email': ''}, aFilter = [];
                angular.forEach($scope.availableFields, function (a){
                    aFilter.push(a.id);
                });
                data.exportfilter=aFilter;
                if (!$scope.download && !$scope.emailChk) {
                    angular.element('.errorExport').removeClass('hide');
                    return false;
                }

                if ($scope.emailChk) {
                    data.email= $scope.email;
                }

                if($scope.emailChk && data.email==""){
                    return $scope.addError('#email');
                } else {
                    $scope.removeError('#email');
                }

                if (!$scope.EMAIL_REGEXP.test($scope.email) && data.email!="") {
                    return $scope.addError('#email');
                }
                if ($scope.download) {
                    data.download= $scope.download;
                }
                exportModalService.exportContacts(data)
                .then(function (response) {
                    //if (errorService.validateUserResponse(response)) {
                        if($scope.download){
                                var msg = 'CSV file has been created and downloaded to your system. Please check your Download location.'
                        }
                        if($scope.emailChk){
                                var msg = 'Export has been sent to via email. Please check your inbox.'
                        }

                        $('#exportModal').modal('hide');

                        errorModalService.setErrorModal('', msg);
                        $('#errorModal').modal('show');

                        if(data.download) {
                           var fname= $scope.createFileName();
                            var element = angular.element('<a/>');
                             element.attr({
                                 href: 'data:attachment/csv;charset=utf-8,' + encodeURI(atob(response.payload)),
                                 target: '_blank',
                                 download: fname
                             })[0].click();
                        }
                    //}
                });
            };

            $scope.deleteExport = function (){
                var deleteRecord = $window.confirm('Are you absolutely sure you want to delete?');

                if(deleteRecord){
                    var data = {id: $scope.selectedFilter};
                    exportModalService.deleteExportSetting(data)
                    .then(function (response) {

                            exportModalService.getFilters()
                            .then(function (response){
                                var idToSplice = 0;
                                angular.forEach($scope.$root.contactExportFilters, function (t) {
                                    if($scope.selectedFilter === t.id){
                                        $scope.$root.contactExportFilters.splice(idToSplice,1);
                                    }
                                    idToSplice++;
                                });

                                $scope.updateFilter('');
                            });
                     });
                    }
            };

            $scope.saveFilter = function () {
                if (!$scope.filterName) {
                    return $scope.addError('#filterName');
                }
                if ($scope.availableFields.length <=0) {
                    errorModalService.setErrorModal('', "There should be atleat one field selected to save filter");
                    $('#errorModal').modal('show');
                    return false;
                }

                if ($scope.savedFilter) {

                    var data = {}, aFilter = [];
                    angular.forEach($scope.availableFields, function (a){
                    aFilter.push(a.id);
                     });
                    data.exportfilter=aFilter;
                    data.Set_id=$scope.selectedFilter;

                    data.filterName=$scope.filterName;
                    data.available_for_all=$scope.available_for_all;
                    exportModalService.saveFilterSettings(data)
                     .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            $scope.$root.contactExportFilters.push(response.payload);
                            $scope.updateFilter(response.payload.id);
                        }
                });

                }
            };

            $scope.addError = function (el) {
                angular.element(el).addClass('error');
                angular.element(el).focus();
                return false;
            };

            $scope.removeError = function (el) {
                angular.element(el).removeClass('error');
            };

            $scope.$watch('emailChk', function () {
                if (!$scope.download) {
                    angular.element('.errorExport').addClass('hide');
                }

            });

            $scope.$watch('download', function () {
                if (!$scope.emailChk) {
                    angular.element('.errorExport').addClass('hide');
                }
            });
        }
    };
}]);