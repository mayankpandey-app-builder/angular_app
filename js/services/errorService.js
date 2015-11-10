app.factory('errorService', ['errorModalService', '$location','$cookieStore', function (errorModalService,$location,$cookieStore) {
    return {
        validateUserResponse: function (response) {
//            var msg = response.status.message;
//            msg = msg.split(/(?=[A-Z])/).join(" ");
//            msg = msg.toLowerCase();
//            msg = msg[0].toUpperCase() + msg.substring(1) + '!';
            //var msg=response.status.displayMessage;

            if (response.status.code == 0) {
                return true;
            }
            else {
                if(response.domain !== 'identity' && response.status.code === 10){
                    errorModalService.setErrorModal('Oops!', msg);
                    $('#errorModal').modal('show');
                    $location.path('/');
                    localStorage.removeItem('authenticated');
                    localStorage.removeItem('aux');
                    localStorage.removeItem('auth');
                    localStorage.removeItem('user');
                    localStorage.removeItem('id');
                    localStorage.removeItem('nextStep');
                    localStorage.removeItem('isAdmin');
                    localStorage.removeItem('profileImage');
                    $cookieStore.remove('auth');
                }else{
                errorModalService.setErrorModal('Oops!', msg);
                $('#errorModal').modal('show');
                return false;
                }
            }
        }
    }

}])