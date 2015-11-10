app.directive('leadInfo', function ($window,utilSrv) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Lead/_lead-info.html',
        link: function (scope, elemn, attr) {
            scope.lead.imageURL = scope.lead.company.imageURL || 'images/placeholder_lead_photo.png';
            scope.lead.fullName = scope.lead.contact.firstName+ " "+ scope.lead.contact.lastName;
            scope.hasPhone= scope.lead.contact.hasPhoneNumber || scope.lead.company.hasPhoneNumber;
            scope.hasEmail= scope.lead.contact.hasEmailAddress || scope.lead.company.hasEmailAddress;
            scope.isOwner= scope.lead.ownerId === localStorage['id'];

            if (localStorage.id === scope.lead.assigneeId){
                scope.barColor= 'orange';
            }else{
                scope.barColor= '';
            }
            //used for bant color
            if (scope.lead.bantScore == 0){
                    scope.bantColor="grey";
            }else if (scope.lead.bantScore > 0 && scope.lead.bantScore < 11 )
                { scope.bantColor="orange";
                    } else if (scope.lead.bantScore > 10 && scope.lead.bantScore < 21)
                    { scope.bantColor="yellow"; }
                        else {  scope.bantColor="green"; }

            //used for time ago
            scope.createdAgo = utilSrv.createdAgo(scope.lead.createdSince);

        }
    };
});

app.directive('leadNav', function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'html/pages/Lead/_lead-nav-tabs.html',
        link: function (scope, elemn, attr) {

            scope.$on("LEADS_STATISTICS", function (event, data) {
                scope.coldLeads = data.coldLeads;
                scope.hotLeads  = data.hotLeads;
                scope.convertedLeads  = data.convertedLeads;
                scope.justCreatedLeads  = data.justCreatedLeads;
                scope.totalLeads  = data.totalLeads;
                scope.trashLeads  = data.trashLeads;
                scope.unseenLeads  = data.unseenLeads;
                scope.warmLeads  = data.warmLeads;
                scope.open = data.warmLeads + data.justCreatedLeads  + data.hotLeads;
                scope.nostatus = data.justCreatedLeads;

            });

            scope.selectTab = function(tab){
                switch (tab){
                    case 'open':
                        scope.getLeadsList("Open"); break;
                    case 'hot':
                        scope.getLeadsList("Hot"); break;
                    case 'warm':
                        scope.getLeadsList("Warm"); break;
                    case 'cold':
                        scope.getLeadsList("Cold"); break;
                    case 'trash':
                        scope.getLeadsList("Trash"); break;
                    case 'nostatus':
                        scope.getLeadsList("justCreated"); break;
                    case 'converted':
                        scope.getLeadsList("Converted"); break;
                    default:
                        scope.getLeadsList(); break;
                }

            }
        }
    };
});