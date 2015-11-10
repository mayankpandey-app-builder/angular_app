//ORDER DOES MATTER!!!!!!!!!!
requiredJS = [
    {
        path: "js/libs/bootstrap.min.js"
    },
    {
        path: "js/libs/angular.min.js"
    },
    {
        path: "js/libs/spin.min.js"
    },
    {
        path: "js/libs/angular-route.min.js" //this one s fetched in angular.min.js
    },
    {
        path: "js/libs/angular-cookies.min.js"
    },
    {
        path: "js/libs/base64.js" //this one s fetched in angular.min.js
    },
    {
        path: "js/libs/bootstrap-checkbox.js"
    },
    {
        path: "js/libs/angular-ui-tree.min.js"
    },
    {
        path: "js/libs/angular.treeview.min.js"
    },
    {
        path: "js/libs/lodash.min.js"
    }/*,
    {
        path: "js/libs/jquery.mCustomScrollbar.concat.min.js"
    }*/
]

/*
controllers = [
   {
        path: "js/controllers/userCtrl.js"
   } 
]

directives = [
    {
        path: "js/directives/AcceptDeclineBtnsCtrl.js"
    },
    {
         path: "js/directives/PersonsListCtrl.js"
    },
    {
         path: "js/directives/loginCtrl.js"
    },
    {
         path: "js/directives/menuDirectives.js"
    },
    {
         path: "js/directives/topMenu.js"
    }
]*/

services = [
    
]

function require(script) {
    $.ajax({
        url: script,
        dataType: "script",
        async: false,           // <-- Magic code line
        success: function () {
            // all good...
        },
        error: function () {
            throw new Error("Could not load script " + script);
        }
    });
}

function includeAllJS(){
    var i;
    for(i=0; i<requiredJS.length; i++){
        require(requiredJS[i].path);
    }
}


includeAllJS();