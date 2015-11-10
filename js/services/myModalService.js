app.factory('myModalService', function () {

    return {
        myModal: {title: "*", info: "***"},
        setModalContent: function (title, info, decline, accept, analyticsAction, analyticsContext) {
            this.myModal.title = title;
            this.myModal.info = info;
            this.myModal.decline = decline;
            this.myModal.accept = accept;
            this.myModal.analyticsAction = analyticsAction;
            this.myModal.analyticsContext = analyticsContext;
        },
        getModalContent: function () {
            return this.myModal;
        },
        setModalDeclineAction: function (functParam) {
            this.myModal.declineAction = functParam;
        },
        setModalAcceptAction: function (functParam) {
            this.myModal.acceptAction = functParam;
        }
    }
})