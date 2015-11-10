app.directive('financialData', function (myModalService, requestManagerService, errorService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-financial-data.html',
        link: function (scope, elemn, attr) {

            scope.getFinancialConfig = function () {
                var requestObj = {
                    event: 'organizationFinancialDataConfiguration',
                    payload: {}
                };

                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.financial = response.payload;
                            scope.financial.displayValueForRateUsedForForecast = scope.financial.rateUsedForForecast === 'realTime' ? 'Automatic (daily)' : 'Fixed';
                        }
                    });
            }

            scope.validateSelection = function(invalid){
                if (invalid){
                    return true;
                }else{
                    return false;
                }
            }

            scope.changeCurrency = function(item){
                myModalService.setModalContent('Default currency', 'Are you sure you want to change the default currency? Doing this will reset the fixed exchange rates.', 'Cancel', 'Change');
                $('#myModal').modal('show');
                myModalService.setModalAcceptAction(scope.updateFinancialConfig);
            }

            scope.financial = [];
            scope.selectExchangeRate = function(item){
                scope.financial.rateUsedForForecast = item;
                scope.updateFinancialConfig();
            }

            scope.updateFinancialConfig = function () {
                $('#myModal').modal('hide');
                var requestObj = {
                    event: 'updateOrganizationFinancialDataConfiguration',
                    payload: scope.financial
                };

                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.financial = response.payload;
                            scope.financial.displayValueForRateUsedForForecast = scope.financial.rateUsedForForecast === 'realTime' ? 'Automatic (daily)' : 'Fixed';
                        }
                    });
            }

            scope.addNewCurrency = function (newCurrency) {
                scope.financial.currencies.push(newCurrency);
                scope.updateFinancialConfig();
            }

            scope.removeCurrency = function (currencyIndex) {
                scope.financial.currencies.splice(currencyIndex, 1);
                scope.updateFinancialConfig();
            }
        }
    };
});

app.directive('financialCards', function (requestManagerService, errorService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Admin/detailsSection/_admin-financial-cards.html',
        link: function (scope, elemn, attr) {

            scope.months=["January","February","March","April","May","June","July","August","September","October","November","December"];
            scope.weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            scope.days = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31'];
            scope.hours=['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
            scope.minutes=['00','05','10','15','20','25','30','35','40','45','50','55'];

            scope.getFinancialConfig = function () {
                var requestObj = {
                    event: 'organizationFinancialDataConfiguration',
                    payload: {}
                };

                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.financial = response.payload;
                            scope.financial.displayValueForRateUsedForForecast = scope.financial.rateUsedForForecast === 'realTime' ? 'Automatic (daily)' : 'Fixed';
                            scope.month = scope.months[parseFloat(scope.financial.financialYearMonthStart) - 1];
                            scope.weekday = scope.weekdays[scope.financial.dealsWeeklyForecastSnapshot.weekday];
                            scope.hour = scope.financial.dealsWeeklyForecastSnapshot.hour;
                            scope.minute = scope.financial.dealsWeeklyForecastSnapshot.minute;
                        }
                    });
            }

            scope.selectFinancial= function(item, value){
                switch(item){
                    case 'month': scope.financial.financialYearMonthStart = value + 1;
                        scope.updateFinancialConfiguration();
                        break;
                    case 'weekday': scope.financial.dealsWeeklyForecastSnapshot.weekday = value;
                        scope.updateFinancialConfiguration();
                        break;
                    case 'hour':  scope.financial.dealsWeeklyForecastSnapshot.hour = value;
                        scope.updateFinancialConfiguration();
                        break;
                    case 'minute': scope.financial.dealsWeeklyForecastSnapshot.minute = value;
                        scope.updateFinancialConfiguration();
                        break;
                    default: break;
                }

            };

            scope.updateFinancialConfiguration = function () {
                var requestObj = {
                    event: 'updateOrganizationFinancialDataConfiguration',
                    payload: scope.financial
                };

                requestManagerService.organizationsRequest(requestObj)
                    .then(function (response) {
                        if (errorService.validateUserResponse(response)) {
                            scope.financial = response.payload;
                            scope.financial.displayValueForRateUsedForForecast = scope.financial.rateUsedForForecast === 'realTime' ? 'Automatic (daily)' : 'Fixed';
                            scope.month = scope.months[parseFloat(scope.financial.financialYearMonthStart) - 1];
                            scope.weekday = scope.weekdays[scope.financial.dealsWeeklyForecastSnapshot.weekday];
                            scope.hour = scope.financial.dealsWeeklyForecastSnapshot.hour;
                            scope.minute = scope.financial.dealsWeeklyForecastSnapshot.minute;
                        }
                    });
            }
        }
    };
});