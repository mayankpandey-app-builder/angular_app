/**
 * Created by bogdan on 9/15/14.
 */
/**
 * Created by bogdan on 9/12/14.
 */
window.addEventListener("load", setSizes);
window.addEventListener("resize", setResize);

function setSizes(){
    var clientWHeight = $(window).height();
    var clientHeight = clientWHeight - 65;
//    alert(clientHeight);
    var mainLeftStyle = {
        height : clientHeight + 'px',
        minHeight: '475px'
    };
    var asideStyle = {
        height : clientHeight - 10 + 'px',
        minHeight: '500px'
    };
    var sbStyle = {
        height : clientHeight-75 + 'px'
    };

    var tsStyle = {
        height : clientHeight-117 + 'px',
        minHeight: '500px',
        overflow: 'auto'
    };
    var llStyle = {
        height : clientHeight-135 + 'px',
        minHeight: '475px',
        overflow: 'auto'
    };

    var pmsbStyle = {
        height : clientHeight-280 + 'px',
        overflow: 'auto'
    };

    var tplStyle = {
        height : clientHeight-290 + 'px',
        overflow: 'auto'
    };

    var tplImportStyle = {
        height : clientHeight-350 + 'px',
        overflow: 'auto'
    };

    var dashboardStyle = {
        height : clientHeight-130 + 'px',
        minHeight:'430px'
    };

    var dashboardResetStyle = {
        height : '430px'
    };

    $('.main-left').css(mainLeftStyle);
    $('aside.right').css(asideStyle);
    $('.scroll-box').css(sbStyle);

    $('#task-scheduler').css(tsStyle);
    $('#list-view').css(sbStyle);
    $('#leads-list').css(llStyle);
    $('#deal-view-scroll').css(pmsbStyle);
    $('#probable-scroll').css(pmsbStyle);
    $('.tplPerson').css(tplStyle);
    $('.import-vcard').css(tplImportStyle);
//    $('#deal-sheet').css(llStyle);
    $('#deal-timeline').css(llStyle);
    if(clientHeight>760){
        $('.subset-tasks').css(dashboardStyle);
        $('.subset-deals').css(dashboardStyle);
        $('.tasks-box').css(dashboardStyle);
        $('.deals-box').css(dashboardStyle);
    }else{
        $('.subset-tasks').css(dashboardResetStyle);
        $('.subset-deals').css(dashboardResetStyle);
        $('.tasks-box').css(dashboardResetStyle);
        $('.deals-box').css(dashboardResetStyle);
    }

}

function setResize(){

    var clientWHeight = $(window).height();
    var clientHeight = clientWHeight - 50;
//    alert(clientHeight);
    var mainLeftStyle = {
        height : clientHeight + 'px',
        minHeight: '475px'
    };
    var asideStyle = {
        height : clientHeight - 10 + 'px',
        minHeight: '500px'
    };
    var sbStyle = {
        height : clientHeight-90 + 'px'
    };

    var tsStyle = {
        height : clientHeight-117 + 'px',
        minHeight: '500px',
        overflow: 'auto'
    };
    var llStyle = {
        height : clientHeight-135 + 'px',
        minHeight: '475px',
        overflow: 'auto'
    };

    var pmsbStyle = {
        height : clientHeight-280 + 'px',
        overflow: 'auto'
    };

    var tplStyle = {
        height : clientHeight-290 + 'px',
        overflow: 'auto'
    };

    var tplImportStyle = {
        height : clientHeight-350 + 'px',
        overflow: 'auto'
    };

    var dashboardStyle = {
        height : clientHeight-130 + 'px',
        minHeight:'430px'
    };

    var dashboardResetStyle = {
        height : '430px'
    };

    $('.main-left').css(mainLeftStyle);
    $('aside.right').css(asideStyle);
    $('.scroll-box').css(sbStyle);

    $('#task-scheduler').css(tsStyle);
    $('#list-view').css(sbStyle);
    $('#leads-list').css(llStyle);
    $('#deal-view-scroll').css(pmsbStyle);
    $('#probable-scroll').css(pmsbStyle);
    $('.tplPerson').css(tplStyle);
    $('.import-vcard').css(tplImportStyle);
//    $('#deal-sheet').css(llStyle);
    $('#deal-timeline').css(llStyle);
    if(clientHeight>760){
        $('.subset-tasks').css(dashboardStyle);
        $('.subset-deals').css(dashboardStyle);
        $('.tasks-box').css(dashboardStyle);
        $('.deals-box').css(dashboardStyle);
    }else{
        $('.subset-tasks').css(dashboardResetStyle);
        $('.subset-deals').css(dashboardResetStyle);
        $('.tasks-box').css(dashboardResetStyle);
        $('.deals-box').css(dashboardResetStyle);
    }

}