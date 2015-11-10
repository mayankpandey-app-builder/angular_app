app.factory('errorModalService', function () {

    return {
        errorModal: {title: "Oops!", info: "Something went wrong."},
        setErrorModal: function (title, info) {
            this.errorModal.title = title;
            this.errorModal.info = info;
        },
        getErrorModal: function () {
            return this.errorModal;
        }
    }
})