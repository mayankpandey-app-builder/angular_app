/**
 * Created by bogdan on 5/20/14.
 */
app.directive('companyInfo', function (utilSrv) {
    return {
        restrict:    'E',
        replace:     true,
        templateUrl: 'html/pages/Company/_company-info.html',
        link:        function (scope, elemn, attr) {

            if (scope.company.numberOfContacts == 1) {
                scope.contactText = "Contact";

            } else {
                scope.contactText = "Contacts";
            }

            scope.budget = utilSrv.getFormattedAmount(scope.company.revenue.amount);
        }
    };
});