/*
 This software is allowed to use under GPL or you need to obtain Commercial or Enterise License
 to use it in non-GPL project. Please contact sales@dhtmlx.com for details
 */

if (!window.dhtmlx) {
    dhtmlx = function(obj){
        for (var a in obj) dhtmlx[a]=obj[a];
        return dhtmlx; //simple singleton
    };
}
dhtmlx.extend_api=function(name,map,ext){
    var t = window[name];
    if (!t) return; //component not defined
    window[name]=function(obj){
        if (obj && typeof obj == "object" && !obj.tagName){
            var that = t.apply(this,(map._init?map._init(obj):arguments));
            //global settings
            for (var a in dhtmlx)
                if (map[a]) this[map[a]](dhtmlx[a]);
            //local settings
            for (var a in obj){
                if (map[a]) this[map[a]](obj[a]);
                else if (a.indexOf("on")==0){
                    this.attachEvent(a,obj[a]);
                }
            }
        } else
            var that = t.apply(this,arguments);
        if (map._patch) map._patch(this);
        return that||this;
    };
    window[name].prototype=t.prototype;
    if (ext)
        dhtmlXHeir(window[name].prototype,ext);
};

dhtmlxAjax={
    get:function(url,callback){
        var t=new dtmlXMLLoaderObject(true);
        t.async=(arguments.length<3);
        t.waitCall=callback;
        t.loadXML(url)
        return t;
    },
    post:function(url,post,callback){
        var t=new dtmlXMLLoaderObject(true);
        t.async=(arguments.length<4);
        t.waitCall=callback;
        t.loadXML(url,true,post)
        return t;
    },
    getSync:function(url){
        return this.get(url,null,true)
    },
    postSync:function(url,post){
        return this.post(url,post,null,true);
    }
}

/**
 *     @desc: xmlLoader object
 *     @type: private
 *     @param: funcObject - xml parser function
 *     @param: object - jsControl object
 *     @param: async - sync/async mode (async by default)
 *     @param: rSeed - enable/disable random seed ( prevent IE caching)
 *     @topic: 0
 */
function dtmlXMLLoaderObject(funcObject, dhtmlObject, async, rSeed){
    this.xmlDoc="";

    if (typeof (async) != "undefined")
        this.async=async;
    else
        this.async=true;

    this.onloadAction=funcObject||null;
    this.mainObject=dhtmlObject||null;
    this.waitCall=null;
    this.rSeed=rSeed||false;
    return this;
};

dtmlXMLLoaderObject.count = 0;

/**
 *     @desc: xml loading handler
 *     @type: private
 *     @param: dtmlObject - xmlLoader object
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.waitLoadFunction=function(dhtmlObject){
    var once = true;
    this.check=function (){
        if ((dhtmlObject)&&(dhtmlObject.onloadAction != null)){
            if ((!dhtmlObject.xmlDoc.readyState)||(dhtmlObject.xmlDoc.readyState == 4)){
                if (!once)
                    return;

                once=false; //IE 5 fix
                dtmlXMLLoaderObject.count++;
                if (typeof dhtmlObject.onloadAction == "function")
                    dhtmlObject.onloadAction(dhtmlObject.mainObject, null, null, null, dhtmlObject);

                if (dhtmlObject.waitCall){
                    dhtmlObject.waitCall.call(this,dhtmlObject);
                    dhtmlObject.waitCall=null;
                }
            }
        }
    };
    return this.check;
};

/**
 *     @desc: return XML top node
 *     @param: tagName - top XML node tag name (not used in IE, required for Safari and Mozilla)
 *     @type: private
 *     @returns: top XML node
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.getXMLTopNode=function(tagName, oldObj){
    if (this.xmlDoc.responseXML){
        var temp = this.xmlDoc.responseXML.getElementsByTagName(tagName);
        if(temp.length==0 && tagName.indexOf(":")!=-1)
            var temp = this.xmlDoc.responseXML.getElementsByTagName((tagName.split(":"))[1]);
        var z = temp[0];
    } else
        var z = this.xmlDoc.documentElement;

    if (z){
        this._retry=false;
        return z;
    }

    if (!this._retry){
        this._retry=true;
        var oldObj = this.xmlDoc;
        this.loadXMLString(this.xmlDoc.responseText.replace(/^[\s]+/,""), true);
        return this.getXMLTopNode(tagName, oldObj);
    }

    dhtmlxError.throwError("LoadXML", "Incorrect XML", [
        (oldObj||this.xmlDoc),
        this.mainObject
    ]);

    return document.createElement("DIV");
};

/**
 *     @desc: load XML from string
 *     @type: private
 *     @param: xmlString - xml string
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.loadXMLString=function(xmlString, silent){

    if (!_isIE){
        var parser = new DOMParser();
        this.xmlDoc=parser.parseFromString(xmlString, "text/xml");
    } else {
        this.xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
        this.xmlDoc.async=this.async;
        this.xmlDoc.onreadystatechange = function(){};
        this.xmlDoc["loadXM"+"L"](xmlString);
    }

    if (silent)
        return;

    if (this.onloadAction)
        this.onloadAction(this.mainObject, null, null, null, this);

    if (this.waitCall){
        this.waitCall();
        this.waitCall=null;
    }
}
/**
 *     @desc: load XML
 *     @type: private
 *     @param: filePath - xml file path
 *     @param: postMode - send POST request
 *     @param: postVars - list of vars for post request
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.loadXML=function(filePath, postMode, postVars, rpc){
    if (this.rSeed)
        filePath+=((filePath.indexOf("?") != -1) ? "&" : "?")+"a_dhx_rSeed="+(new Date()).valueOf();
    this.filePath=filePath;

    if ((!_isIE)&&(window.XMLHttpRequest))
        this.xmlDoc=new XMLHttpRequest();
    else {
        this.xmlDoc=new ActiveXObject("Microsoft.XMLHTTP");
    }

    if (this.async)
        this.xmlDoc.onreadystatechange=new this.waitLoadFunction(this);
    this.xmlDoc.open(postMode ? "POST" : "GET", filePath, this.async);

    if (rpc){
        this.xmlDoc.setRequestHeader("User-Agent", "dhtmlxRPC v0.1 ("+navigator.userAgent+")");
        this.xmlDoc.setRequestHeader("Content-type", "text/xml");
    }

    else if (postMode)
        this.xmlDoc.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    this.xmlDoc.setRequestHeader("X-Requested-With","XMLHttpRequest");
    this.xmlDoc.send(null||postVars);

    if (!this.async)
        (new this.waitLoadFunction(this))();
};
/**
 *     @desc: destructor, cleans used memory
 *     @type: private
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.destructor=function(){
    this._filterXPath = null;
    this._getAllNamedChilds = null;
    this._retry = null;
    this.async = null;
    this.rSeed = null;
    this.filePath = null;
    this.onloadAction = null;
    this.mainObject = null;
    this.xmlDoc = null;
    this.doXPath = null;
    this.doXPathOpera = null;
    this.doXSLTransToObject = null;
    this.doXSLTransToString = null;
    this.loadXML = null;
    this.loadXMLString = null;
    // this.waitLoadFunction = null;
    this.doSerialization = null;
    this.xmlNodeToJSON = null;
    this.getXMLTopNode = null;
    this.setXSLParamValue = null;
    return null;
}

dtmlXMLLoaderObject.prototype.xmlNodeToJSON = function(node){
    var t={};
    for (var i=0; i<node.attributes.length; i++)
        t[node.attributes[i].name]=node.attributes[i].value;
    t["_tagvalue"]=node.firstChild?node.firstChild.nodeValue:"";
    for (var i=0; i<node.childNodes.length; i++){
        var name=node.childNodes[i].tagName;
        if (name){
            if (!t[name]) t[name]=[];
            t[name].push(this.xmlNodeToJSON(node.childNodes[i]));
        }
    }
    return t;
}

/**
 *     @desc: Call wrapper
 *     @type: private
 *     @param: funcObject - action handler
 *     @param: dhtmlObject - user data
 *     @returns: function handler
 *     @topic: 0
 */
function callerFunction(funcObject, dhtmlObject){
    this.handler=function(e){
        if (!e)
            e=window.event;
        funcObject(e, dhtmlObject);
        return true;
    };
    return this.handler;
};

/**
 *     @desc: Calculate absolute position of html object
 *     @type: private
 *     @param: htmlObject - html object
 *     @topic: 0
 */
function getAbsoluteLeft(htmlObject){
    return getOffset(htmlObject).left;
}
/**
 *     @desc: Calculate absolute position of html object
 *     @type: private
 *     @param: htmlObject - html object
 *     @topic: 0
 */
function getAbsoluteTop(htmlObject){
    return getOffset(htmlObject).top;
}

function getOffsetSum(elem) {
    var top=0, left=0;
    while(elem) {
        top = top + parseInt(elem.offsetTop);
        left = left + parseInt(elem.offsetLeft);
        elem = elem.offsetParent;
    }
    return {top: top, left: left};
}
function getOffsetRect(elem) {
    var box = elem.getBoundingClientRect();
    var body = document.body;
    var docElem = document.documentElement;
    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;
    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;
    return { top: Math.round(top), left: Math.round(left) };
}
function getOffset(elem) {
    if (elem.getBoundingClientRect) {
        return getOffsetRect(elem);
    } else {
        return getOffsetSum(elem);
    }
}

/**
 *     @desc: Convert string to it boolean representation
 *     @type: private
 *     @param: inputString - string for covertion
 *     @topic: 0
 */
function convertStringToBoolean(inputString){
    if (typeof (inputString) == "string")
        inputString=inputString.toLowerCase();

    switch (inputString){
        case "1":
        case "true":
        case "yes":
        case "y":
        case 1:
        case true:
            return true;
            break;

        default: return false;
    }
}

/**
 *     @desc: find out what symbol to use as url param delimiters in further params
 *     @type: private
 *     @param: str - current url string
 *     @topic: 0
 */
function getUrlSymbol(str){
    if (str.indexOf("?") != -1)
        return "&"
    else
        return "?"
}

function dhtmlDragAndDropObject(){
    if (window.dhtmlDragAndDrop)
        return window.dhtmlDragAndDrop;

    this.lastLanding=0;
    this.dragNode=0;
    this.dragStartNode=0;
    this.dragStartObject=0;
    this.tempDOMU=null;
    this.tempDOMM=null;
    this.waitDrag=0;
    window.dhtmlDragAndDrop=this;

    return this;
};

dhtmlDragAndDropObject.prototype.removeDraggableItem=function(htmlNode){
    htmlNode.onmousedown=null;
    htmlNode.dragStarter=null;
    htmlNode.dragLanding=null;
}
dhtmlDragAndDropObject.prototype.addDraggableItem=function(htmlNode, dhtmlObject){
    htmlNode.onmousedown=this.preCreateDragCopy;
    htmlNode.dragStarter=dhtmlObject;
    this.addDragLanding(htmlNode, dhtmlObject);
}
dhtmlDragAndDropObject.prototype.addDragLanding=function(htmlNode, dhtmlObject){
    htmlNode.dragLanding=dhtmlObject;
}
dhtmlDragAndDropObject.prototype.preCreateDragCopy=function(e){
    if ((e||window.event) && (e||event).button == 2)
        return;

    if (window.dhtmlDragAndDrop.waitDrag){
        window.dhtmlDragAndDrop.waitDrag=0;
        document.body.onmouseup=window.dhtmlDragAndDrop.tempDOMU;
        document.body.onmousemove=window.dhtmlDragAndDrop.tempDOMM;
        return false;
    }

    if (window.dhtmlDragAndDrop.dragNode)
        window.dhtmlDragAndDrop.stopDrag(e);

    window.dhtmlDragAndDrop.waitDrag=1;
    window.dhtmlDragAndDrop.tempDOMU=document.body.onmouseup;
    window.dhtmlDragAndDrop.tempDOMM=document.body.onmousemove;
    window.dhtmlDragAndDrop.dragStartNode=this;
    window.dhtmlDragAndDrop.dragStartObject=this.dragStarter;
    document.body.onmouseup=window.dhtmlDragAndDrop.preCreateDragCopy;
    document.body.onmousemove=window.dhtmlDragAndDrop.callDrag;
    window.dhtmlDragAndDrop.downtime = new Date().valueOf();


    if ((e)&&(e.preventDefault)){
        e.preventDefault();
        return false;
    }
    return false;
};
dhtmlDragAndDropObject.prototype.callDrag=function(e){
    if (!e)
        e=window.event;
    dragger=window.dhtmlDragAndDrop;
    if ((new Date()).valueOf()-dragger.downtime<100) return;

    //if ((e.button == 0)&&(_isIE))
    //	return dragger.stopDrag();

    if (!dragger.dragNode){
        if (dragger.waitDrag){
            dragger.dragNode=dragger.dragStartObject._createDragNode(dragger.dragStartNode, e);

            if (!dragger.dragNode)
                return dragger.stopDrag();

            dragger.dragNode.onselectstart=function(){return false;}
            dragger.gldragNode=dragger.dragNode;
            document.body.appendChild(dragger.dragNode);
            document.body.onmouseup=dragger.stopDrag;
            dragger.waitDrag=0;
            dragger.dragNode.pWindow=window;
            dragger.initFrameRoute();
        }
        else return dragger.stopDrag(e, true);
    }

    if (dragger.dragNode.parentNode != window.document.body && dragger.gldragNode){
        var grd = dragger.gldragNode;

        if (dragger.gldragNode.old)
            grd=dragger.gldragNode.old;

        //if (!document.all) dragger.calculateFramePosition();
        grd.parentNode.removeChild(grd);
        var oldBody = dragger.dragNode.pWindow;

        if (grd.pWindow &&	grd.pWindow.dhtmlDragAndDrop.lastLanding)
            grd.pWindow.dhtmlDragAndDrop.lastLanding.dragLanding._dragOut(grd.pWindow.dhtmlDragAndDrop.lastLanding);

        //		var oldp=dragger.dragNode.parentObject;
        if (_isIE){
            var div = document.createElement("Div");
            div.innerHTML=dragger.dragNode.outerHTML;
            dragger.dragNode=div.childNodes[0];
        } else
            dragger.dragNode=dragger.dragNode.cloneNode(true);

        dragger.dragNode.pWindow=window;
        //		dragger.dragNode.parentObject=oldp;

        dragger.gldragNode.old=dragger.dragNode;
        document.body.appendChild(dragger.dragNode);
        oldBody.dhtmlDragAndDrop.dragNode=dragger.dragNode;
    }

    dragger.dragNode.style.left=e.clientX+15+(dragger.fx
        ? dragger.fx*(-1)
        : 0)
        +(document.body.scrollLeft||document.documentElement.scrollLeft)+"px";
    dragger.dragNode.style.top=e.clientY+3+(dragger.fy
        ? dragger.fy*(-1)
        : 0)
        +(document.body.scrollTop||document.documentElement.scrollTop)+"px";

    if (!e.srcElement)
        var z = e.target;
    else
        z=e.srcElement;
    dragger.checkLanding(z, e);
}

dhtmlDragAndDropObject.prototype.calculateFramePosition=function(n){
    //this.fx = 0, this.fy = 0;
    if (window.name){
        var el = parent.frames[window.name].frameElement.offsetParent;
        var fx = 0;
        var fy = 0;

        while (el){
            fx+=el.offsetLeft;
            fy+=el.offsetTop;
            el=el.offsetParent;
        }

        if ((parent.dhtmlDragAndDrop)){
            var ls = parent.dhtmlDragAndDrop.calculateFramePosition(1);
            fx+=ls.split('_')[0]*1;
            fy+=ls.split('_')[1]*1;
        }

        if (n)
            return fx+"_"+fy;
        else
            this.fx=fx;
        this.fy=fy;
    }
    return "0_0";
}
dhtmlDragAndDropObject.prototype.checkLanding=function(htmlObject, e){
    if ((htmlObject)&&(htmlObject.dragLanding)){
        if (this.lastLanding)
            this.lastLanding.dragLanding._dragOut(this.lastLanding);
        this.lastLanding=htmlObject;
        this.lastLanding=this.lastLanding.dragLanding._dragIn(this.lastLanding, this.dragStartNode, e.clientX,
            e.clientY, e);
        this.lastLanding_scr=(_isIE ? e.srcElement : e.target);
    } else {
        if ((htmlObject)&&(htmlObject.tagName != "BODY"))
            this.checkLanding(htmlObject.parentNode, e);
        else {
            if (this.lastLanding)
                this.lastLanding.dragLanding._dragOut(this.lastLanding, e.clientX, e.clientY, e);
            this.lastLanding=0;

            if (this._onNotFound)
                this._onNotFound();
        }
    }
}
dhtmlDragAndDropObject.prototype.stopDrag=function(e, mode){
    dragger=window.dhtmlDragAndDrop;

    if (!mode){
        dragger.stopFrameRoute();
        var temp = dragger.lastLanding;
        dragger.lastLanding=null;

        if (temp)
            temp.dragLanding._drag(dragger.dragStartNode, dragger.dragStartObject, temp, (_isIE
                ? event.srcElement
                : e.target));
    }
    dragger.lastLanding=null;

    if ((dragger.dragNode)&&(dragger.dragNode.parentNode == document.body))
        dragger.dragNode.parentNode.removeChild(dragger.dragNode);
    dragger.dragNode=0;
    dragger.gldragNode=0;
    dragger.fx=0;
    dragger.fy=0;
    dragger.dragStartNode=0;
    dragger.dragStartObject=0;
    document.body.onmouseup=dragger.tempDOMU;
    document.body.onmousemove=dragger.tempDOMM;
    dragger.tempDOMU=null;
    dragger.tempDOMM=null;
    dragger.waitDrag=0;
}

dhtmlDragAndDropObject.prototype.stopFrameRoute=function(win){
    if (win)
        window.dhtmlDragAndDrop.stopDrag(1, 1);

    for (var i = 0; i < window.frames.length; i++){
        try{
            if ((window.frames[i] != win)&&(window.frames[i].dhtmlDragAndDrop))
                window.frames[i].dhtmlDragAndDrop.stopFrameRoute(window);
        } catch(e){}
    }

    try{
        if ((parent.dhtmlDragAndDrop)&&(parent != window)&&(parent != win))
            parent.dhtmlDragAndDrop.stopFrameRoute(window);
    } catch(e){}
}
dhtmlDragAndDropObject.prototype.initFrameRoute=function(win, mode){
    if (win){
        window.dhtmlDragAndDrop.preCreateDragCopy();
        window.dhtmlDragAndDrop.dragStartNode=win.dhtmlDragAndDrop.dragStartNode;
        window.dhtmlDragAndDrop.dragStartObject=win.dhtmlDragAndDrop.dragStartObject;
        window.dhtmlDragAndDrop.dragNode=win.dhtmlDragAndDrop.dragNode;
        window.dhtmlDragAndDrop.gldragNode=win.dhtmlDragAndDrop.dragNode;
        window.document.body.onmouseup=window.dhtmlDragAndDrop.stopDrag;
        window.waitDrag=0;

        if (((!_isIE)&&(mode))&&((!_isFF)||(_FFrv < 1.8)))
            window.dhtmlDragAndDrop.calculateFramePosition();
    }
    try{
        if ((parent.dhtmlDragAndDrop)&&(parent != window)&&(parent != win))
            parent.dhtmlDragAndDrop.initFrameRoute(window);
    }catch(e){}

    for (var i = 0; i < window.frames.length; i++){
        try{
            if ((window.frames[i] != win)&&(window.frames[i].dhtmlDragAndDrop))
                window.frames[i].dhtmlDragAndDrop.initFrameRoute(window, ((!win||mode) ? 1 : 0));
        } catch(e){}
    }
}

_isFF = false;
_isIE = false;
_isOpera = false;
_isKHTML = false;
_isMacOS = false;
_isChrome = false;
_FFrv = false;
_KHTMLrv = false;
_OperaRv = false;

if (navigator.userAgent.indexOf('Macintosh') != -1)
    _isMacOS=true;


if (navigator.userAgent.toLowerCase().indexOf('chrome')>-1)
    _isChrome=true;

if ((navigator.userAgent.indexOf('Safari') != -1)||(navigator.userAgent.indexOf('Konqueror') != -1)){
    _KHTMLrv = parseFloat(navigator.userAgent.substr(navigator.userAgent.indexOf('Safari')+7, 5));

    if (_KHTMLrv > 525){ //mimic FF behavior for Safari 3.1+
        _isFF=true;
        _FFrv = 1.9;
    } else
        _isKHTML=true;
} else if (navigator.userAgent.indexOf('Opera') != -1){
    _isOpera=true;
    _OperaRv=parseFloat(navigator.userAgent.substr(navigator.userAgent.indexOf('Opera')+6, 3));
}


else if (navigator.appName.indexOf("Microsoft") != -1){
    _isIE=true;
    if ((navigator.appVersion.indexOf("MSIE 8.0")!= -1 || navigator.appVersion.indexOf("MSIE 9.0")!= -1 || navigator.appVersion.indexOf("MSIE 10.0")!= -1 ) && document.compatMode != "BackCompat"){
        _isIE=8;
    }
} else {
    _isFF=true;
    _FFrv = parseFloat(navigator.userAgent.split("rv:")[1])
}


//multibrowser Xpath processor
dtmlXMLLoaderObject.prototype.doXPath=function(xpathExp, docObj, namespace, result_type){
    if (_isKHTML || (!_isIE && !window.XPathResult))
        return this.doXPathOpera(xpathExp, docObj);

    if (_isIE){ //IE
        if (!docObj)
            if (!this.xmlDoc.nodeName)
                docObj=this.xmlDoc.responseXML
            else
                docObj=this.xmlDoc;

        if (!docObj)
            dhtmlxError.throwError("LoadXML", "Incorrect XML", [
                (docObj||this.xmlDoc),
                this.mainObject
            ]);

        if (namespace != null)
            docObj.setProperty("SelectionNamespaces", "xmlns:xsl='"+namespace+"'"); //

        if (result_type == 'single'){
            return docObj.selectSingleNode(xpathExp);
        }
        else {
            return docObj.selectNodes(xpathExp)||new Array(0);
        }
    } else { //Mozilla
        var nodeObj = docObj;

        if (!docObj){
            if (!this.xmlDoc.nodeName){
                docObj=this.xmlDoc.responseXML
            }
            else {
                docObj=this.xmlDoc;
            }
        }

        if (!docObj)
            dhtmlxError.throwError("LoadXML", "Incorrect XML", [
                (docObj||this.xmlDoc),
                this.mainObject
            ]);

        if (docObj.nodeName.indexOf("document") != -1){
            nodeObj=docObj;
        }
        else {
            nodeObj=docObj;
            docObj=docObj.ownerDocument;
        }
        var retType = XPathResult.ANY_TYPE;

        if (result_type == 'single')
            retType=XPathResult.FIRST_ORDERED_NODE_TYPE
        var rowsCol = new Array();
        var col = docObj.evaluate(xpathExp, nodeObj, function(pref){
            return namespace
        }, retType, null);

        if (retType == XPathResult.FIRST_ORDERED_NODE_TYPE){
            return col.singleNodeValue;
        }
        var thisColMemb = col.iterateNext();

        while (thisColMemb){
            rowsCol[rowsCol.length]=thisColMemb;
            thisColMemb=col.iterateNext();
        }
        return rowsCol;
    }
}

function _dhtmlxError(type, name, params){
    if (!this.catches)
        this.catches=new Array();

    return this;
}

_dhtmlxError.prototype.catchError=function(type, func_name){
    this.catches[type]=func_name;
}
_dhtmlxError.prototype.throwError=function(type, name, params){
    if (this.catches[type])
        return this.catches[type](type, name, params);

    if (this.catches["ALL"])
        return this.catches["ALL"](type, name, params);

    alert("Error type: "+arguments[0]+"\nDescription: "+arguments[1]);
    return null;
}

window.dhtmlxError=new _dhtmlxError();


//opera fake, while 9.0 not released
//multibrowser Xpath processor
dtmlXMLLoaderObject.prototype.doXPathOpera=function(xpathExp, docObj){
    //this is fake for Opera
    var z = xpathExp.replace(/[\/]+/gi, "/").split('/');
    var obj = null;
    var i = 1;

    if (!z.length)
        return [];

    if (z[0] == ".")
        obj=[docObj]; else if (z[0] == ""){
        obj=(this.xmlDoc.responseXML||this.xmlDoc).getElementsByTagName(z[i].replace(/\[[^\]]*\]/g, ""));
        i++;
    } else
        return [];

    for (i; i < z.length; i++)obj=this._getAllNamedChilds(obj, z[i]);

    if (z[i-1].indexOf("[") != -1)
        obj=this._filterXPath(obj, z[i-1]);
    return obj;
}

dtmlXMLLoaderObject.prototype._filterXPath=function(a, b){
    var c = new Array();
    var b = b.replace(/[^\[]*\[\@/g, "").replace(/[\[\]\@]*/g, "");

    for (var i = 0; i < a.length; i++)
        if (a[i].getAttribute(b))
            c[c.length]=a[i];

    return c;
}
dtmlXMLLoaderObject.prototype._getAllNamedChilds=function(a, b){
    var c = new Array();

    if (_isKHTML)
        b=b.toUpperCase();

    for (var i = 0; i < a.length; i++)for (var j = 0; j < a[i].childNodes.length; j++){
        if (_isKHTML){
            if (a[i].childNodes[j].tagName&&a[i].childNodes[j].tagName.toUpperCase() == b)
                c[c.length]=a[i].childNodes[j];
        }

        else if (a[i].childNodes[j].tagName == b)
            c[c.length]=a[i].childNodes[j];
    }

    return c;
}

function dhtmlXHeir(a, b){
    for (var c in b)
        if (typeof (b[c]) == "function")
            a[c]=b[c];
    return a;
}

function dhtmlxEvent(el, event, handler){
    if (el.addEventListener)
        el.addEventListener(event, handler, false);

    else if (el.attachEvent)
        el.attachEvent("on"+event, handler);
}

//============= XSL Extension ===================================

dtmlXMLLoaderObject.prototype.xslDoc=null;
dtmlXMLLoaderObject.prototype.setXSLParamValue=function(paramName, paramValue, xslDoc){
    if (!xslDoc)
        xslDoc=this.xslDoc

    if (xslDoc.responseXML)
        xslDoc=xslDoc.responseXML;
    var item =
        this.doXPath("/xsl:stylesheet/xsl:variable[@name='"+paramName+"']", xslDoc,
            "http:/\/www.w3.org/1999/XSL/Transform", "single");

    if (item != null)
        item.firstChild.nodeValue=paramValue
}
dtmlXMLLoaderObject.prototype.doXSLTransToObject=function(xslDoc, xmlDoc){
    if (!xslDoc)
        xslDoc=this.xslDoc;

    if (xslDoc.responseXML)
        xslDoc=xslDoc.responseXML

    if (!xmlDoc)
        xmlDoc=this.xmlDoc;

    if (xmlDoc.responseXML)
        xmlDoc=xmlDoc.responseXML

    //MOzilla
    if (!_isIE){
        if (!this.XSLProcessor){
            this.XSLProcessor=new XSLTProcessor();
            this.XSLProcessor.importStylesheet(xslDoc);
        }
        var result = this.XSLProcessor.transformToDocument(xmlDoc);
    } else {
        var result = new ActiveXObject("Msxml2.DOMDocument.3.0");
        try{
            xmlDoc.transformNodeToObject(xslDoc, result);
        }catch(e){
            result = xmlDoc.transformNode(xslDoc);
        }
    }
    return result;
}

dtmlXMLLoaderObject.prototype.doXSLTransToString=function(xslDoc, xmlDoc){
    var res = this.doXSLTransToObject(xslDoc, xmlDoc);
    if(typeof(res)=="string")
        return res;
    return this.doSerialization(res);
}

dtmlXMLLoaderObject.prototype.doSerialization=function(xmlDoc){
    if (!xmlDoc)
        xmlDoc=this.xmlDoc;
    if (xmlDoc.responseXML)
        xmlDoc=xmlDoc.responseXML
    if (!_isIE){
        var xmlSerializer = new XMLSerializer();
        return xmlSerializer.serializeToString(xmlDoc);
    } else
        return xmlDoc.xml;
}

/**
 *   @desc:
 *   @type: private
 */
dhtmlxEventable=function(obj){
    obj.attachEvent=function(name, catcher, callObj){
        name='ev_'+name.toLowerCase();
        if (!this[name])
            this[name]=new this.eventCatcher(callObj||this);

        return(name+':'+this[name].addEvent(catcher)); //return ID (event name & event ID)
    }
    obj.callEvent=function(name, arg0){
        name='ev_'+name.toLowerCase();
        if (this[name])
            return this[name].apply(this, arg0);
        return true;
    }
    obj.checkEvent=function(name){
        return (!!this['ev_'+name.toLowerCase()])
    }
    obj.eventCatcher=function(obj){
        var dhx_catch = [];
        var z = function(){
            var res = true;
            for (var i = 0; i < dhx_catch.length; i++){
                if (dhx_catch[i] != null){
                    var zr = dhx_catch[i].apply(obj, arguments);
                    res=res&&zr;
                }
            }
            return res;
        }
        z.addEvent=function(ev){
            if (typeof (ev) != "function")
                ev=eval(ev);
            if (ev)
                return dhx_catch.push(ev)-1;
            return false;
        }
        z.removeEvent=function(id){
            dhx_catch[id]=null;
        }
        return z;
    }
    obj.detachEvent=function(id){
        if (id != false){
            var list = id.split(':');           //get EventName and ID
            this[list[0]].removeEvent(list[1]); //remove event
        }
    }
    obj.detachAllEvents = function(){
        for (var name in this){
            if (name.indexOf("ev_")==0)
                delete this[name];
        }
    }
    obj = null;
};

if(!window.dhtmlx)
    window.dhtmlx = {};

(function(){
    var _dhx_msg_cfg = null;
    function callback(config, result){
        var usercall = config.callback;
        modality(false);
        config.box.parentNode.removeChild(config.box);
        _dhx_msg_cfg = config.box = null;
        if (usercall)
            usercall(result);
    }
    function modal_key(e){
        if (_dhx_msg_cfg){
            e = e||event;
            var code = e.which||event.keyCode;
            if (dhtmlx.message.keyboard){
                if (code == 13 || code == 32)
                    callback(_dhx_msg_cfg, true);
                if (code == 27)
                    callback(_dhx_msg_cfg, false);
            }
            if (e.preventDefault)
                e.preventDefault();
            return !(e.cancelBubble = true);
        }
    }
    if (document.attachEvent)
        document.attachEvent("onkeydown", modal_key);
    else
        document.addEventListener("keydown", modal_key, true);

    function modality(mode){
        if(!modality.cover){
            modality.cover = document.createElement("DIV");
            //necessary for IE only
            modality.cover.onkeydown = modal_key;
            modality.cover.className = "dhx_modal_cover";
            document.body.appendChild(modality.cover);
        }
        var height =  document.body.scrollHeight;
        modality.cover.style.display = mode?"inline-block":"none";
    }

    function button(text, result){
        var button_css = "dhtmlx_"+text.toLowerCase().replace(/ /g, "_")+"_button"; // dhtmlx_ok_button, dhtmlx_click_me_button
        return "<div class='dhtmlx_popup_button "+button_css+"' result='"+result+"' ><div>"+text+"</div></div>";
    }

    function info(text){
        if (!t.area){
            t.area = document.createElement("DIV");
            t.area.className = "dhtmlx_message_area";
            t.area.style[t.position]="5px";
            document.body.appendChild(t.area);
        }

        t.hide(text.id);
        var message = document.createElement("DIV");
        message.innerHTML = "<div>"+text.text+"</div>";
        message.className = "dhtmlx-info dhtmlx-" + text.type;
        message.onclick = function(){
            t.hide(text.id);
            text = null;
        };

        if (t.position == "bottom" && t.area.firstChild)
            t.area.insertBefore(message,t.area.firstChild);
        else
            t.area.appendChild(message);

        if (text.expire > 0)
            t.timers[text.id]=window.setTimeout(function(){
                t.hide(text.id);
            }, text.expire);

        t.pull[text.id] = message;
        message = null;

        return text.id;
    }
    function _boxStructure(config, ok, cancel){
        var box = document.createElement("DIV");
        box.className = " dhtmlx_modal_box dhtmlx-"+config.type;
        box.setAttribute("dhxbox", 1);

        var inner = '';

        if (config.width)
            box.style.width = config.width;
        if (config.height)
            box.style.height = config.height;
        if (config.title)
            inner+='<div class="dhtmlx_popup_title">'+config.title+'</div>';
        inner+='<div class="dhtmlx_popup_text"><span>'+(config.content?'':config.text)+'</span></div><div  class="dhtmlx_popup_controls">';
        if (ok)
            inner += button(config.ok || "OK", true);
        if (cancel)
            inner += button(config.cancel || "Cancel", false);
        if (config.buttons){
            for (var i=0; i<config.buttons.length; i++)
                inner += button(config.buttons[i],i);
        }
        inner += '</div>';
        box.innerHTML = inner;

        if (config.content){
            var node = config.content;
            if (typeof node == "string")
                node = document.getElementById(node);
            if (node.style.display == 'none')
                node.style.display = "";
            box.childNodes[config.title?1:0].appendChild(node);
        }

        box.onclick = function(e){
            e = e ||event;
            var source = e.target || e.srcElement;
            if (!source.className) source = source.parentNode;
            if (source.className.split(" ")[0] == "dhtmlx_popup_button"){
                result = source.getAttribute("result");
                result = (result == "true")||(result == "false"?false:result);
                callback(config, result);
            }
        };
        config.box = box;
        if (ok||cancel)
            _dhx_msg_cfg = config;

        return box;
    }
    function _createBox(config, ok, cancel){
        var box = config.tagName ? config : _boxStructure(config, ok, cancel);

        if (!config.hidden)
            modality(true);
        document.body.appendChild(box);
        var x = Math.abs(Math.floor(((window.innerWidth||document.documentElement.offsetWidth) - box.offsetWidth)/2));
        var y = Math.abs(Math.floor(((window.innerHeight||document.documentElement.offsetHeight) - box.offsetHeight)/2));
        if (config.position == "top")
            box.style.top = "-3px";
        else
            box.style.top = y+'px';
        box.style.left = x+'px';
        //necessary for IE only
        box.onkeydown = modal_key;

        box.focus();
        if (config.hidden)
            dhtmlx.modalbox.hide(box);

        return box;
    }

    function alertPopup(config){
        return _createBox(config, true, false);
    }
    function confirmPopup(config){
        return _createBox(config, true, true);
    }
    function boxPopup(config){
        return _createBox(config);
    }
    function box_params(text, type, callback){
        if (typeof text != "object"){
            if (typeof type == "function"){
                callback = type;
                type = "";
            }
            text = {text:text, type:type, callback:callback };
        }
        return text;
    }
    function params(text, type, expire, id){
        if (typeof text != "object")
            text = {text:text, type:type, expire:expire, id:id};
        text.id = text.id||t.uid();
        text.expire = text.expire||t.expire;
        return text;
    }
    dhtmlx.alert = function(){
        text = box_params.apply(this, arguments);
        text.type = text.type || "confirm";
        return alertPopup(text);
    };
    dhtmlx.confirm = function(){
        text = box_params.apply(this, arguments);
        text.type = text.type || "alert";
        return confirmPopup(text);
    };
    dhtmlx.modalbox = function(){
        text = box_params.apply(this, arguments);
        text.type = text.type || "alert";
        return boxPopup(text);
    };
    dhtmlx.modalbox.hide = function(node){
        while (node && node.getAttribute && !node.getAttribute("dhxbox"))
            node = node.parentNode;
        if (node){
            node.parentNode.removeChild(node);
            modality(false);
        }
    };
    var t = dhtmlx.message = function(text, type, expire, id){
        text = params.apply(this, arguments);
        text.type = text.type||"info";

        var subtype = text.type.split("-")[0];
        switch (subtype){
            case "alert":
                return alertPopup(text);
            case "confirm":
                return confirmPopup(text);
            case "modalbox":
                return boxPopup(text);
            default:
                return info(text);
                break;
        }
    };

    t.seed = (new Date()).valueOf();
    t.uid = function(){return t.seed++;};
    t.expire = 4000;
    t.keyboard = true;
    t.position = "top";
    t.pull = {};
    t.timers = {};

    t.hideAll = function(){
        for (var key in t.pull)
            t.hide(key);
    };
    t.hide = function(id){
        var obj = t.pull[id];
        if (obj && obj.parentNode){
            window.setTimeout(function(){
                obj.parentNode.removeChild(obj);
                obj = null;
            },2000);
            obj.className+=" hidden";

            if(t.timers[id])
                window.clearTimeout(t.timers[id]);
            delete t.pull[id];
        }
    };
})();
/**
 * 	@desc: constructor, data processor object
 *	@param: serverProcessorURL - url used for update
 *	@type: public
 */
function dataProcessor(serverProcessorURL){
    this.serverProcessor = serverProcessorURL;
    this.action_param="!nativeeditor_status";

    this.object = null;
    this.updatedRows = []; //ids of updated rows

    this.autoUpdate = true;
    this.updateMode = "cell";
    this._tMode="GET";
    this.post_delim = "_";

    this._waitMode=0;
    this._in_progress={};//?
    this._invalid={};
    this.mandatoryFields=[];
    this.messages=[];

    this.styles={
        updated:"font-weight:bold;",
        inserted:"font-weight:bold;",
        deleted:"text-decoration : line-through;",
        invalid:"background-color:FFE0E0;",
        invalid_cell:"border-bottom:2px solid red;",
        error:"color:red;",
        clear:"font-weight:normal;text-decoration:none;"
    };

    this.enableUTFencoding(true);
    dhtmlxEventable(this);

    return this;
}

dataProcessor.prototype={
    /**
     * 	@desc: select GET or POST transaction model
     *	@param: mode - GET/POST
     *	@param: total - true/false - send records row by row or all at once (for grid only)
     *	@type: public
     */
    setTransactionMode:function(mode,total){
        this._tMode=mode;
        this._tSend=total;
    },
    escape:function(data){
        if (this._utf)
            return encodeURIComponent(data);
        else
            return escape(data);
    },
    /**
     * 	@desc: allows to set escaping mode
     *	@param: true - utf based escaping, simple - use current page encoding
     *	@type: public
     */
    enableUTFencoding:function(mode){
        this._utf=convertStringToBoolean(mode);
    },
    /**
     * 	@desc: allows to define, which column may trigger update
     *	@param: val - array or list of true/false values
     *	@type: public
     */
    setDataColumns:function(val){
        this._columns=(typeof val == "string")?val.split(","):val;
    },
    /**
     * 	@desc: get state of updating
     *	@returns:   true - all in sync with server, false - some items not updated yet.
     *	@type: public
     */
    getSyncState:function(){
        return !this.updatedRows.length;
    },
    /**
     * 	@desc: enable/disable named field for data syncing, will use column ids for grid
     *	@param:   mode - true/false
     *	@type: public
     */
    enableDataNames:function(mode){
        this._endnm=convertStringToBoolean(mode);
    },
    /**
     * 	@desc: enable/disable mode , when only changed fields and row id send to the server side, instead of all fields in default mode
     *	@param:   mode - true/false
     *	@type: public
     */
    enablePartialDataSend:function(mode){
        this._changed=convertStringToBoolean(mode);
    },
    /**
     * 	@desc: set if rows should be send to server automaticaly
     *	@param: mode - "row" - based on row selection changed, "cell" - based on cell editing finished, "off" - manual data sending
     *	@type: public
     */
    setUpdateMode:function(mode,dnd){
        this.autoUpdate = (mode=="cell");
        this.updateMode = mode;
        this.dnd=dnd;
    },
    ignore:function(code,master){
        this._silent_mode=true;
        code.call(master||window);
        this._silent_mode=false;
    },
    /**
     * 	@desc: mark row as updated/normal. check mandatory fields,initiate autoupdate (if turned on)
     *	@param: rowId - id of row to set update-status for
     *	@param: state - true for "updated", false for "not updated"
     *	@param: mode - update mode name
     *	@type: public
     */
    setUpdated:function(rowId,state,mode){
        if (this._silent_mode) return;
        var ind=this.findRow(rowId);

        mode=mode||"updated";
        var existing = this.obj.getUserData(rowId,this.action_param);
        if (existing && mode == "updated") mode=existing;
        if (state){
            this.set_invalid(rowId,false); //clear previous error flag
            this.updatedRows[ind]=rowId;
            this.obj.setUserData(rowId,this.action_param,mode);
            if (this._in_progress[rowId])
                this._in_progress[rowId]="wait";
        } else{
            if (!this.is_invalid(rowId)){
                this.updatedRows.splice(ind,1);
                this.obj.setUserData(rowId,this.action_param,"");
            }
        }

        //clear changed flag
        if (!state)
            this._clearUpdateFlag(rowId);

        this.markRow(rowId,state,mode);
        if (state && this.autoUpdate) this.sendData(rowId);
    },
    _clearUpdateFlag:function(id){},
    markRow:function(id,state,mode){
        var str="";
        var invalid=this.is_invalid(id);
        if (invalid){
            str=this.styles[invalid];
            state=true;
        }
        if (this.callEvent("onRowMark",[id,state,mode,invalid])){
            //default logic
            str=this.styles[state?mode:"clear"]+str;

            this.obj[this._methods[0]](id,str);

            if (invalid && invalid.details){
                str+=this.styles[invalid+"_cell"];
                for (var i=0; i < invalid.details.length; i++)
                    if (invalid.details[i])
                        this.obj[this._methods[1]](id,i,str);
            }
        }
    },
    getState:function(id){
        return this.obj.getUserData(id,this.action_param);
    },
    is_invalid:function(id){
        return this._invalid[id];
    },
    set_invalid:function(id,mode,details){
        if (details) mode={value:mode, details:details, toString:function(){ return this.value.toString(); }};
        this._invalid[id]=mode;
    },
    /**
     * 	@desc: check mandatory fields and varify values of cells, initiate update (if specified)
     *	@param: rowId - id of row to set update-status for
     *	@type: public
     */
    checkBeforeUpdate:function(rowId){
        return true;
    },
    /**
     * 	@desc: send row(s) values to server
     *	@param: rowId - id of row which data to send. If not specified, then all "updated" rows will be send
     *	@type: public
     */
    sendData:function(rowId){
        if (this._waitMode && (this.obj.mytype=="tree" || this.obj._h2)) return;
        if (this.obj.editStop) this.obj.editStop();


        if(typeof rowId == "undefined" || this._tSend) return this.sendAllData();
        if (this._in_progress[rowId]) return false;

        this.messages=[];
        if (!this.checkBeforeUpdate(rowId) && this.callEvent("onValidatationError",[rowId,this.messages])) return false;
        this._beforeSendData(this._getRowData(rowId),rowId);
    },
    _beforeSendData:function(data,rowId){
        if (!this.callEvent("onBeforeUpdate",[rowId,this.getState(rowId),data])) return false;
        this._sendData(data,rowId);
    },
    serialize:function(data, id){
        if (typeof data == "string")
            return data;
        if (typeof id != "undefined")
            return this.serialize_one(data,"");
        else{
            var stack = [];
            var keys = [];
            for (var key in data)
                if (data.hasOwnProperty(key)){
                    stack.push(this.serialize_one(data[key],key+this.post_delim));
                    keys.push(key);
                }
            stack.push("ids="+this.escape(keys.join(",")));
            if (dhtmlx.security_key)
                stack.push("dhx_security="+dhtmlx.security_key);
            return stack.join("&");
        }
    },
    serialize_one:function(data, pref){
        if (typeof data == "string")
            return data;
        var stack = [];
        for (var key in data)
            if (data.hasOwnProperty(key))
                stack.push(this.escape((pref||"")+key)+"="+this.escape(data[key]));
        return stack.join("&");
    },
    _sendData:function(a1,rowId){
        if (!a1) return; //nothing to send
        if (!this.callEvent("onBeforeDataSending",rowId?[rowId,this.getState(rowId),a1]:[null, null, a1])) return false;

        if (rowId)
            this._in_progress[rowId]=(new Date()).valueOf();
        var a2=new dtmlXMLLoaderObject(this.afterUpdate,this,true);

        var a3 = this.serverProcessor+(this._user?(getUrlSymbol(this.serverProcessor)+["dhx_user="+this._user,"dhx_version="+this.obj.getUserData(0,"version")].join("&")):"");

        if (this._tMode!="POST")
            a2.loadXML(a3+((a3.indexOf("?")!=-1)?"&":"?")+this.serialize(a1,rowId));
        else
            a2.loadXML(a3,true,this.serialize(a1,rowId));

        this._waitMode++;
    },
    sendAllData:function(){
        if (!this.updatedRows.length) return;

        this.messages=[]; var valid=true;
        for (var i=0; i<this.updatedRows.length; i++)
            valid&=this.checkBeforeUpdate(this.updatedRows[i]);
        if (!valid && !this.callEvent("onValidatationError",["",this.messages])) return false;

        if (this._tSend)
            this._sendData(this._getAllData());
        else
            for (var i=0; i<this.updatedRows.length; i++)
                if (!this._in_progress[this.updatedRows[i]]){
                    if (this.is_invalid(this.updatedRows[i])) continue;
                    this._beforeSendData(this._getRowData(this.updatedRows[i]),this.updatedRows[i]);
                    if (this._waitMode && (this.obj.mytype=="tree" || this.obj._h2)) return; //block send all for tree
                }
    },








    _getAllData:function(rowId){
        var out={};
        var has_one = false;
        for(var i=0;i<this.updatedRows.length;i++){
            var id=this.updatedRows[i];
            if (this._in_progress[id] || this.is_invalid(id)) continue;
            if (!this.callEvent("onBeforeUpdate",[id,this.getState(id)])) continue;
            out[id]=this._getRowData(id,id+this.post_delim);
            has_one = true;
            this._in_progress[id]=(new Date()).valueOf();
        }
        return has_one?out:null;
    },


    /**
     * 	@desc: specify column which value should be varified before sending to server
     *	@param: ind - column index (0 based)
     *	@param: verifFunction - function (object) which should verify cell value (if not specified, then value will be compared to empty string). Two arguments will be passed into it: value and column name
     *	@type: public
     */
    setVerificator:function(ind,verifFunction){
        this.mandatoryFields[ind] = verifFunction||(function(value){return (value!="");});
    },
    /**
     * 	@desc: remove column from list of those which should be verified
     *	@param: ind - column Index (0 based)
     *	@type: public
     */
    clearVerificator:function(ind){
        this.mandatoryFields[ind] = false;
    },





    findRow:function(pattern){
        var i=0;
        for(i=0;i<this.updatedRows.length;i++)
            if(pattern==this.updatedRows[i]) break;
        return i;
    },











    /**
     * 	@desc: define custom actions
     *	@param: name - name of action, same as value of action attribute
     *	@param: handler - custom function, which receives a XMl response content for action
     *	@type: private
     */
    defineAction:function(name,handler){
        if (!this._uActions) this._uActions=[];
        this._uActions[name]=handler;
    },




    /**
     *     @desc: used in combination with setOnBeforeUpdateHandler to create custom client-server transport system
     *     @param: sid - id of item before update
     *     @param: tid - id of item after up0ate
     *     @param: action - action name
     *     @type: public
     *     @topic: 0
     */
    afterUpdateCallback:function(sid, tid, action, btag) {
        var marker = sid;
        var correct=(action!="error" && action!="invalid");
        if (!correct) this.set_invalid(sid,action);
        if ((this._uActions)&&(this._uActions[action])&&(!this._uActions[action](btag)))
            return (delete this._in_progress[marker]);

        if (this._in_progress[marker]!="wait")
            this.setUpdated(sid, false);

        var soid = sid;

        switch (action) {
            case "update":
            case "updated":
            case "inserted":
            case "insert":
                if (tid != sid) {
                    this.obj[this._methods[2]](sid, tid);
                    sid = tid;
                }
                break;
            case "delete":
            case "deleted":
                this.obj.setUserData(sid, this.action_param, "true_deleted");
                this.obj[this._methods[3]](sid);
                delete this._in_progress[marker];
                return this.callEvent("onAfterUpdate", [sid, action, tid, btag]);
                break;
        }

        if (this._in_progress[marker]!="wait"){
            if (correct) this.obj.setUserData(sid, this.action_param,'');
            delete this._in_progress[marker];
        } else {
            delete this._in_progress[marker];
            this.setUpdated(tid,true,this.obj.getUserData(sid,this.action_param));
        }

        this.callEvent("onAfterUpdate", [sid, action, tid, btag]);
    },

    /**
     * 	@desc: response from server
     *	@param: xml - XMLLoader object with response XML
     *	@type: private
     */
    afterUpdate:function(that,b,c,d,xml){
        xml.getXMLTopNode("data"); //fix incorrect content type in IE
        if (!xml.xmlDoc.responseXML) return;
        var atag=xml.doXPath("//data/action");
        for (var i=0; i<atag.length; i++){
            var btag=atag[i];
            var action = btag.getAttribute("type");
            var sid = btag.getAttribute("sid");
            var tid = btag.getAttribute("tid");

            that.afterUpdateCallback(sid,tid,action,btag);
        }
        that.finalizeUpdate();
    },
    finalizeUpdate:function(){
        if (this._waitMode) this._waitMode--;

        if ((this.obj.mytype=="tree" || this.obj._h2) && this.updatedRows.length)
            this.sendData();
        this.callEvent("onAfterUpdateFinish",[]);
        if (!this.updatedRows.length)
            this.callEvent("onFullSync",[]);
    },





    /**
     * 	@desc: initializes data-processor
     *	@param: anObj - dhtmlxGrid object to attach this data-processor to
     *	@type: public
     */
    init:function(anObj){
        this.obj = anObj;
        if (this.obj._dp_init)
            this.obj._dp_init(this);
    },


    setOnAfterUpdate:function(ev){
        this.attachEvent("onAfterUpdate",ev);
    },
    enableDebug:function(mode){
    },
    setOnBeforeUpdateHandler:function(func){
        this.attachEvent("onBeforeDataSending",func);
    },



    /*! starts autoupdate mode
     @param interval
     time interval for sending update requests
     */
    setAutoUpdate: function(interval, user) {
        interval = interval || 2000;

        this._user = user || (new Date()).valueOf();
        this._need_update = false;
        this._loader = null;
        this._update_busy = false;

        this.attachEvent("onAfterUpdate",function(sid,action,tid,xml_node){
            this.afterAutoUpdate(sid, action, tid, xml_node);
        });
        this.attachEvent("onFullSync",function(){
            this.fullSync();
        });

        var self = this;
        window.setInterval(function(){
            self.loadUpdate();
        }, interval);
    },


    /*! process updating request answer
     if status == collision version is depricated
     set flag for autoupdating immidiatly
     */
    afterAutoUpdate: function(sid, action, tid, xml_node) {
        if (action == 'collision') {
            this._need_update = true;
            return false;
        } else {
            return true;
        }
    },


    /*! callback function for onFillSync event
     call update function if it's need
     */
    fullSync: function() {
        if (this._need_update == true) {
            this._need_update = false;
            this.loadUpdate();
        }
        return true;
    },


    /*! sends query to the server and call callback function
     */
    getUpdates: function(url,callback){
        if (this._update_busy)
            return false;
        else
            this._update_busy = true;

        this._loader = this._loader || new dtmlXMLLoaderObject(true);

        this._loader.async=true;
        this._loader.waitCall=callback;
        this._loader.loadXML(url);
    },


    /*! returns xml node value
     @param node
     xml node
     */
    _v: function(node) {
        if (node.firstChild) return node.firstChild.nodeValue;
        return "";
    },


    /*! returns values array of xml nodes array
     @param arr
     array of xml nodes
     */
    _a: function(arr) {
        var res = [];
        for (var i=0; i < arr.length; i++) {
            res[i]=this._v(arr[i]);
        };
        return res;
    },


    /*! loads updates and processes them
     */
    loadUpdate: function(){
        var self = this;
        var version = this.obj.getUserData(0,"version");
        var url = this.serverProcessor+getUrlSymbol(this.serverProcessor)+["dhx_user="+this._user,"dhx_version="+version].join("&");
        url = url.replace("editing=true&","");
        this.getUpdates(url, function(){
            var vers = self._loader.doXPath("//userdata");
            self.obj.setUserData(0,"version",self._v(vers[0]));

            var upds = self._loader.doXPath("//update");
            if (upds.length){
                self._silent_mode = true;

                for (var i=0; i<upds.length; i++) {
                    var status = upds[i].getAttribute('status');
                    var id = upds[i].getAttribute('id');
                    var parent = upds[i].getAttribute('parent');
                    switch (status) {
                        case 'inserted':
                            self.callEvent("insertCallback",[upds[i], id, parent]);
                            break;
                        case 'updated':
                            self.callEvent("updateCallback",[upds[i], id, parent]);
                            break;
                        case 'deleted':
                            self.callEvent("deleteCallback",[upds[i], id, parent]);
                            break;
                    }
                }

                self._silent_mode = false;
            }

            self._update_busy = false;
            self = null;
        });
    }

};

//(c)dhtmlx ltd. www.dhtmlx.com
/*
 dhx_sort[index]=direction
 dhx_filter[index]=mask
 */
if (window.dhtmlXGridObject){
    dhtmlXGridObject.prototype._init_point_connector=dhtmlXGridObject.prototype._init_point;
    dhtmlXGridObject.prototype._init_point=function(){
        var clear_url=function(url){
            url=url.replace(/(\?|\&)connector[^\f]*/g,"");
            return url+(url.indexOf("?")!=-1?"&":"?")+"connector=true"+(this.hdr.rows.length > 0 ? "&dhx_no_header=1":"");
        };
        var combine_urls=function(url){
            return clear_url.call(this,url)+(this._connector_sorting||"")+(this._connector_filter||"");
        };
        var sorting_url=function(url,ind,dir){
            this._connector_sorting="&dhx_sort["+ind+"]="+dir;
            return combine_urls.call(this,url);
        };
        var filtering_url=function(url,inds,vals){
            for (var i=0; i<inds.length; i++)
                inds[i]="dhx_filter["+inds[i]+"]="+encodeURIComponent(vals[i]);
            this._connector_filter="&"+inds.join("&");
            return combine_urls.call(this,url);
        };
        this.attachEvent("onCollectValues",function(ind){
            if (this._con_f_used[ind]){
                if (typeof(this._con_f_used[ind]) == "object")
                    return this._con_f_used[ind];
                else
                    return false;
            }
            return true;
        });
        this.attachEvent("onDynXLS",function(){
            this.xmlFileUrl=combine_urls.call(this,this.xmlFileUrl);
            return true;
        });
        this.attachEvent("onBeforeSorting",function(ind,type,dir){
            if (type=="connector"){
                var self=this;
                this.clearAndLoad(sorting_url.call(this,this.xmlFileUrl,ind,dir),function(){
                    self.setSortImgState(true,ind,dir);
                });
                return false;
            }
            return true;
        });
        this.attachEvent("onFilterStart",function(a,b){
            if (this._con_f_used.length){
                this.clearAndLoad(filtering_url.call(this,this.xmlFileUrl,a,b));
                return false;
            }
            return true;
        });
        this.attachEvent("onXLE",function(a,b,c,xml){
            if (!xml) return;
        });

        if (this._init_point_connector) this._init_point_connector();
    };
    dhtmlXGridObject.prototype._con_f_used=[];
    dhtmlXGridObject.prototype._in_header_connector_text_filter=function(t,i){
        if (!this._con_f_used[i])
            this._con_f_used[i]=1;
        return this._in_header_text_filter(t,i);
    };
    dhtmlXGridObject.prototype._in_header_connector_select_filter=function(t,i){
        if (!this._con_f_used[i])
            this._con_f_used[i]=2;
        return this._in_header_select_filter(t,i);
    };
    dhtmlXGridObject.prototype.load_connector=dhtmlXGridObject.prototype.load;
    dhtmlXGridObject.prototype.load=function(url, call, type){
        if (!this._colls_loaded && this.cellType){
            var ar=[];
            for (var i=0; i < this.cellType.length; i++)
                if (this.cellType[i].indexOf("co")==0 || this._con_f_used[i]==2) ar.push(i);
            if (ar.length)
                arguments[0]+=(arguments[0].indexOf("?")!=-1?"&":"?")+"connector=true&dhx_colls="+ar.join(",");
        }
        return this.load_connector.apply(this,arguments);
    };
    dhtmlXGridObject.prototype._parseHead_connector=dhtmlXGridObject.prototype._parseHead;
    dhtmlXGridObject.prototype._parseHead=function(url, call, type){
        this._parseHead_connector.apply(this,arguments);
        if (!this._colls_loaded){
            var cols = this.xmlLoader.doXPath("./coll_options", arguments[0]);
            for (var i=0; i < cols.length; i++){
                var f = cols[i].getAttribute("for");
                var v = [];
                var combo=null;
                if (this.cellType[f] == "combo")
                    combo = this.getColumnCombo(f);
                if (this.cellType[f].indexOf("co")==0)
                    combo=this.getCombo(f);

                var os = this.xmlLoader.doXPath("./item",cols[i]);
                for (var j=0; j<os.length; j++){
                    var val=os[j].getAttribute("value");

                    if (combo){
                        var lab=os[j].getAttribute("label")||val;

                        if (combo.addOption)
                            combo.addOption([[val, lab]]);
                        else
                            combo.put(val,lab);

                        v[v.length]=lab;
                    } else
                        v[v.length]=val;
                }
                if (this._con_f_used[f*1])
                    this._con_f_used[f*1]=v;
            }
            this._colls_loaded=true;
        }
    };
}

if (window.dataProcessor){
    dataProcessor.prototype.init_original=dataProcessor.prototype.init;
    dataProcessor.prototype.init=function(obj){
        this.init_original(obj);
        obj._dataprocessor=this;

        this.setTransactionMode("POST",true);
        this.serverProcessor+=(this.serverProcessor.indexOf("?")!=-1?"&":"?")+"editing=true";
    };
}
dhtmlxError.catchError("LoadXML",function(a,b,c){
    if (c[0].status != 0) {
        alert(c[0].responseText);
    }
});

window.dhtmlXScheduler = window.scheduler = { version: "4.0.1" };
dhtmlxEventable(scheduler);

scheduler.init=function(id,date,mode){
    date=date||(scheduler._currentDate());
    mode=mode||"week";

    //hook for terrace skin
    if (this._skin_init)
        scheduler._skin_init();

    scheduler.date.init();

    this._obj=(typeof id == "string")?document.getElementById(id):id;
    this._els=[];
    this._scroll=true;
    this._quirks=(_isIE && document.compatMode == "BackCompat");
    this._quirks7=(_isIE && navigator.appVersion.indexOf("MSIE 8")==-1);

    this.get_elements();
    this.init_templates();
    this.set_actions();

    (function(){
        var oldSize = getWindowSize();
        dhtmlxEvent(window,"resize",function(){
            var newSize = getWindowSize();

            // ie7-8 triggers "resize" when window's elements are resized, it messes container-autoresize extension
            // check if it's actually resized
            if(!equals(oldSize, newSize)){
                window.clearTimeout(scheduler._resize_timer);
                scheduler._resize_timer=window.setTimeout(function(){
                    if (scheduler.callEvent("onSchedulerResize",[]))  {
                        scheduler.update_view();
                        scheduler.callEvent("onAfterSchedulerResize", []);
                    }
                }, 100);
            }
            oldSize = newSize;

        });
        function getWindowSize(){
            return {
                w : window.innerWidth || document.documentElement.clientWidth,
                h : window.innerHeight || document.documentElement.clientHeight
            };
        }
        function equals(a,b){
            return a.w == b.w && a.h == b.h;
        }
    })();
    this._init_touch_events();
    this.set_sizes();
    scheduler.callEvent('onSchedulerReady', []);
    this.setCurrentView(date,mode);
};

scheduler.xy={
    min_event_height:40,
    scale_width:50,
    scroll_width:18,
    scale_height:20,
    month_scale_height:20,
    menu_width:25,
    margin_top:0,
    margin_left:0,
    editor_width:140
};
scheduler.keys={
    edit_save:13,
    edit_cancel:27
};
scheduler.set_sizes=function(){
    var w = this._x = this._obj.clientWidth-this.xy.margin_left;
    var h = this._y = this._obj.clientHeight-this.xy.margin_top;

    //not-table mode always has scroll - need to be fixed in future
    var scale_x=this._table_view?0:(this.xy.scale_width+this.xy.scroll_width);
    var scale_s=this._table_view?-1:this.xy.scale_width;

    this.set_xy(this._els["dhx_cal_navline"][0],w,this.xy.nav_height,0,0);
    this.set_xy(this._els["dhx_cal_header"][0],w-scale_x,this.xy.scale_height,scale_s,this.xy.nav_height+(this._quirks?-1:1));
    //to support alter-skin, we need a way to alter height directly from css
    var actual_height = this._els["dhx_cal_navline"][0].offsetHeight;
    if (actual_height > 0) this.xy.nav_height = actual_height;

    var data_y=this.xy.scale_height+this.xy.nav_height+(this._quirks?-2:0);
    this.set_xy(this._els["dhx_cal_data"][0],w,h-(data_y+2),0,data_y+2);
};
scheduler.set_xy=function(node,w,h,x,y){
    node.style.width=Math.max(0,w)+"px";
    node.style.height=Math.max(0,h)+"px";
    if (arguments.length>3){
        node.style.left=x+"px";
        node.style.top=y+"px";
    }
};
scheduler.get_elements=function(){
    //get all child elements as named hash
    var els=this._obj.getElementsByTagName("DIV");
    for (var i=0; i < els.length; i++){
        var name=els[i].className;
        if (name) name = name.split(" ")[0];
        if (!this._els[name]) this._els[name]=[];
        this._els[name].push(els[i]);

        //check if name need to be changed
        var t=scheduler.locale.labels[els[i].getAttribute("name")||name];
        if (t) els[i].innerHTML=t;
    }
};
scheduler.set_actions=function(){
    for (var a in this._els)
        if (this._click[a])
            for (var i=0; i < this._els[a].length; i++)
                this._els[a][i].onclick=scheduler._click[a];
    this._obj.onselectstart=function(e){ return false; };
    this._obj.onmousemove=function(e){
        if (!scheduler._temp_touch_block)
            scheduler._on_mouse_move(e||event);
    };
    this._obj.onmousedown=function(e){
        if (!scheduler._ignore_next_click)
            scheduler._on_mouse_down(e||event);
    };
    this._obj.onmouseup=function(e){
        if (!scheduler._ignore_next_click)
            scheduler._on_mouse_up(e||event);
    };
    this._obj.ondblclick=function(e){
        scheduler._on_dbl_click(e||event);
    };
    this._obj.oncontextmenu = function(e) {
        var ev = e||event;
        var src = ev.target||ev.srcElement;
        var returnValue = scheduler.callEvent("onContextMenu", [scheduler._locate_event(src), ev]);
        return returnValue;
    };
};
scheduler.select=function(id){
    if (this._select_id==id) return;
    this.editStop(false);
    this.unselect();
    this._select_id = id;
    this.updateEvent(id);
};
scheduler.unselect=function(id){
    if (id && id!=this._select_id) return;
    var t=this._select_id;
    this._select_id = null;
    if (t) this.updateEvent(t);
};
scheduler.getState=function(){
    return {
        mode: this._mode,
        date: this._date,
        min_date: this._min_date,
        max_date: this._max_date,
        editor_id: this._edit_id,
        lightbox_id: this._lightbox_id,
        new_event: this._new_event,
        select_id: this._select_id,
        expanded: this.expanded,
        drag_id: this._drag_id,
        drag_mode: this._drag_mode
    };
};
scheduler._click={
    dhx_cal_data:function(e){
        //in case of touch disable click processing
        if (scheduler._ignore_next_click){
            if (e.preventDefault)
                e.preventDefault();
            e.cancelBubble = true;
            return scheduler._ignore_next_click = false;
        }

        var trg = e?e.target:event.srcElement;
        var id = scheduler._locate_event(trg);

        e = e || event;

        if (!id) {
            scheduler.callEvent("onEmptyClick",[scheduler.getActionData(e).date, e]);
        } else {
            if ( !scheduler.callEvent("onClick",[id,e]) || scheduler.config.readonly ) return;
        }

        if (id && scheduler.config.select) {

            scheduler.select(id);
            var mask = trg.className;
            if (mask.indexOf("_icon")!=-1)
                scheduler._click.buttons[mask.split(" ")[1].replace("icon_","")](id);
        } else
            scheduler._close_not_saved();
    },
    dhx_cal_prev_button:function(){
        scheduler._click.dhx_cal_next_button(0,-1);
    },
    dhx_cal_next_button:function(dummy,step){
        scheduler.setCurrentView(scheduler.date.add( //next line changes scheduler._date , but seems it has not side-effects
            scheduler.date[scheduler._mode+"_start"](scheduler._date),(step||1),scheduler._mode));
    },
    dhx_cal_today_button:function(){
        if (scheduler.callEvent("onBeforeTodayDisplayed", [])) {
            scheduler.setCurrentView(scheduler._currentDate());
        }
    },
    dhx_cal_tab:function(){
        var name = this.getAttribute("name");
        var mode = name.substring(0, name.search("_tab"));
        scheduler.setCurrentView(scheduler._date,mode);
    },
    buttons:{
        "delete":function(id){
            var c = scheduler.locale.labels.confirm_deleting;
            scheduler._dhtmlx_confirm(c, scheduler.locale.labels.title_confirm_deleting, function(){ scheduler.deleteEvent(id) });
        },
        edit:function(id){ scheduler.edit(id); },
        save:function(id){ scheduler.editStop(true); },
        details:function(id){ scheduler.showLightbox(id); },
        cancel:function(id){ scheduler.editStop(false); }
    }
};
scheduler._dhtmlx_confirm = function(message, title, callback) {
    if (!message)
        return callback();
    var opts = { text: message };
    if (title)
        opts.title = title;
    if (callback) {
        opts.callback = function(result) {
            if (result)
                callback();
        };
    }
    dhtmlx.confirm(opts);
};
scheduler.addEventNow=function(start,end,e){
    var base = {};
    if (start && start.constructor.toString().match(/object/i) !== null){
        base = start;
        start = null;
    }

    var d = (this.config.event_duration||this.config.time_step +45)*60000;
    if (!start) start = base.start_date||Math.round((scheduler._currentDate()).valueOf()/d)*d;
    var start_date = new Date(start);
    if (!end){
        var start_hour = this.config.first_hour + 8;
        if (start_hour > start_date.getHours()){
            start_date.setHours(start_hour);
            start = start_date.valueOf();
        }
        end = start.valueOf()+d;
    }
    var end_date = new Date(end);

    // scheduler.addEventNow(new Date(), new Date()) + collision though get_visible events defect (such event was not retrieved)
    if(start_date.valueOf() == end_date.valueOf())
        end_date.setTime(end_date.valueOf()+d);

    base.start_date = base.start_date||start_date;
    base.end_date =  base.end_date||end_date;
    base.text = base.text||this.locale.labels.new_event;
    base.id = this._drag_id = this.uid();
    this._drag_mode="new-size";

    this._loading=true;
    this.addEvent(base);
    this.callEvent("onEventCreated",[this._drag_id,e]);
    this._loading=false;

    this._drag_event={}; //dummy , to trigger correct event updating logic
    this._on_mouse_up(e);
};
scheduler._on_dbl_click=function(e,src){
    src = src||(e.target||e.srcElement);
    if (this.config.readonly || !src.className) return;
    var name = src.className.split(" ")[0];
    switch(name){
        case "dhx_scale_holder":
        case "dhx_scale_holder_now":
        case "dhx_month_body":
        case "dhx_wa_day_data":
        case "dhx_marked_timespan":
            if (!scheduler.config.dblclick_create) break;
            this.addEventNow(this.getActionData(e).date,null,e);
            break;
        case "dhx_cal_event":
        case "dhx_wa_ev_body":
        case "dhx_agenda_line":
        case "dhx_grid_event":
        case "dhx_cal_event_line":
        case "dhx_cal_event_clear":
            var id = this._locate_event(src);
            if (!this.callEvent("onDblClick",[id,e])) return;
            if (this.config.details_on_dblclick || this._table_view || !this.getEvent(id)._timed || !this.config.select)
                this.showLightbox(id);
            else
                this.edit(id);
            break;
        case "dhx_time_block":
        case "dhx_cal_container":
            return;
            break;
        default:
            var t = this["dblclick_"+name];
            if (t) {
                t.call(this,e);
            }
            else {
                if (src.parentNode && src != this)
                    return scheduler._on_dbl_click(e,src.parentNode);
            }
            break;
    }
};

scheduler._mouse_coords=function(ev){
    var pos;
    var b=document.body;
    var d = document.documentElement;
    if (!_isIE && (ev.pageX || ev.pageY))
        pos={x:ev.pageX, y:ev.pageY};
    else pos={
        x:ev.clientX + (b.scrollLeft||d.scrollLeft||0) - b.clientLeft,
        y:ev.clientY + (b.scrollTop||d.scrollTop||0) - b.clientTop
    };

    //apply layout
    pos.x-=getAbsoluteLeft(this._obj)+(this._table_view?0:this.xy.scale_width);
    pos.y-=getAbsoluteTop(this._obj)+this.xy.nav_height+(this._dy_shift||0)+this.xy.scale_height-this._els["dhx_cal_data"][0].scrollTop;
    pos.ev = ev;

    var handler = this["mouse_"+this._mode];
    if (handler)
        return handler.call(this,pos);

    if (this._cols){
        var column = pos.x / this._cols[0];
        if (this._ignores)
            for (var i=0; i<=column; i++)
                if (this._ignores[i])
                    column++;
    }

    //transform to date
    if (!this._table_view) {
        //"get position" can be invoked before columns are loaded into the units view(e.g. by onMouseMove handler in key_nav.js)
        if(!this._cols)  return pos;
        pos.x=Math.min(this._cols.length-1, Math.max(0,Math.ceil(column)-1));

        pos.y=Math.max(0,Math.ceil(pos.y*60/(this.config.time_step*this.config.hour_size_px))-1)+this.config.first_hour*(60/this.config.time_step);
    } else {
        if (!this._cols || !this._colsS) // agenda/map views
            return pos;
        var dy=0;
        for (dy=1; dy < this._colsS.heights.length; dy++)
            if (this._colsS.heights[dy]>pos.y) break;

        pos.y=Math.ceil( (Math.max(0, column)+Math.max(0,dy-1)*7)*24*60/this.config.time_step );

        if (scheduler._drag_mode || this._mode == "month")
            pos.y=(Math.max(0,Math.ceil(column)-1)+Math.max(0,dy-1)*7)*24*60/this.config.time_step;

        //we care about ignored days only during event moving in month view
        if (this._drag_mode == "move"){
            if (scheduler._ignores_detected && scheduler.config.preserve_length){
                pos._ignores = true;
                //get real lengtn of event
                if (!this._drag_event._event_length)
                    this._drag_event._event_length = this._get_real_event_length(this._drag_event.start_date, this._drag_event.end_date, { x_step:1, x_unit:"day"});
            }
        }

        pos.x=0;
    }
    return pos;
};
scheduler._close_not_saved=function(){
    if (new Date().valueOf()-(scheduler._new_event||0) > 500 && scheduler._edit_id){
        var c=scheduler.locale.labels.confirm_closing;

        scheduler._dhtmlx_confirm(c, scheduler.locale.labels.title_confirm_closing, function() { scheduler.editStop(scheduler.config.positive_closing); });
    }
};
scheduler._correct_shift=function(start, back){
    return start-=((new Date(scheduler._min_date)).getTimezoneOffset()-(new Date(start)).getTimezoneOffset())*60000*(back?-1:1);
};
scheduler._on_mouse_move=function(e){
    if (this._drag_mode){
        var pos=this._mouse_coords(e);
        if (!this._drag_pos || pos.force_redraw || this._drag_pos.x!=pos.x || this._drag_pos.y!=pos.y ){
            var start, end;
            if (this._edit_id!=this._drag_id)
                this._close_not_saved();

            this._drag_pos=pos;

            if (this._drag_mode=="create"){
                this._close_not_saved();
                this._loading=true; //will be ignored by dataprocessor

                start = this._get_date_from_pos(pos).valueOf();

                if (!this._drag_start) {
                    var res = this.callEvent("onBeforeEventCreated", [e, this._drag_id]);
                    if (!res)
                        return;


                    this._drag_start=start;
                    return;
                }

                end = start;
                if (end == this._drag_start) {
                }

                var start_date = new Date(this._drag_start);
                var end_date = new Date(end);
                if ( (this._mode == "day" || this._mode == "week")
                    && (start_date.getHours() == end_date.getHours() && start_date.getMinutes() == end_date.getMinutes()) ) {
                    end_date = new Date(this._drag_start+1000);
                }


                this._drag_id=this.uid();
                this.addEvent(start_date, end_date, this.locale.labels.new_event, this._drag_id, pos.fields);

                this.callEvent("onEventCreated",[this._drag_id,e]);
                this._loading=false;
                this._drag_mode="new-size";

            }

            var ev=this.getEvent(this._drag_id);

            if (this._drag_mode=="move"){
                start = this._min_date.valueOf()+(pos.y*this.config.time_step+pos.x*24*60 -(scheduler._move_pos_shift||0) )*60000;
                if (!pos.custom && this._table_view) start+=this.date.time_part(ev.start_date)*1000;
                start = this._correct_shift(start);

                if (pos._ignores && this.config.preserve_length && this._table_view){
                    if (this.matrix)
                        var obj = this.matrix[this._mode];
                    obj = obj  || { x_step:1, x_unit:"day" };
                    end = start*1 + this._get_fictional_event_length(start, this._drag_event._event_length, obj);
                } else
                    end = ev.end_date.valueOf()-(ev.start_date.valueOf()-start);
            } else { // resize
                start = ev.start_date.valueOf();
                end = ev.end_date.valueOf();
                if (this._table_view) {
                    var resize_date = this._min_date.valueOf()+pos.y*this.config.time_step*60000 + (pos.custom?0:24*60*60000);
                    if (this._mode == "month")
                        resize_date = this._correct_shift(resize_date, false);

                    if (pos.resize_from_start)
                        start = resize_date;
                    else
                        end = resize_date;
                } else {
                    end = this.date.date_part(new Date(ev.end_date)).valueOf()+pos.y*this.config.time_step*60000;
                    this._els["dhx_cal_data"][0].style.cursor="s-resize";
                    if (this._mode == "week" || this._mode == "day")
                        end = this._correct_shift(end);
                }
                if (this._drag_mode == "new-size") {
                    if (end <= this._drag_start){
                        var shift = pos.shift||((this._table_view && !pos.custom)?24*60*60000:0);
                        start = end-(pos.shift?0:shift);
                        end = this._drag_start+(shift||(this.config.time_step*60000));
                    } else {
                        start = this._drag_start;
                    }
                } else {
                    if (end<=start)
                        end=start+this.config.time_step*60000;
                }
            }
            var new_end = new Date(end-1);
            var new_start = new Date(start);
            //prevent out-of-borders situation for day|week view
            if ( this._table_view || (new_end.getDate()==new_start.getDate() && new_end.getHours()<this.config.last_hour) || scheduler._allow_dnd ){
                ev.start_date=new_start;
                ev.end_date=new Date(end);
                if (this.config.update_render){
                    //fix for repaint after dnd and scroll issue, #231
                    var sx = scheduler._els["dhx_cal_data"][0].scrollTop;
                    this.update_view();
                    scheduler._els["dhx_cal_data"][0].scrollTop = sx;
                } else
                    this.updateEvent(this._drag_id);
            }
            if (this._table_view) {
                this.for_rendered(this._drag_id,function(r){
                    r.className+=" dhx_in_move";
                });
            }
        }
    }  else {
        if (scheduler.checkEvent("onMouseMove")){
            var id = this._locate_event(e.target||e.srcElement);
            this.callEvent("onMouseMove",[id,e]);
        }
    }
};
scheduler._on_mouse_down=function(e,src) {
    // on Mac we do not get onmouseup event when clicking right mouse button leaving us in dnd state
    // let's ignore right mouse button then
    if (e.button == 2)
        return;

    if (this.config.readonly || this._drag_mode) return;
    src = src||(e.target||e.srcElement);
    var classname = src.className && src.className.split(" ")[0];

    switch (classname) {
        case "dhx_cal_event_line":
        case "dhx_cal_event_clear":
            if (this._table_view)
                this._drag_mode="move"; //item in table mode
            break;
        case "dhx_event_move":
        case "dhx_wa_ev_body":
            this._drag_mode="move";
            break;
        case "dhx_event_resize":
            this._drag_mode="resize";
            break;
        case "dhx_scale_holder":
        case "dhx_scale_holder_now":
        case "dhx_month_body":
        case "dhx_matrix_cell":
        case "dhx_marked_timespan":
            this._drag_mode="create";
            this.unselect(this._select_id);
            break;
        case "":
            if (src.parentNode)
                return scheduler._on_mouse_down(e,src.parentNode);
        default:
            if (scheduler.checkEvent("onMouseDown") && scheduler.callEvent("onMouseDown", [classname])) {
                if (src.parentNode && src != this) {
                    return scheduler._on_mouse_down(e,src.parentNode);
                }
            }
            this._drag_mode=null;
            this._drag_id=null;
            break;
    }
    if (this._drag_mode){
        var id = this._locate_event(src);
        if (!this.config["drag_"+this._drag_mode] || !this.callEvent("onBeforeDrag",[id, this._drag_mode, e]))
            this._drag_mode=this._drag_id=0;
        else {
            this._drag_id= id;
            this._drag_event = scheduler._lame_clone(this.getEvent(this._drag_id) || {});
        }
    }
    this._drag_start=null;
};
scheduler._on_mouse_up=function(e){
    if (e && e.button == 2 && scheduler.config.touch) return;
    if (this._drag_mode && this._drag_id){
        this._els["dhx_cal_data"][0].style.cursor="default";
        //drop
        var ev=this.getEvent(this._drag_id);
        if (this._drag_event._dhx_changed || !this._drag_event.start_date || ev.start_date.valueOf()!=this._drag_event.start_date.valueOf() || ev.end_date.valueOf()!=this._drag_event.end_date.valueOf()){
            var is_new=(this._drag_mode=="new-size");
            if (!this.callEvent("onBeforeEventChanged",[ev, e, is_new, this._drag_event])){
                if (is_new)
                    this.deleteEvent(ev.id, true);
                else {
                    this._drag_event._dhx_changed = false;
                    scheduler._lame_copy(ev, this._drag_event);
                    this.updateEvent(ev.id);
                }
            } else {
                var drag_id = this._drag_id;
                this._drag_id = this._drag_mode = null;
                if (is_new && this.config.edit_on_create){
                    this.unselect();
                    this._new_event=new Date();//timestamp of creation
                    //if selection disabled - force lightbox usage
                    if (this._table_view || this.config.details_on_create || !this.config.select) {
                        return this.showLightbox(drag_id);
                    }
                    this._drag_pos = true; //set flag to trigger full redraw
                    this._select_id = this._edit_id = drag_id;
                } else {
                    if (!this._new_event)
                        this.callEvent(is_new?"onEventAdded":"onEventChanged",[drag_id,this.getEvent(drag_id)]);
                }
            }
        }
        if (this._drag_pos) this.render_view_data(); //redraw even if there is no real changes - necessary for correct positioning item after drag
    }
    this._drag_id = null;
    this._drag_mode=null;
    this._drag_pos=null;
};
scheduler.update_view=function(){
    this._reset_scale();
    if (this._load_mode && this._load()) return this._render_wait = true;
    this.render_view_data();
};

scheduler.isViewExists = function(mode){
    return !!(scheduler[mode+ "_view"] ||
        (scheduler.date[mode+ "_start"] && scheduler.templates[mode+ "_date"] && scheduler.templates[mode+ "_scale_date"]));
};

scheduler.updateView = function(date, mode) {
    date = date || this._date;
    mode = mode || this._mode;
    var dhx_cal_data = 'dhx_cal_data';

    if (!this._mode)
        this._obj.className += " dhx_scheduler_" + mode; else {
        this._obj.className = this._obj.className.replace("dhx_scheduler_" + this._mode, "dhx_scheduler_" + mode);
    }

    var prev_scroll = (this._mode == mode && this.config.preserve_scroll) ? this._els[dhx_cal_data][0].scrollTop : false; // saving current scroll

    //hide old custom view
    if (this[this._mode + "_view"] && mode && this._mode != mode)
        this[this._mode + "_view"](false);

    this._close_not_saved();

    var dhx_multi_day = 'dhx_multi_day';
    if (this._els[dhx_multi_day]) {
        this._els[dhx_multi_day][0].parentNode.removeChild(this._els[dhx_multi_day][0]);
        this._els[dhx_multi_day] = null;
    }

    this._mode = mode;
    this._date = date;
    this._table_view = (this._mode == "month");

    var tabs = this._els["dhx_cal_tab"];
    if(tabs){//calendar can work without view tabs
        for (var i = 0; i < tabs.length; i++) {
            var name = tabs[i].className;
            name = name.replace(/ active/g, "");
            if (tabs[i].getAttribute("name") == this._mode + "_tab"){
                name = name + " active";
            }
            tabs[i].className = name;
        }
    }
    //show new view
    var view = this[this._mode + "_view"];
    view ? view(true) : this.update_view();

    if (typeof prev_scroll == "number") // if we are updating or working with the same view scrollTop should be saved
        this._els[dhx_cal_data][0].scrollTop = prev_scroll; // restoring original scroll
};
scheduler.setCurrentView = function(date, mode) {
    if (!this.callEvent("onBeforeViewChange", [this._mode, this._date, mode || this._mode, date || this._date])) return;
    this.updateView(date, mode);
    this.callEvent("onViewChange", [this._mode, this._date]);
};
scheduler._render_x_header = function(i,left,d,h){
    //header scale	
    var head=document.createElement("DIV");
    head.className = "dhx_scale_bar";

    if(this.templates[this._mode+"_scalex_class"]){
        //'_scalex_class' - timeline already have similar template, use the same name
        head.className += ' ' + this.templates[this._mode+"_scalex_class"](d);
    }

    var width = this._cols[i]-1;

    if (this._mode == "month" && i === 0 && this.config.left_border) {
        head.className += " dhx_scale_bar_border";
        left = left+1;
    }
    this.set_xy(head, width, this.xy.scale_height-2, left, 0);//-1 for border
    head.innerHTML=this.templates[this._mode+"_scale_date"](d,this._mode); //TODO - move in separate method
    h.appendChild(head);
};
scheduler._reset_scale=function(){
    //current mode doesn't support scales
    //we mustn't call reset_scale for such modes, so it just to be sure
    if (!this.templates[this._mode + "_date"]) return;

    var h = this._els["dhx_cal_header"][0];
    var b = this._els["dhx_cal_data"][0];
    var c = this.config;

    h.innerHTML = "";
    b.scrollTop = 0; //fix flickering in FF
    b.innerHTML = "";

    var str = ((c.readonly || (!c.drag_resize)) ? " dhx_resize_denied" : "") + ((c.readonly || (!c.drag_move)) ? " dhx_move_denied" : "");
    if (str) b.className = "dhx_cal_data" + str;

    this._scales = {};
    this._cols = [];	//store for data section
    this._colsS = {height: 0};
    this._dy_shift = 0;

    this.set_sizes();
    var summ=parseInt(h.style.width,10); //border delta
    var left=0;

    var d,dd,sd,today;
    dd=this.date[this._mode+"_start"](new Date(this._date.valueOf()));
    d=sd=this._table_view?scheduler.date.week_start(dd):dd;
    today=this.date.date_part( scheduler._currentDate());

    //reset date in header
    var ed=scheduler.date.add(dd,1,this._mode);
    var count = 7;

    if (!this._table_view){
        var count_n = this.date["get_"+this._mode+"_end"];
        if (count_n) ed = count_n(dd);
        count = Math.round((ed.valueOf()-dd.valueOf())/(1000*60*60*24));
    }

    this._min_date=d;
    this._els["dhx_cal_date"][0].innerHTML=this.templates[this._mode+"_date"](dd,ed,this._mode);


    this._process_ignores(sd, count, "day", 1);
    var realcount = count - this._ignores_detected;

    for (var i=0; i<count; i++){
        if (this._ignores[i]){
            this._cols[i] = 0;
            realcount++;
        } else {
            this._cols[i]=Math.floor(summ/(realcount-i));
            this._render_x_header(i,left,d,h);
        }
        if (!this._table_view){
            var scales=document.createElement("DIV");
            var cls = "dhx_scale_holder";
            if (d.valueOf()==today.valueOf()) cls = "dhx_scale_holder_now";
            scales.className=cls+" "+this.templates.week_date_class(d,today);
            this.set_xy(scales,this._cols[i]-1,c.hour_size_px*(c.last_hour-c.first_hour),left+this.xy.scale_width+1,0);//-1 for border
            b.appendChild(scales);
            this.callEvent("onScaleAdd",[scales, d]);
        }

        d=this.date.add(d,1,"day");
        summ-=this._cols[i];
        left+=this._cols[i];
        this._colsS[i]=(this._cols[i-1]||0)+(this._colsS[i-1]||(this._table_view?0:this.xy.scale_width+2));
        this._colsS['col_length'] = count+1;
    }

    this._max_date=d;
    this._colsS[count]=this._cols[count-1]+this._colsS[count-1];

    if (this._table_view) // month view
        this._reset_month_scale(b,dd,sd);
    else{
        this._reset_hours_scale(b,dd,sd);
        if (c.multi_day) {
            var dhx_multi_day = 'dhx_multi_day';

            if(this._els[dhx_multi_day]) {
                this._els[dhx_multi_day][0].parentNode.removeChild(this._els[dhx_multi_day][0]);
                this._els[dhx_multi_day] = null;
            }

            var navline = this._els["dhx_cal_navline"][0];
            var top = navline.offsetHeight + this._els["dhx_cal_header"][0].offsetHeight+1;

            var c1 = document.createElement("DIV");
            c1.className = dhx_multi_day;
            c1.style.visibility="hidden";
//            c1.innerHTML = 'All day';
            this.set_xy(c1, this._colsS[this._colsS.col_length-1]+this.xy.scroll_width, 0, 0, top); // 2 extra borders, dhx_header has -1 bottom margin
            b.parentNode.insertBefore(c1,b);

            var c2 = c1.cloneNode(true);
            c2.className = dhx_multi_day+"_icon";
            c2.style.visibility="hidden";
            this.set_xy(c2, this.xy.scale_width, 0, 0, top); // dhx_header has -1 bottom margin

            c1.appendChild(c2);
            this._els[dhx_multi_day]=[c1,c2];
            this._els[dhx_multi_day][0].onclick = this._click.dhx_cal_data;
        }
    }
};
scheduler._reset_hours_scale=function(b,dd,sd){
    var c=document.createElement("DIV");
    c.className="dhx_scale_holder";

    var date = new Date(1980,1,1,this.config.first_hour,0,0);
    for (var i=this.config.first_hour*1; i < this.config.last_hour; i++) {
        var cc=document.createElement("DIV");
        cc.className="dhx_scale_hour";
        cc.style.height=this.config.hour_size_px-(this._quirks?0:0)+"px";
        var width = this.xy.scale_width;
        if (this.config.left_border) {
            width = width - 1;
            cc.className += " dhx_scale_hour_border";
        }
        cc.style.width = width + "px";
        cc.innerHTML=scheduler.templates.hour_scale(date);

        c.appendChild(cc);
        date=this.date.add(date,1,"hour");
    }
    b.appendChild(c);
    if (this.config.scroll_hour)
        b.scrollTop = this.config.hour_size_px*(this.config.scroll_hour-this.config.first_hour);
};

scheduler._currentDate = function(){
    if(scheduler.config.now_date){
        return new Date(scheduler.config.now_date);
    }
    return new Date();
};

scheduler._process_ignores = function(sd, n, mode, step, preserve){
    this._ignores=[];
    this._ignores_detected = 0;
    var ignore = scheduler["ignore_"+this._mode];

    if (ignore){
        var ign_date = new Date(sd);
        for (var i=0; i<n; i++){
            if (ignore(ign_date)){
                this._ignores_detected += 1;
                this._ignores[i] = true;
                if (preserve)
                    n++;
            }
            ign_date = scheduler.date.add(ign_date, step, mode);
        }
    }
};

scheduler._reset_month_scale=function(b,dd,sd){
    var ed=scheduler.date.add(dd,1,"month");

    //trim time part for comparation reasons
    var cd = scheduler._currentDate();
    this.date.date_part(cd);
    this.date.date_part(sd);

    var rows=Math.ceil(Math.round((ed.valueOf()-sd.valueOf()) / (60*60*24*1000) ) / 7);
    var tdcss=[];
    var height=(Math.floor(b.clientHeight/rows)-22);

    this._colsS.height=height+22;



    var h = this._colsS.heights = [];
    for (var i=0; i<=7; i++) {
        var cell_width = ((this._cols[i]||0));
        if (i === 0 && this.config.left_border) {
            cell_width = cell_width - 1;
        }
        tdcss[i]=" style='height:"+height+"px; width:"+cell_width+"px;' ";
    }



    var cellheight = 0;
    this._min_date=sd;
    var html="<table cellpadding='0' cellspacing='0'>";
    var rendered_dates = [];
    for (var i=0; i<rows; i++){
        html+="<tr>";

        for (var j=0; j<7; j++) {
            html+="<td";

            var cls = "";
            if (sd<dd)
                cls='dhx_before';
            else if (sd>=ed)
                cls='dhx_after';
            else if (sd.valueOf()==cd.valueOf())
                cls='dhx_now';
            html+=" class='"+cls+" "+this.templates.month_date_class(sd,cd)+"' >";
            var body_class = "dhx_month_body";
            var head_class = "dhx_month_head";
            if (j === 0 && this.config.left_border) {
                body_class += " dhx_month_body_border";
                head_class += " dhx_month_head_border";
            }
            if (!this._ignores_detected || !this._ignores[j]){
                html+="<div class='"+head_class+"'>"+this.templates.month_day(sd)+"</div>";
                html+="<div class='"+body_class+"' "+tdcss[j]+"></div></td>";
            } else {
                html+="<div></div><div></div>";
            }
            rendered_dates.push(sd);
            sd=this.date.add(sd,1,"day");
        }
        html+="</tr>";
        h[i] = cellheight;
        cellheight+=this._colsS.height;
    }
    html+="</table>";
    this._max_date=sd;

    b.innerHTML=html;

    this._scales = {};
    var divs = b.getElementsByTagName('div');
    for (var i=0; i<rendered_dates.length; i++) { // [header, body, header, body, ...]
        var div = divs[(i*2)+1];
        var date = rendered_dates[i];
        this._scales[+date] = div;
    }
    for (var i=0; i<rendered_dates.length; i++) {
        var date = rendered_dates[i];
        this.callEvent("onScaleAdd", [this._scales[+date], date]);
    }

    return sd;
};
scheduler.getLabel = function(property, key) {
    var sections = this.config.lightbox.sections;
    for (var i=0; i<sections.length; i++) {
        if(sections[i].map_to == property) {
            var options = sections[i].options;
            for (var j=0; j<options.length; j++) {
                if(options[j].key == key) {
                    return options[j].label;
                }
            }
        }
    }
    return "";
};
scheduler.updateCollection = function(list_name, collection) {
    var list = scheduler.serverList(list_name);
    if (!list) return false;
    list.splice(0, list.length);
    list.push.apply(list, collection || []);
    scheduler.callEvent("onOptionsLoad", []);
    scheduler.resetLightbox();
    return true;
};
scheduler._lame_clone = function(object, cache) {
    var i, t, result; // iterator, types array, result

    cache = cache || [];

    for (i=0; i<cache.length; i+=2)
        if(object === cache[i])
            return cache[i+1];

    if (object && typeof object == "object") {
        result = {};
        t = [Array,Date,Number,String,Boolean];
        for (i=0; i<t.length; i++) {
            if (object instanceof t[i])
                result = i ? new t[i](object) : new t[i](); // first one is array
        }
        cache.push(object, result);
        for (i in object) {
            if (Object.prototype.hasOwnProperty.apply(object, [i]))
                result[i] = scheduler._lame_clone(object[i], cache)
        }
    }
    return result || object;
};
scheduler._lame_copy = function(target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
    return target;
};
scheduler._get_date_from_pos = function(pos) {
    var start=this._min_date.valueOf()+(pos.y*this.config.time_step+(this._table_view?0:pos.x)*24*60)*60000;
    return new Date(this._correct_shift(start));
};
// n_ev - native event
scheduler.getActionData = function(n_ev) {
    var pos = this._mouse_coords(n_ev);
    return {
        date:this._get_date_from_pos(pos),
        section:pos.section
    };
};
scheduler._focus = function(node, select){
    if (node && node.focus){
        if (this.config.touch){
            window.setTimeout(function(){
                node.focus();
            },100);
        } else {
            if (select && node.select) node.select();
            node.focus();
        }
    }
}

//non-linear scales
scheduler._get_real_event_length=function(sd, fd, obj){
    var ev_length = fd -sd;
    var hours = (obj._start_correction + obj._end_correction)||0;
    var ignore = this["ignore_"+this._mode];

    var start_slot = 0;
    if (obj.render){
        start_slot = this._get_date_index(obj, sd);
        var end_slot = this._get_date_index(obj, fd);
    } else{
        var end_slot = Math.round(ev_length/60/60/1000/24);
    }

    while (start_slot < end_slot){
        var check = scheduler.date.add(fd, -obj.x_step, obj.x_unit);
        if (ignore && ignore(fd))
            ev_length -= (fd-check);
        else
            ev_length -= hours;

        fd = check;
        end_slot--;
    }
    return ev_length;
};
scheduler._get_fictional_event_length=function(end_date, ev_length, obj, back){
    var sd = new Date(end_date);
    var dir = back ? -1 : 1;

    //get difference caused by first|last hour
    if (obj._start_correction || obj._end_correction){
        if (back)
            var today = (sd.getHours()*60+sd.getMinutes()) - (obj.first_hour||0)*60;
        else
            var today = (obj.last_hour||0)*60 - (sd.getHours()*60+sd.getMinutes());
        var per_day = (obj.last_hour - obj.first_hour)*60;
        var days = Math.ceil( (ev_length / (60*1000) - today ) / per_day);
        ev_length += days * (24*60 - per_day) * 60 * 1000;
    }

    var fd = new Date(end_date*1+ev_length*dir);
    var ignore = this["ignore_"+this._mode];

    var start_slot = 0;
    if (obj.render){
        start_slot = this._get_date_index(obj, sd);
        var end_slot = this._get_date_index(obj, fd);
    } else{
        var end_slot = Math.round(ev_length/60/60/1000/24);
    }

    while (start_slot*dir <= end_slot*dir){
        var check = scheduler.date.add(sd, obj.x_step*dir, obj.x_unit);
        if (ignore && ignore(sd)){
            ev_length += (check-sd)*dir;
            end_slot += dir;
        }

        sd = check;
        start_slot+=dir;
    }

    return ev_length;
};

scheduler.date={
    init:function(){
        var s = scheduler.locale.date.month_short;
        var t = scheduler.locale.date.month_short_hash = {};
        for (var i = 0; i < s.length; i++)
            t[s[i]]=i;

        var s = scheduler.locale.date.month_full;
        var t = scheduler.locale.date.month_full_hash = {};
        for (var i = 0; i < s.length; i++)
            t[s[i]]=i;
    },
    date_part:function(date){
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        if (date.getHours() != 0)
            date.setTime(date.getTime() + 60 * 60 * 1000 * (24 - date.getHours()));
        return date;
    },
    time_part:function(date){
        return (date.valueOf()/1000 - date.getTimezoneOffset()*60)%86400;
    },
    week_start:function(date){
        var shift=date.getDay();
        if (scheduler.config.start_on_monday){
            if (shift===0) shift=6;
            else shift--;
        }
        return this.date_part(this.add(date,-1*shift,"day"));
    },
    month_start:function(date){
        date.setDate(1);
        return this.date_part(date);
    },
    year_start:function(date){
        date.setMonth(0);
        return this.month_start(date);
    },
    day_start:function(date){
        return this.date_part(date);
    },
    add:function(date,inc,mode){
        var ndate=new Date(date.valueOf());
        switch(mode){
            case "week":
                inc *= 7;
            case "day":
                ndate.setDate(ndate.getDate() + inc);
                if (!date.getHours() && ndate.getHours()) //shift to yesterday
                    ndate.setTime(ndate.getTime() + 60 * 60 * 1000 * (24 - ndate.getHours()));
                break;
            case "month": ndate.setMonth(ndate.getMonth()+inc); break;
            case "year": ndate.setYear(ndate.getFullYear()+inc); break;
            case "hour": ndate.setHours(ndate.getHours()+inc); break;
            case "minute": ndate.setMinutes(ndate.getMinutes()+inc); break;
            default:
                return scheduler.date["add_"+mode](date,inc,mode);
        }
        return ndate;
    },
    to_fixed:function(num){
        if (num<10)	return "0"+num;
        return num;
    },
    copy:function(date){
        return new Date(date.valueOf());
    },
    date_to_str:function(format,utc){
        format=format.replace(/%[a-zA-Z]/g,function(a){
            switch(a){
                case "%d": return "\"+scheduler.date.to_fixed(date.getDate())+\"";
                case "%m": return "\"+scheduler.date.to_fixed((date.getMonth()+1))+\"";
                case "%j": return "\"+date.getDate()+\"";
                case "%n": return "\"+(date.getMonth()+1)+\"";
                case "%y": return "\"+scheduler.date.to_fixed(date.getFullYear()%100)+\"";
                case "%Y": return "\"+date.getFullYear()+\"";
                case "%D": return "\"+scheduler.locale.date.day_short[date.getDay()]+\"";
                case "%l": return "\"+scheduler.locale.date.day_full[date.getDay()]+\"";
                case "%M": return "\"+scheduler.locale.date.month_short[date.getMonth()]+\"";
                case "%F": return "\"+scheduler.locale.date.month_full[date.getMonth()]+\"";
                case "%h": return "\"+scheduler.date.to_fixed((date.getHours()+11)%12+1)+\"";
                case "%g": return "\"+((date.getHours()+11)%12+1)+\"";
                case "%G": return "\"+date.getHours()+\"";
                case "%H": return "\"+scheduler.date.to_fixed(date.getHours())+\"";
                case "%i": return "\"+scheduler.date.to_fixed(date.getMinutes())+\"";
                case "%a": return "\"+(date.getHours()>11?\"pm\":\"am\")+\"";
                case "%A": return "\"+(date.getHours()>11?\"PM\":\"AM\")+\"";
                case "%s": return "\"+scheduler.date.to_fixed(date.getSeconds())+\"";
                case "%W": return "\"+scheduler.date.to_fixed(scheduler.date.getISOWeek(date))+\"";
                default: return a;
            }
        });
        if (utc) format=format.replace(/date\.get/g,"date.getUTC");
        return new Function("date","return \""+format+"\";");
    },
    str_to_date:function(format,utc){
        var splt="var temp=date.match(/[a-zA-Z]+|[0-9]+/g);";
        var mask=format.match(/%[a-zA-Z]/g);
        for (var i=0; i<mask.length; i++){
            switch(mask[i]){
                case "%j":
                case "%d": splt+="set[2]=temp["+i+"]||1;";
                    break;
                case "%n":
                case "%m": splt+="set[1]=(temp["+i+"]||1)-1;";
                    break;
                case "%y": splt+="set[0]=temp["+i+"]*1+(temp["+i+"]>50?1900:2000);";
                    break;
                case "%g":
                case "%G":
                case "%h":
                case "%H":
                    splt+="set[3]=temp["+i+"]||0;";
                    break;
                case "%i":
                    splt+="set[4]=temp["+i+"]||0;";
                    break;
                case "%Y": splt+="set[0]=temp["+i+"]||0;";
                    break;
                case "%a":
                case "%A": splt+="set[3]=set[3]%12+((temp["+i+"]||'').toLowerCase()=='am'?0:12);";
                    break;
                case "%s": splt+="set[5]=temp["+i+"]||0;";
                    break;
                case "%M": splt+="set[1]=scheduler.locale.date.month_short_hash[temp["+i+"]]||0;";
                    break;
                case "%F": splt+="set[1]=scheduler.locale.date.month_full_hash[temp["+i+"]]||0;";
                    break;
                default:
                    break;
            }
        }
        var code ="set[0],set[1],set[2],set[3],set[4],set[5]";
        if (utc) code =" Date.UTC("+code+")";
        return new Function("date","var set=[0,0,1,0,0,0]; "+splt+" return new Date("+code+");");
    },
    getISOWeek: function(ndate) {
        if(!ndate) return false;
        var nday = ndate.getDay();
        if (nday === 0) {
            nday = 7;
        }
        var first_thursday = new Date(ndate.valueOf());
        first_thursday.setDate(ndate.getDate() + (4 - nday));
        var year_number = first_thursday.getFullYear(); // year of the first Thursday
        var ordinal_date = Math.round( (first_thursday.getTime() - new Date(year_number, 0, 1).getTime()) / 86400000); //ordinal date of the first Thursday - 1 (so not really ordinal date)
        var week_number = 1 + Math.floor( ordinal_date / 7);
        return week_number;
    },
    getUTCISOWeek: function(ndate){
        return this.getISOWeek(this.convert_to_utc(ndate));
    },
    convert_to_utc: function(date) {
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    }
};
scheduler.locale = {
    date:{
        month_full:["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        month_short:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        day_full:["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        day_short:["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    },
    labels:{
        dhx_cal_today_button:"Today",
        day_tab:"Daily",
        week_tab:"Weekly",
        month_tab:"Monthly",
        new_event:"New event",
        icon_save:"Save",
        icon_cancel:"Cancel",
        icon_details:"Details",
        icon_edit:"Edit",
        icon_delete:"Delete",
        confirm_closing:"",//Your changes will be lost, are your sure ?
        confirm_deleting:"Event will be deleted permanently, are you sure?",
        section_description:"Description",
        section_time:"Time period",
        full_day:"Full day",

        /*recurring events*/
        confirm_recurring:"Do you want to edit the whole set of repeated events?",
        section_recurring:"Repeat event",
        button_recurring:"Disabled",
        button_recurring_open:"Enabled",
        button_edit_series: "Edit series",
        button_edit_occurrence: "Edit occurrence",

        /*agenda view extension*/
        agenda_tab:"Agenda",
        date:"Date",
        description:"Description",

        /*year view extension*/
        year_tab:"Year",

        /* week agenda extension */
        week_agenda_tab: "Agenda",

        /*grid view extension*/
        grid_tab: "Grid",
        drag_to_create:"Drag to create",
        drag_to_move:"Drag to move"
    }
};


/*
 %e	Day of the month without leading zeros (01..31)
 %d	Day of the month, 2 digits with leading zeros (01..31)
 %j	Day of the year, 3 digits with leading zeros (001..366)
 %a	A textual representation of a day, two letters
 %W	A full textual representation of the day of the week

 %c	Numeric representation of a month, without leading zeros (0..12)
 %m	Numeric representation of a month, with leading zeros (00..12)
 %b	A short textual representation of a month, three letters (Jan..Dec)
 %M	A full textual representation of a month, such as January or March (January..December)

 %y	A two digit representation of a year (93..03)
 %Y	A full numeric representation of a year, 4 digits (1993..03)
 */

scheduler.config={
    default_date: "%l, %M %j, %Y",
    month_date: "%F %Y",
    load_date: "%Y-%m-%d",
    week_date: "%l",
    day_date: "%D, %F %j",
    hour_date: "%H:%i",
    month_day: "%d",
    xml_date: "%m/%d/%Y %H:%i",
    api_date: "%d-%m-%Y %H:%i",
    preserve_length:true,
    time_step: 15,

    start_on_monday: 1,
    first_hour: 0,
    last_hour: 24,
    readonly: false,
    drag_resize: 1,
    drag_move: 1,
    drag_create: 1,
    dblclick_create: 1,
    edit_on_create: 1,
    details_on_create: 1,

    cascade_event_display: false,
    cascade_event_count: 4,
    cascade_event_margin: 30,

    multi_day:true,
    multi_day_height_limit: 0,

    drag_lightbox: true,
    preserve_scroll: true,
    select: true,

    server_utc: false,
    touch:true,
    touch_tip:true,
    touch_drag:500,
    quick_info_detached:true,

    positive_closing: false,

    icons_edit: ["icon_save", "icon_cancel"],
    icons_select: ["icon_details", "icon_edit", "icon_delete"],
    buttons_left: ["dhx_save_btn", "dhx_cancel_btn"],
    buttons_right: ["dhx_delete_btn"],
    lightbox: {
        sections: [
            {name: "description", height: 200, map_to: "text", type: "textarea", focus: true},
            {name: "time", height: 72, type: "time", map_to: "auto"}
        ]
    },
    highlight_displayed_event: true,
    left_border: false
};
scheduler.templates={};
scheduler.init_templates=function(){
    var labels = scheduler.locale.labels;
    labels.dhx_save_btn 	= labels.icon_save;
    labels.dhx_cancel_btn 	= labels.icon_cancel;
    labels.dhx_delete_btn 	= labels.icon_delete;


    var d=scheduler.date.date_to_str;
    var c=scheduler.config;
    var f = function(a,b){
        for (var c in b)
            if (!a[c]) a[c]=b[c];
    };
    f(scheduler.templates,{
        day_date:d(c.default_date),
        month_date:d(c.month_date),
        week_date:function(d1,d2){
            return scheduler.templates.day_date(d1)+" &ndash; "+scheduler.templates.day_date(scheduler.date.add(d2,-1,"day"));
        },
        day_scale_date:d(c.default_date),
        month_scale_date:d(c.week_date),
        week_scale_date:d(c.day_date),
        hour_scale:d(c.hour_date),
        time_picker:d(c.hour_date),
        event_date:d(c.hour_date),
        month_day:d(c.month_day),
        xml_date:scheduler.date.str_to_date(c.xml_date,c.server_utc),
        load_format:d(c.load_date,c.server_utc),
        xml_format:d(c.xml_date,c.server_utc),
        api_date:scheduler.date.str_to_date(c.api_date),
        event_header:function(start,end,ev){
            if(!ev.task){
                ev.task={};
                ev.task.taskType='calendar';
                ev.task.assignee={};
                ev.task.assignee.imageURL='http://static.iseeit.com/img/placeholder_contact-small.png';

            }
            return '<i class="icon-'+ev.task.taskType+'" ></i>  '+scheduler.templates.event_date(start)+" - "+scheduler.templates.event_date(end);
        },
        event_text:function(start,end,ev){
            return ev.text;
        },
        event_class:function(start,end,ev){
            return "";
        },
        month_date_class:function(d){
            return "";
        },
        week_date_class:function(d){
            return "";
        },
        event_bar_date:function(start,end,ev){
            return scheduler.templates.event_date(start)+" ";
        },
        event_bar_text:function(start,end,ev){
            return ev.text;
        },
        month_events_link : function(date, count){
            return "<a>View more("+count+" events)</a>";
        }
    });
    this.callEvent("onTemplatesReady",[]);
};



scheduler.uid = function() {
    if (!this._seed) this._seed = (new Date).valueOf();
    return this._seed++;
};
scheduler._events = {};
scheduler.clearAll = function() {
    this._events = {};
    this._loaded = {};
    this.clear_view();
    this.callEvent("onClearAll", []);
};
scheduler.addEvent = function(start_date, end_date, text, id, extra_data) {
    if (!arguments.length)
        return this.addEventNow();
    var ev = start_date;
    if (arguments.length != 1) {
        ev = extra_data || {};
        ev.start_date = start_date;
        ev.end_date = end_date;
        ev.text = text;
        ev.id = id;
    }
    ev.id = ev.id || scheduler.uid();
    ev.text = ev.text || "";

    if (typeof ev.start_date == "string")  ev.start_date = this.templates.api_date(ev.start_date);
    if (typeof ev.end_date == "string")  ev.end_date = this.templates.api_date(ev.end_date);

    var d = (this.config.event_duration || this.config.time_step) * 60000;
    if (ev.start_date.valueOf() == ev.end_date.valueOf())
        ev.end_date.setTime(ev.end_date.valueOf() + d);

    ev._timed = this.isOneDayEvent(ev);

    var is_new = !this._events[ev.id];
    this._events[ev.id] = ev;
    this.event_updated(ev);
    if (!this._loading)
        this.callEvent(is_new ? "onEventAdded" : "onEventChanged", [ev.id, ev]);
    return ev.id;
};
scheduler.deleteEvent = function(id, silent) {
    var ev = this._events[id];
    if (!silent && (!this.callEvent("onBeforeEventDelete", [id, ev]) || !this.callEvent("onConfirmedBeforeEventDelete", [id, ev])))
        return;
    if (ev) {
        delete this._events[id];
        this.unselect(id);
        this.event_updated(ev);
    }

    this.callEvent("onEventDeleted", [id, ev]);
};
scheduler.getEvent = function(id) {
    return this._events[id];
};
scheduler.setEvent = function(id, hash) {
    if(!hash.id)
        hash.id = id;

    this._events[id] = hash;
};
scheduler.for_rendered = function(id, method) {
    for (var i = this._rendered.length - 1; i >= 0; i--)
        if (this._rendered[i].getAttribute("event_id") == id)
            method(this._rendered[i], i);
};
scheduler.changeEventId = function(id, new_id) {
    if (id == new_id) return;
    var ev = this._events[id];
    if (ev) {
        ev.id = new_id;
        this._events[new_id] = ev;
        delete this._events[id];
    }
    this.for_rendered(id, function(r) {
        r.setAttribute("event_id", new_id);
    });
    if (this._select_id == id) this._select_id = new_id;
    if (this._edit_id == id) this._edit_id = new_id;
    //if (this._drag_id==id) this._drag_id=new_id;
    this.callEvent("onEventIdChange", [id, new_id]);
};

(function() {
    var attrs = ["text", "Text", "start_date", "StartDate", "end_date", "EndDate"];
    var create_getter = function(name) {
        return function(id) { return (scheduler.getEvent(id))[name]; };
    };
    var create_setter = function(name) {
        return function(id, value) {
            var ev = scheduler.getEvent(id);
            ev[name] = value;
            ev._changed = true;
            ev._timed = this.isOneDayEvent(ev);
            scheduler.event_updated(ev, true);
        };
    };
    for (var i = 0; i < attrs.length; i += 2) {
        scheduler["getEvent" + attrs[i + 1]] = create_getter(attrs[i]);
        scheduler["setEvent" + attrs[i + 1]] = create_setter(attrs[i]);
    }
})();

scheduler.event_updated = function(ev, force) {
    if (this.is_visible_events(ev))
        this.render_view_data();
    else
        this.clear_event(ev.id);
};
scheduler.is_visible_events = function(ev) {
    return (ev.start_date < this._max_date && this._min_date < ev.end_date);
};
scheduler.isOneDayEvent = function(ev) {
    var delta = ev.end_date.getDate() - ev.start_date.getDate();

    if (!delta)
        return ev.start_date.getMonth() == ev.end_date.getMonth() && ev.start_date.getFullYear() == ev.end_date.getFullYear();
    else {
        if (delta < 0)  delta = Math.ceil((ev.end_date.valueOf() - ev.start_date.valueOf()) / (24 * 60 * 60 * 1000));
        return (delta == 1 && !ev.end_date.getHours() && !ev.end_date.getMinutes() && (ev.start_date.getHours() || ev.start_date.getMinutes() ));
    }

};
scheduler.get_visible_events = function(only_timed) {
    //not the best strategy for sure
    var stack = [];

    for (var id in this._events)
        if (this.is_visible_events(this._events[id]))
            if (!only_timed || this._events[id]._timed)
                if (this.filter_event(id, this._events[id]))
                    stack.push(this._events[id]);

    return stack;
};
scheduler.filter_event = function(id, ev) {
    var filter = this["filter_" + this._mode];
    return (filter) ? filter(id, ev) : true;
};
scheduler._is_main_area_event = function(ev){
    return !!ev._timed;
};
scheduler.render_view_data = function(evs, hold) {
    if (!evs) {
        if (this._not_render) {
            this._render_wait = true;
            return;
        }
        this._render_wait = false;

        this.clear_view();
        evs = this.get_visible_events(!(this._table_view || this.config.multi_day));
    }
    for(var i= 0, len = evs.length; i < len; i++){
        this._recalculate_timed(evs[i]);
    }

    if (this.config.multi_day && !this._table_view) {

        var tvs = [];
        var tvd = [];
        for (var i = 0; i < evs.length; i++) {
            if (this._is_main_area_event(evs[i]))
                tvs.push(evs[i]);
            else
                tvd.push(evs[i]);
        }

        // multiday events
        this._rendered_location = this._els['dhx_multi_day'][0];
        this._table_view = true;
        this.render_data(tvd, hold);
        this._table_view = false;

        // normal events
        this._rendered_location = this._els['dhx_cal_data'][0];
        this._table_view = false;
        this.render_data(tvs, hold);

    } else {
        this._rendered_location = this._els['dhx_cal_data'][0];
        this.render_data(evs, hold);
    }
};


scheduler._view_month_day = function(e){
    var date = scheduler.getActionData(e).date;
    if(!scheduler.callEvent("onViewMoreClick", [date]))
        return;
    scheduler.setCurrentView(date, "day");
};

scheduler._render_month_link = function(ev){
    var parent = this._rendered_location;
    var toRender = this._lame_clone(ev);

    //render links in each cell of multiday events
    for(var d = ev._sday; d < ev._eday; d++){

        toRender._sday = d;
        toRender._eday = d+1;

        var date = scheduler.date;
        var curr = scheduler._min_date;
        curr = date.add(curr, toRender._sweek, "week");
        curr = date.add(curr, toRender._sday, "day");
        var count = scheduler.getEvents(curr, date.add(curr, 1, "day")).length;

        var pos = this._get_event_bar_pos(toRender);
        var widt = (pos.x2 - pos.x);

        var el = document.createElement("div");
        el.onclick = function(e){scheduler._view_month_day(e||event);};
        el.className = "dhx_month_link";
        el.style.top = pos.y + "px";
        el.style.left = pos.x + "px";
        el.style.width = widt + "px";
        el.innerHTML = scheduler.templates.month_events_link(curr, count);
        this._rendered.push(el);

        parent.appendChild(el);
    }
};

scheduler._recalculate_timed = function(id){
    if(!id) return;
    if(typeof(id) != "object")
        var ev = this._events[id];
    else
        var ev = id;
    if(!ev) return;
    ev._timed = scheduler.isOneDayEvent(ev);
};
scheduler.attachEvent("onEventChanged", scheduler._recalculate_timed);
scheduler.attachEvent("onEventAdded", scheduler._recalculate_timed);

scheduler.render_data = function(evs, hold) {
    evs = this._pre_render_events(evs, hold);

    for (var i = 0; i < evs.length; i++)
        if (this._table_view){
            if(scheduler._mode != 'month'){
                this.render_event_bar(evs[i]);//may be multiday section on other views
            }else{

                var max_evs = scheduler.config.max_month_events;
                if(max_evs !== max_evs*1 || evs[i]._sorder < max_evs){
                    //of max number events per month cell is set and event can be rendered
                    this.render_event_bar(evs[i]);
                }else if(max_evs !== undefined && evs[i]._sorder == max_evs){
                    //render 'view more' links
                    scheduler._render_month_link(evs[i]);
                }else{
                    //do not render events with ordinal number > maximum events per cell
                }
            }



        }else
            this.render_event(evs[i]);
};
scheduler._pre_render_events = function(evs, hold) {
    var hb = this.xy.bar_height;
    var h_old = this._colsS.heights;
    var h = this._colsS.heights = [0, 0, 0, 0, 0, 0, 0];
    var data = this._els["dhx_cal_data"][0];

    if (!this._table_view)
        evs = this._pre_render_events_line(evs, hold); //ignore long events for now
    else
        evs = this._pre_render_events_table(evs, hold);

    if (this._table_view) {
        if (hold)
            this._colsS.heights = h_old;
        else {
            var evl = data.firstChild;
            if (evl.rows) {
                for (var i = 0; i < evl.rows.length; i++) {
                    h[i]++;
                    if ((h[i]) * hb > this._colsS.height - 22) { // 22 - height of cell's header
                        //we have overflow, update heights
                        var cells = evl.rows[i].cells;

                        var cHeight = this._colsS.height - 22;
                        if(this.config.max_month_events*1 !== this.config.max_month_events || h[i] <= this.config.max_month_events){
                            cHeight = h[i] * hb;
                        }else if( (this.config.max_month_events + 1) * hb > this._colsS.height - 22){
                            cHeight = (this.config.max_month_events + 1) * hb;
                        }

                        for (var j = 0; j < cells.length; j++) {
                            cells[j].childNodes[1].style.height = cHeight + "px";
                        }
                        h[i] = (h[i - 1] || 0) + cells[0].offsetHeight;
                    }
                    h[i] = (h[i - 1] || 0) + evl.rows[i].cells[0].offsetHeight;
                }
                h.unshift(0);
                if (evl.parentNode.offsetHeight < evl.parentNode.scrollHeight && !evl._h_fix && scheduler.xy.scroll_width) {
                    //we have v-scroll, decrease last day cell
                    for (var i = 0; i < evl.rows.length; i++) {
                        //get last visible cell
                        var last = 6; while (this._ignores[last]) last--;

                        var cell = evl.rows[i].cells[last].childNodes[0];
                        var w = cell.offsetWidth - scheduler.xy.scroll_width + "px";
                        cell.style.width = w;
                        cell.nextSibling.style.width = w;
                    }
                    evl._h_fix = true;
                }
            } else {
                if (!evs.length && this._els["dhx_multi_day"][0].style.visibility == "visible")
                    h[0] = -1;
                if (evs.length || h[0] == -1) {
                    //shift days to have space for multiday events
                    var childs = evl.parentNode.childNodes;

                    // +1 so multiday events would have 2px from top and 2px from bottom by default
                    var full_multi_day_height = (h[0] + 1) * hb + 1;

                    var used_multi_day_height = full_multi_day_height;
                    var used_multi_day_height_css = full_multi_day_height + "px";
                    if (this.config.multi_day_height_limit) {
                        used_multi_day_height = Math.min(full_multi_day_height, this.config.multi_day_height_limit) ;
                        used_multi_day_height_css = used_multi_day_height + "px";
                    }

                    data.style.top = (this._els["dhx_cal_navline"][0].offsetHeight + this._els["dhx_cal_header"][0].offsetHeight + used_multi_day_height ) + 'px';
                    data.style.height = (this._obj.offsetHeight - parseInt(data.style.top, 10) - (this.xy.margin_top || 0)) + 'px';

                    var multi_day_section = this._els["dhx_multi_day"][0];
                    multi_day_section.style.height = used_multi_day_height_css;
                    multi_day_section.style.visibility = (h[0] == -1 ? "hidden" : "visible");

                    // icon
                    var multi_day_icon = this._els["dhx_multi_day"][1];
                    multi_day_icon.style.height = used_multi_day_height_css;
                    multi_day_icon.style.width = '51px';
                    multi_day_icon.style.visibility = (h[0] == -1 ? "hidden" : "visible");
                    multi_day_icon.className = h[0] ? "dhx_multi_day_icon" : "dhx_multi_day_icon_small";
                    this._dy_shift = (h[0] + 1) * hb;
                    h[0] = 0;

                    if (used_multi_day_height != full_multi_day_height) {
                        data.style.top = (parseInt(data.style.top) + 2) + "px";

                        multi_day_section.style.overflowY = "auto";
                        multi_day_section.style.width = (parseInt(multi_day_section.style.width) - 2) + "px";

                        multi_day_icon.style.position = "fixed";
                        multi_day_icon.style.top = "";
                        multi_day_icon.style.left = "";
                    }
                }
            }
        }
    }

    return evs;
};
scheduler._get_event_sday = function(ev) {
    return Math.floor((ev.start_date.valueOf() - this._min_date.valueOf()) / (24 * 60 * 60 * 1000));
};
scheduler._get_event_mapped_end_date = function(ev) {
    var end_date = ev.end_date;
    if (this.config.separate_short_events) {
        var ev_duration = (ev.end_date - ev.start_date) / 60000; // minutes
        if (ev_duration < this._min_mapped_duration) {
            end_date = this.date.add(end_date, this._min_mapped_duration - ev_duration, "minute");
        }
    }
    return end_date;
};
scheduler._pre_render_events_line = function(evs, hold){
    evs.sort(function(a, b) {
        if (a.start_date.valueOf() == b.start_date.valueOf())
            return a.id > b.id ? 1 : -1;
        return a.start_date > b.start_date ? 1 : -1;
    });
    var days = []; //events by weeks
    var evs_originals = [];

    this._min_mapped_duration = Math.ceil(this.xy.min_event_height * 60 / this.config.hour_size_px);  // values could change along the way

    for (var i = 0; i < evs.length; i++) {
        var ev = evs[i];

        //check date overflow
        var sd = ev.start_date;
        var ed = ev.end_date;
        //check scale overflow
        var sh = sd.getHours();
        var eh = ed.getHours();

        ev._sday = this._get_event_sday(ev); // sday based on event start_date
        if (this._ignores[ev._sday]){
            //ignore event
            evs.splice(i,1);
            i--;
            continue;
        }

        if (!days[ev._sday]) days[ev._sday] = [];

        if (!hold) {
            ev._inner = false;

            var stack = days[ev._sday];

            while (stack.length) {
                var t_ev = stack[stack.length - 1];
                var t_end_date = this._get_event_mapped_end_date(t_ev);
                if (t_end_date.valueOf() <= ev.start_date.valueOf()) {
                    stack.splice(stack.length - 1, 1);
                } else {
                    break;
                }
            }

            var sorderSet = false;
            for (var j = 0; j < stack.length; j++) {
                var t_ev = stack[j];
                var t_end_date = this._get_event_mapped_end_date(t_ev);
                if (t_end_date.valueOf() <= ev.start_date.valueOf()) {
                    sorderSet = true;
                    ev._sorder = t_ev._sorder;
                    stack.splice(j, 1);
                    ev._inner = true;
                    break;
                }
            }

            if (stack.length)
                stack[stack.length - 1]._inner = true;

            if (!sorderSet) {
                if (stack.length) {
                    if (stack.length <= stack[stack.length - 1]._sorder) {
                        if (!stack[stack.length - 1]._sorder)
                            ev._sorder = 0;
                        else
                            for (j = 0; j < stack.length; j++) {
                                var _is_sorder = false;
                                for (var k = 0; k < stack.length; k++) {
                                    if (stack[k]._sorder == j) {
                                        _is_sorder = true;
                                        break;
                                    }
                                }
                                if (!_is_sorder) {
                                    ev._sorder = j;
                                    break;
                                }
                            }
                        ev._inner = true;
                    } else {
                        var _max_sorder = stack[0]._sorder;
                        for (j = 1; j < stack.length; j++) {
                            if (stack[j]._sorder > _max_sorder)
                                _max_sorder = stack[j]._sorder;
                        }
                        ev._sorder = _max_sorder + 1;
                        ev._inner = false;
                    }

                } else
                    ev._sorder = 0;
            }

            stack.push(ev);

            if (stack.length > (stack.max_count || 0)) {
                stack.max_count = stack.length;
                ev._count = stack.length;
            } else {
                ev._count = (ev._count) ? ev._count : 1;
            }
        }

        if (sh < this.config.first_hour || eh >= this.config.last_hour) {
            // Need to create copy of event as we will be changing it's start/end date
            // e.g. first_hour = 11 and event.start_date hours = 9. Need to preserve that info
            evs_originals.push(ev);
            evs[i] = ev = this._copy_event(ev);

            if (sh < this.config.first_hour) {
                ev.start_date.setHours(this.config.first_hour);
                ev.start_date.setMinutes(0);
            }
            if (eh >= this.config.last_hour) {
                ev.end_date.setMinutes(0);
                ev.end_date.setHours(this.config.last_hour);
            }

            if (ev.start_date > ev.end_date || sh == this.config.last_hour) {
                evs.splice(i, 1);
                i--;
                continue;
            }
        }
    }
    if (!hold) {
        for (var i = 0; i < evs.length; i++) {
            evs[i]._count = days[evs[i]._sday].max_count;
        }
        for (var i = 0; i < evs_originals.length; i++)
            evs_originals[i]._count = days[evs_originals[i]._sday].max_count;
    }

    return evs;
};
scheduler._time_order = function(evs) {
    evs.sort(function(a, b) {
        if (a.start_date.valueOf() == b.start_date.valueOf()) {
            if (a._timed && !b._timed) return 1;
            if (!a._timed && b._timed) return -1;
            return a.id > b.id ? 1 : -1;
        }
        return a.start_date > b.start_date ? 1 : -1;
    });
};
scheduler._pre_render_events_table = function(evs, hold) { // max - max height of week slot
    this._time_order(evs);
    var out = [];
    var weeks = [
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ]; //events by weeks
    var max = this._colsS.heights;
    var start_date;
    var cols = this._cols.length;
    var chunks_info = {};

    for (var i = 0; i < evs.length; i++) {
        var ev = evs[i];
        var id = ev.id;
        if (!chunks_info[id]) {
            chunks_info[id] = {
                first_chunk: true,
                last_chunk: true
            };
        }
        var chunk_info = chunks_info[id];
        var sd = (start_date || ev.start_date);
        var ed = ev.end_date;
        //trim events which are crossing through current view
        if (sd < this._min_date) {
            chunk_info.first_chunk = false;
            sd = this._min_date;
        }
        if (ed > this._max_date) {
            chunk_info.last_chunk = false;
            ed = this._max_date;
        }

        var locate_s = this.locate_holder_day(sd, false, ev);
        ev._sday = locate_s % cols;

        //skip single day events for ignored dates
        if (this._ignores[ev._sday] && ev._timed) continue;

        var locate_e = this.locate_holder_day(ed, true, ev) || cols;
        ev._eday = (locate_e % cols) || cols; //cols used to fill full week, when event end on monday
        ev._length = locate_e - locate_s;

        //3600000 - compensate 1 hour during winter|summer time shift
        ev._sweek = Math.floor((this._correct_shift(sd.valueOf(), 1) - this._min_date.valueOf()) / (60 * 60 * 1000 * 24 * cols));

        //current slot
        var stack = weeks[ev._sweek];
        //check order position
        var stack_line;

        for (stack_line = 0; stack_line < stack.length; stack_line++)
            if (stack[stack_line]._eday <= ev._sday)
                break;

        if (!ev._sorder || !hold) {
            ev._sorder = stack_line;
        }

        if (ev._sday + ev._length <= cols) {
            start_date = null;
            out.push(ev);
            stack[stack_line] = ev;
            //get max height of slot
            max[ev._sweek] = stack.length - 1;
            ev._first_chunk = chunk_info.first_chunk;
            ev._last_chunk = chunk_info.last_chunk;
        } else { // split long event in chunks
            var copy = this._copy_event(ev);
            copy.id = ev.id;
            copy._length = cols - ev._sday;
            copy._eday = cols;
            copy._sday = ev._sday;
            copy._sweek = ev._sweek;
            copy._sorder = ev._sorder;
            copy.end_date = this.date.add(sd, copy._length, "day");
            copy._first_chunk = chunk_info.first_chunk;
            if (chunk_info.first_chunk) {
                chunk_info.first_chunk = false;
            }

            out.push(copy);
            stack[stack_line] = copy;
            start_date = copy.end_date;
            //get max height of slot
            max[ev._sweek] = stack.length - 1;
            i--;
            continue;  //repeat same step
        }
    }
    return out;
};
scheduler._copy_dummy = function() {
    var a = new Date(this.start_date);
    var b = new Date(this.end_date);
    this.start_date = a;
    this.end_date = b;
};
scheduler._copy_event = function(ev) {
    this._copy_dummy.prototype = ev;
    return new this._copy_dummy();
    //return {start_date:ev.start_date, end_date:ev.end_date, text:ev.text, id:ev.id}
};
scheduler._rendered = [];
scheduler.clear_view = function() {
    for (var i = 0; i < this._rendered.length; i++) {
        var obj = this._rendered[i];
        if (obj.parentNode) obj.parentNode.removeChild(obj);
    }
    this._rendered = [];
};
scheduler.updateEvent = function(id) {
    var ev = this.getEvent(id);
    this.clear_event(id);

    if (ev && this.is_visible_events(ev) && this.filter_event(id, ev) && (this._table_view || this.config.multi_day || ev._timed)) {
        if (this.config.update_render)
            this.render_view_data();
        else
            this.render_view_data([ev], true);
    }
};
scheduler.clear_event = function(id) {
    this.for_rendered(id, function(node, i) {
        if (node.parentNode)
            node.parentNode.removeChild(node);
        scheduler._rendered.splice(i, 1);
    });
};
scheduler.render_event = function(ev) {
    var menu = scheduler.xy.menu_width;
    var menu_offset = (this.config.use_select_menu_space) ? 0 : menu;
    if (ev._sday < 0) return; //can occur in case of recurring event during time shift

    var parent = scheduler.locate_holder(ev._sday);
    if (!parent) return; //attempt to render non-visible event

    var sm = ev.start_date.getHours() * 60 + ev.start_date.getMinutes();
    var em = (ev.end_date.getHours() * 60 + ev.end_date.getMinutes()) || (scheduler.config.last_hour * 60);
    var ev_count = ev._count || 1;
    var ev_sorder = ev._sorder || 0;
    var top = (Math.round((sm * 60 * 1000 - this.config.first_hour * 60 * 60 * 1000) * this.config.hour_size_px / (60 * 60 * 1000))) % (this.config.hour_size_px * 24); //42px/hour
    var height = Math.max(scheduler.xy.min_event_height, (em - sm) * this.config.hour_size_px / 60); //42px/hour
    var width = Math.floor((parent.clientWidth - menu_offset) / ev_count);
    var left = ev_sorder * width + 1;
    if (!ev._inner) width = width * (ev_count - ev_sorder);
    if (this.config.cascade_event_display) {
        var limit = this.config.cascade_event_count;
        var margin = this.config.cascade_event_margin;
        left = ev_sorder % limit * margin;
        var right = (ev._inner) ? (ev_count - ev_sorder - 1) % limit * margin / 2 : 0;
        width = Math.floor(parent.clientWidth - menu_offset - left - right);
    }

    var d = this._render_v_bar(ev.id, menu_offset + left, top, width, height, ev._text_style, scheduler.templates.event_header(ev.start_date, ev.end_date, ev), scheduler.templates.event_text(ev.start_date, ev.end_date, ev));

    this._rendered.push(d);
    parent.appendChild(d);

    left = left + parseInt(parent.style.left, 10) + menu_offset;

    if (this._edit_id == ev.id) {

        d.style.zIndex = 1; //fix overlapping issue
        width = Math.max(width - 4, scheduler.xy.editor_width);
        d = document.createElement("DIV");
        d.setAttribute("event_id", ev.id);
        this.set_xy(d, width, height - 20, left, top + 14);
        d.className = "dhx_cal_editor";

        var d2 = document.createElement("DIV");
        this.set_xy(d2, width - 6, height - 26);
        d2.style.cssText += ";margin:2px 2px 2px 2px;overflow:hidden;";

        d.appendChild(d2);
        this._els["dhx_cal_data"][0].appendChild(d);
        this._rendered.push(d);

        d2.innerHTML = "<textarea class='dhx_cal_editor'>" + ev.text + "</textarea>";
        if (this._quirks7) d2.firstChild.style.height = height - 12 + "px"; //IEFIX
        this._editor = d2.firstChild;
        this._editor.onkeydown = function(e) {
            if ((e || event).shiftKey) return true;
            var code = (e || event).keyCode;
            if (code == scheduler.keys.edit_save) scheduler.editStop(true);
            if (code == scheduler.keys.edit_cancel) scheduler.editStop(false);
        };
        this._editor.onselectstart = function (e) {
            return (e || event).cancelBubble = true;
        };
        scheduler._focus(d2.firstChild, true);
        //IE and opera can add x-scroll during focusing
        this._els["dhx_cal_data"][0].scrollLeft = 0;
    }
    if (this.xy.menu_width !== 0 && this._select_id == ev.id) {
        if (this.config.cascade_event_display && this._drag_mode)
            d.style.zIndex = 1; //fix overlapping issue for cascade view in case of dnd of selected event
        var icons = this.config["icons_" + ((this._edit_id == ev.id) ? "edit" : "select")];
        var icons_str = "";
        var bg_color = (ev.color ? ("background-color: " + ev.color + ";") : "");
        var color = (ev.textColor ? ("color: " + ev.textColor + ";") : "");
        for (var i = 0; i < icons.length; i++)
            icons_str += "<div class='dhx_menu_icon " + icons[i] + "' style='" + bg_color + "" + color + "' title='" + this.locale.labels[icons[i]] + "'></div>";
        var obj = this._render_v_bar(ev.id, left - menu + 1, top, menu, icons.length * 20 + 26 - 2, "", "<div style='" + bg_color + "" + color + "' class='dhx_menu_head'></div>", icons_str, true);
        obj.style.left = left - menu + 1;
        this._els["dhx_cal_data"][0].appendChild(obj);
        this._rendered.push(obj);
    }
};
scheduler._render_v_bar = function (id, x, y, w, h, style, contentA, contentB, bottom) {
    var d = document.createElement("DIV");
    var ev = this.getEvent(id);
    var deadlineTimestamp = ev.end_date.getTime();
    var currentTimestamp = new Date().getTime();
    var border = getBorderColor(deadlineTimestamp, currentTimestamp);

    var cs = (bottom) ? "dhx_cal_event dhx_cal_select_menu" : "dhx_cal_event event-edge " + border;

    var cse = scheduler.templates.event_class(ev.start_date, ev.end_date, ev);
    if (cse) cs = cs + " " + cse;

    var bg_color = (ev.color ? ("background:" + ev.color + ";") : "");
    var color = (ev.textColor ? ("color:" + ev.textColor + ";") : "");
    var small_cs='';
    if (w<75){
        small_cs = 'xsmall_cs';
    }else{
        if(w<220){
            small_cs = 'small_cs ellipsisNoWrap';
        }else{
            small_cs = '';
        }
    }
    var html = '<div event_id="' + id + '" class="' + cs + '" style="box-shadow: 1px -1px 5px 1px #cccccc!important; position:absolute; top:' + y + 'px; left:' + x + 'px; width:' + (w - 4) + 'px; height:' + h + 'px;' + (style || "") + '"></div>';
    d.innerHTML = html;

    var container = d.cloneNode(true).firstChild;

    if (!bottom && scheduler.renderEvent(container, ev)) {
        return container;
    } else {
        container = d.firstChild;

        var inner_html = '<div class="dhx_event_move dhx_header '+small_cs+'" style=" width:' + (w - 6) + 'px;' + bg_color + '" >&nbsp;</div>';
        inner_html += '<div class="dhx_event_move dhx_title '+small_cs+'" style="' + bg_color + '' + color + '">' + contentA + '</div>';
        inner_html += '<div class="dhx_body '+small_cs+'" style=" width:' + (w - (this._quirks ? 4 : 4) - 5) + 'px; height:' + (h - (this._quirks ? 20 : 23) + 1) + 'px;' + bg_color + '' + color + '">' + contentB + '</div>'; // +2 css specific, moved from render_event

        var footer_class = "dhx_event_resize dhx_footer";
        if (bottom)
            footer_class = "dhx_resize_denied " + footer_class;

        inner_html += '<div class="' + footer_class + '" style=" width:' + (w - 11) + 'px;' + (bottom ? ' margin-top:-1px;' : '') + '' + bg_color + '' + color + '" ></div>';

        container.innerHTML = inner_html;
    }

    return container;
};
scheduler.renderEvent = function(){
    return false;
},
    scheduler.locate_holder = function(day) {
        if (this._mode == "day") return this._els["dhx_cal_data"][0].firstChild; //dirty
        return this._els["dhx_cal_data"][0].childNodes[day];
    };
scheduler.locate_holder_day = function(date, past) {
    var day = Math.floor((this._correct_shift(date, 1) - this._min_date) / (60 * 60 * 24 * 1000));
    //when locating end data of event , we need to use next day if time part was defined
    if (past && this.date.time_part(date)) day++;
    return day;
};

var getBorderColor = function(deadlineTimestamp, currentTimestamp){
    if (currentTimestamp > deadlineTimestamp) {
        return ' red-bright';
    }

    if (deadlineTimestamp > currentTimestamp && deadlineTimestamp <= (currentTimestamp + 259200000)) {
        return ' yellow-bright';
    }

    if (deadlineTimestamp > (currentTimestamp + 259200000)) {
        return ' green-bright';
    }
}

scheduler._get_dnd_order = function(order, ev_height, max_height){
    if(!this._drag_event)
        return order;
    if(!this._drag_event._orig_sorder)
        this._drag_event._orig_sorder = order;
    else
        order = this._drag_event._orig_sorder;

    var evTop = ev_height * order;
    while((evTop + ev_height) > max_height){
        order--;
        evTop -= ev_height;
    }
    return order;
};
//scheduler._get_event_bar_pos = function(sday, eday, week, drag){
scheduler._get_event_bar_pos = function(ev){
    var x = this._colsS[ev._sday];
    var x2 = this._colsS[ev._eday];
    if (x2 == x) x2 = this._colsS[ev._eday + 1];
    var hb = this.xy.bar_height;

    var order = ev._sorder;
    if(ev.id == this._drag_id){
        var cellHeight = this._colsS.heights[ev._sweek + 1] - this._colsS.heights[ev._sweek]- 22;//22 for month head height
        order = scheduler._get_dnd_order(order, hb, cellHeight);
    }
    var y_event_offset =  order * hb;
    var y = this._colsS.heights[ev._sweek] + (this._colsS.height ? (this.xy.month_scale_height + 2) : 2 ) + y_event_offset;
    return {x:x, x2:x2, y:y};
};

scheduler.render_event_bar = function (ev) {
    var parent = this._rendered_location;
    var pos = this._get_event_bar_pos(ev);

    var y = pos.y;
    var x = pos.x;
    var x2 = pos.x2;

    //events in ignored dates

    if (!x2) return;


    var d = document.createElement("DIV");
    var cs = "dhx_cal_event_clear";

    var deadlineTimestamp = ev.end_date.getTime();
    var currentTimestamp = new Date().getTime();
    var border = getBorderColor(deadlineTimestamp, currentTimestamp);

    if (!ev._timed) {
        cs = "dhx_cal_event_line";
        if (ev.hasOwnProperty("_first_chunk") && ev._first_chunk)
            cs += " dhx_cal_event_line_start";
        if (ev.hasOwnProperty("_last_chunk") && ev._last_chunk)
            cs += " dhx_cal_event_line_end event-edge" + border;
    }
    var cse = scheduler.templates.event_class(ev.start_date, ev.end_date, ev);
    if (cse) cs = cs + " " + cse;

    var bg_color = (ev.color ? ("background:" + ev.color + ";") : "");
    var color = (ev.textColor ? ("color:" + ev.textColor + ";") : "");

    var html = '<div event_id="' + ev.id + '" class="' + cs + '" style="position:absolute; top:' + y + 'px; left:' + x + 'px; width:' + (x2 - x - 15) + 'px;' + color + '' + bg_color + '' + (ev._text_style || "") + '">';

    ev = scheduler.getEvent(ev.id); // ev at this point could be a part of a larged event
    if (ev._timed)
        html += scheduler.templates.event_bar_date(ev.start_date, ev.end_date, ev);
    html += scheduler.templates.event_bar_text(ev.start_date, ev.end_date, ev) + '</div>';
    html += '</div>';

    d.innerHTML = html;

    this._rendered.push(d.firstChild);
    parent.appendChild(d.firstChild);
};

scheduler._locate_event = function(node) {
    var id = null;
    while (node && !id && node.getAttribute) {
        id = node.getAttribute("event_id");
        node = node.parentNode;
    }
    return id;
};

scheduler.edit = function(id) {
    if (this._edit_id == id) return;
    this.editStop(false, id);
    this._edit_id = id;
    this.updateEvent(id);
};
scheduler.editStop = function(mode, id) {
    if (id && this._edit_id == id) return;
    var ev = this.getEvent(this._edit_id);
    if (ev) {
        if (mode) ev.text = this._editor.value;
        this._edit_id = null;
        this._editor = null;
        this.updateEvent(ev.id);
        this._edit_stop_event(ev, mode);
    }
};
scheduler._edit_stop_event = function(ev, mode) {
    if (this._new_event) {
        if (!mode) {
            if (ev) // in case of custom lightbox user can already delete event
                this.deleteEvent(ev.id, true);
        } else {
            this.callEvent("onEventAdded", [ev.id, ev]);
        }
        this._new_event = null;
    } else {
        if (mode){
            this.callEvent("onEventChanged", [ev.id, ev]);
        }
    }
};

scheduler.getEvents = function(from, to) {
    var result = [];
    for (var a in this._events) {
        var ev = this._events[a];
        if (ev && ( (!from && !to) || (ev.start_date < to && ev.end_date > from) ))
            result.push(ev);
    }
    return result;
};
scheduler.getRenderedEvent = function(id) {
    if (!id)
        return;
    var rendered_events = scheduler._rendered;
    for (var i=0; i<rendered_events.length; i++) {
        var rendered_event = rendered_events[i];
        if (rendered_event.getAttribute("event_id") == id) {
            return rendered_event;
        }
    }
    return null;
};
scheduler.showEvent = function(id, mode) {
    var ev = (typeof id == "number" || typeof id == "string") ? scheduler.getEvent(id) : id;
    mode = mode||scheduler._mode;

    if (!ev || (this.checkEvent("onBeforeEventDisplay") && !this.callEvent("onBeforeEventDisplay", [ev, mode])))
        return;

    var scroll_hour = scheduler.config.scroll_hour;
    scheduler.config.scroll_hour = ev.start_date.getHours();
    var preserve_scroll = scheduler.config.preserve_scroll;
    scheduler.config.preserve_scroll = false;

    var original_color = ev.color;
    var original_text_color = ev.textColor;
    if (scheduler.config.highlight_displayed_event) {
        ev.color = scheduler.config.displayed_event_color;
        ev.textColor = scheduler.config.displayed_event_text_color;
    }

    scheduler.setCurrentView(new Date(ev.start_date), mode);

    ev.color = original_color;
    ev.textColor = original_text_color;
    scheduler.config.scroll_hour = scroll_hour;
    scheduler.config.preserve_scroll = preserve_scroll;

    if (scheduler.matrix && scheduler.matrix[mode]) {
        scheduler._els.dhx_cal_data[0].scrollTop = getAbsoluteTop(scheduler.getRenderedEvent(ev.id)) - getAbsoluteTop(scheduler._els.dhx_cal_data[0]) - 20;
    }

    scheduler.callEvent("onAfterEventDisplay", [ev, mode]);
};

scheduler._loaded = {};
scheduler._load = function(url, from) {
    url = url || this._load_url;

    if(!url){
        //if scheduler.setLoadMode is called before scheduler.init, initial rendering will invoke data loading while url is undefined
        return;
    }

    url += (url.indexOf("?") == -1 ? "?" : "&") + "timeshift=" + (new Date()).getTimezoneOffset();
    if (this.config.prevent_cache)    url += "&uid=" + this.uid();
    var to;
    from = from || this._date;

    if (this._load_mode) {
        var lf = this.templates.load_format;

        from = this.date[this._load_mode + "_start"](new Date(from.valueOf()));
        while (from > this._min_date) from = this.date.add(from, -1, this._load_mode);
        to = from;

        var cache_line = true;
        while (to < this._max_date) {
            to = this.date.add(to, 1, this._load_mode);
            if (this._loaded[lf(from)] && cache_line)
                from = this.date.add(from, 1, this._load_mode); else cache_line = false;
        }

        var temp_to = to;
        do {
            to = temp_to;
            temp_to = this.date.add(to, -1, this._load_mode);
        } while (temp_to > from && this._loaded[lf(temp_to)]);

        if (to <= from)
            return false; //already loaded
        dhtmlxAjax.get(url + "&from=" + lf(from) + "&to=" + lf(to), function(l) {scheduler.on_load(l);});
        while (from < to) {
            this._loaded[lf(from)] = true;
            from = this.date.add(from, 1, this._load_mode);
        }
    } else
        dhtmlxAjax.get(url, function(l) {scheduler.on_load(l);});
    this.callEvent("onXLS", []);
    return true;
};
scheduler.on_load = function(loader) {
    var evs;
    if (this._process && this._process != "xml") {
        evs = this[this._process].parse(loader.xmlDoc.responseText);
    } else {
        evs = this._magic_parser(loader);
    }

    scheduler._process_loading(evs);

    this.callEvent("onXLE", []);
};
scheduler._process_loading = function(evs) {
    this._loading = true;
    this._not_render = true;
    for (var i = 0; i < evs.length; i++) {
        if (!this.callEvent("onEventLoading", [evs[i]])) continue;
        this.addEvent(evs[i]);
    }
    this._not_render = false;
    if (this._render_wait) this.render_view_data();

    this._loading = false;
    if (this._after_call) this._after_call();
    this._after_call = null;
};
scheduler._init_event = function(event) {
    event.text = (event.text || event._tagvalue) || "";
    event.start_date = scheduler._init_date(event.start_date);
    event.end_date = scheduler._init_date(event.end_date);
};

scheduler._init_date = function(date){
    if(!date)
        return null;
    if(typeof date == "string")
        return scheduler.templates.xml_date(date);
    else return new Date(date);
};

scheduler.json = {};
scheduler.json.parse = function(data) {
    if (typeof data == "string") {
        scheduler._temp = eval("(" + data + ")");
        data = (scheduler._temp) ? scheduler._temp.data || scheduler._temp.d || scheduler._temp : [];
    }

    if (data.dhx_security)
        dhtmlx.security_key = data.dhx_security;

    var collections = (scheduler._temp && scheduler._temp.collections) ? scheduler._temp.collections : {};
    var collections_loaded = false;
    for (var key in collections) {
        if (collections.hasOwnProperty(key)) {
            collections_loaded = true;
            var collection = collections[key];
            var arr = scheduler.serverList[key];
            if (!arr) continue;
            arr.splice(0, arr.length); //clear old options
            for (var j = 0; j < collection.length; j++) {
                var option = collection[j];
                var obj = { key: option.value, label: option.label }; // resulting option object
                for (var option_key in option) {
                    if (option.hasOwnProperty(option_key)) {
                        if (option_key == "value" || option_key == "label")
                            continue;
                        obj[option_key] = option[option_key]; // obj['value'] = option['value']
                    }
                }
                arr.push(obj);
            }
        }
    }
    if (collections_loaded)
        scheduler.callEvent("onOptionsLoad", []);

    var evs = [];
    for (var i = 0; i < data.length; i++) {
        var event = data[i];
        scheduler._init_event(event);
        evs.push(event);
    }
    return evs;
};
scheduler.parse = function(data, type) {
    this._process = type;
    this.on_load({xmlDoc: {responseText: data}});
};
scheduler.load = function(url, call) {
    if (typeof call == "string") {
        this._process = call;
        call = arguments[2];
    }

    this._load_url = url;
    this._after_call = call;
    this._load(url, this._date);
};
//possible values - day,week,month,year,all
scheduler.setLoadMode = function(mode) {
    if (mode == "all") mode = "";
    this._load_mode = mode;
};

scheduler.serverList = function(name, array) {
    if (array) {
        return this.serverList[name] = array.slice(0);
    }
    return this.serverList[name] = (this.serverList[name] || []);
};
scheduler._userdata = {};
scheduler._magic_parser = function(loader) {
    var xml;
    if (!loader.getXMLTopNode) { //from a string
        var xml_string = loader.xmlDoc.responseText;
        loader = new dtmlXMLLoaderObject(function() {});
        loader.loadXMLString(xml_string);
    }

    xml = loader.getXMLTopNode("data");
    if (xml.tagName != "data") return [];//not an xml
    var skey = xml.getAttribute("dhx_security");
    if (skey)
        dhtmlx.security_key = skey;

    var opts = loader.doXPath("//coll_options");
    for (var i = 0; i < opts.length; i++) {
        var bind = opts[i].getAttribute("for");
        var arr = this.serverList[bind];
        if (!arr) continue;
        arr.splice(0, arr.length);	//clear old options
        var itms = loader.doXPath(".//item", opts[i]);
        for (var j = 0; j < itms.length; j++) {
            var itm = itms[j];
            var attrs = itm.attributes;
            var obj = { key: itms[j].getAttribute("value"), label: itms[j].getAttribute("label")};
            for (var k = 0; k < attrs.length; k++) {
                var attr = attrs[k];
                if (attr.nodeName == "value" || attr.nodeName == "label")
                    continue;
                obj[attr.nodeName] = attr.nodeValue;
            }
            arr.push(obj);
        }
    }
    if (opts.length)
        scheduler.callEvent("onOptionsLoad", []);

    var ud = loader.doXPath("//userdata");
    for (var i = 0; i < ud.length; i++) {
        var udx = this._xmlNodeToJSON(ud[i]);
        this._userdata[udx.name] = udx.text;
    }

    var evs = [];
    xml = loader.doXPath("//event");

    for (var i = 0; i < xml.length; i++) {
        var ev = evs[i] = this._xmlNodeToJSON(xml[i]);
        scheduler._init_event(ev);
    }
    return evs;
};
scheduler._xmlNodeToJSON = function(node) {
    var t = {};
    for (var i = 0; i < node.attributes.length; i++)
        t[node.attributes[i].name] = node.attributes[i].value;

    for (var i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        if (child.nodeType == 1)
            t[child.tagName] = child.firstChild ? child.firstChild.nodeValue : "";
    }

    if (!t.text) t.text = node.firstChild ? node.firstChild.nodeValue : "";

    return t;
};
scheduler.attachEvent("onXLS", function() {
    if (this.config.show_loading === true) {
        var t;
        t = this.config.show_loading = document.createElement("DIV");
        t.className = 'dhx_loading';
        t.style.left = Math.round((this._x - 128) / 2) + "px";
        t.style.top = Math.round((this._y - 15) / 2) + "px";
        this._obj.appendChild(t);
    }
});
scheduler.attachEvent("onXLE", function() {
    var t = this.config.show_loading;
    if (t && typeof t == "object") {
        this._obj.removeChild(t);
        this.config.show_loading = true;
    }
});

/*
 This software is allowed to use under GPL or you need to obtain Commercial or Enterise License
 to use it in not GPL project. Please contact sales@dhtmlx.com for details
 */
scheduler.ical={
    parse:function(str){
        var data = str.match(RegExp(this.c_start+"[^\f]*"+this.c_end,""));
        if (!data.length) return;

        //unfolding 
        data[0]=data[0].replace(/[\r\n]+(?=[a-z \t])/g," ");
        //drop property
        data[0]=data[0].replace(/\;[^:\r\n]*:/g,":");


        var incoming=[];
        var match;
        var event_r = RegExp("(?:"+this.e_start+")([^\f]*?)(?:"+this.e_end+")","g");
        while (match=event_r.exec(data)){
            var e={};
            var param;
            var param_r = /[^\r\n]+[\r\n]+/g;
            while (param=param_r.exec(match[1]))
                this.parse_param(param.toString(),e);
            if (e.uid && !e.id) e.id = e.uid; //fallback to UID, when ID is not defined
            incoming.push(e);
        }
        return incoming;
    },
    parse_param:function(str,obj){
        var d = str.indexOf(":");
        if (d==-1) return;

        var name = str.substr(0,d).toLowerCase();
        var value = str.substr(d+1).replace(/\\\,/g,",").replace(/[\r\n]+$/,"");
        if (name=="summary")
            name="text";
        else if (name=="dtstart"){
            name = "start_date";
            value = this.parse_date(value,0,0);
        }
        else if (name=="dtend"){
            name = "end_date";
            value = this.parse_date(value,0,0);
        }
        obj[name]=value;
    },
    parse_date:function(value,dh,dm){
        var t = value.split("T");
        if (t[1]){
            dh=t[1].substr(0,2);
            dm=t[1].substr(2,2);
        }
        var dy = t[0].substr(0,4);
        var dn = parseInt(t[0].substr(4,2),10)-1;
        var dd = t[0].substr(6,2);
        if (scheduler.config.server_utc && !t[1]) { // if no hours/minutes were specified == full day event
            return new Date(Date.UTC(dy,dn,dd,dh,dm)) ;
        }
        return new Date(dy,dn,dd,dh,dm);
    },
    c_start:"BEGIN:VCALENDAR",
    e_start:"BEGIN:VEVENT",
    e_end:"END:VEVENT",
    c_end:"END:VCALENDAR"
};
scheduler._lightbox_controls = {};
scheduler.formSection = function(name){
    var config = this.config.lightbox.sections;
    var i =0;
    for (i; i < config.length; i++)
        if (config[i].name == name)
            break;
    var section = config[i];
    if (!scheduler._lightbox)
        scheduler.getLightbox();
    var header = document.getElementById(section.id);
    var node = header.nextSibling;

    var result = {
        section: section,
        header: header,
        node: node,
        getValue:function(ev){
            return scheduler.form_blocks[section.type].get_value(node, (ev||{}), section);
        },
        setValue:function(value, ev){
            return scheduler.form_blocks[section.type].set_value(node, value, (ev||{}), section);
        }
    };

    var handler = scheduler._lightbox_controls["get_"+section.type+"_control"];
    return handler?handler(result):result;
};
scheduler._lightbox_controls.get_template_control = function(result) {
    result.control = result.node;
    return result;
};
scheduler._lightbox_controls.get_select_control = function(result) {
    result.control = result.node.getElementsByTagName('select')[0];
    return result;
};
scheduler._lightbox_controls.get_textarea_control = function(result) {
    result.control = result.node.getElementsByTagName('textarea')[0];
    return result;
};
scheduler._lightbox_controls.get_time_control = function(result) {
    result.control = result.node.getElementsByTagName('select'); // array
    return result;
};
scheduler.form_blocks={
    template:{
        render: function(sns){
            var height=(sns.height||"30")+"px";
            return "<div class='dhx_cal_ltext dhx_cal_template' style='height:"+height+";'></div>";
        },
        set_value:function(node,value,ev,config){
            node.innerHTML = value||"";
        },
        get_value:function(node,ev,config){
            return node.innerHTML||"";
        },
        focus: function(node){
        }
    },
    textarea:{
        render:function(sns){
            var height=(sns.height||"130")+"px";
            return "<div class='dhx_cal_ltext' style='height:"+height+";'><textarea></textarea></div>";
        },
        set_value:function(node,value,ev){
            node.firstChild.value=value||"";
        },
        get_value:function(node,ev){
            return node.firstChild.value;
        },
        focus:function(node){
            var a=node.firstChild; scheduler._focus(a, true)
        }
    },
    select:{
        render:function(sns){
            var height=(sns.height||"23")+"px";
            var html="<div class='dhx_cal_ltext' style='height:"+height+";'><select style='width:100%;'>";
            for (var i=0; i < sns.options.length; i++)
                html+="<option value='"+sns.options[i].key+"'>"+sns.options[i].label+"</option>";
            html+="</select></div>";
            return html;
        },
        set_value:function(node,value,ev,sns){
            var select = node.firstChild;
            if (!select._dhx_onchange && sns.onchange) {
                select.onchange = sns.onchange;
                select._dhx_onchange = true;
            }
            if (typeof value == "undefined")
                value = (select.options[0]||{}).value;
            select.value=value||"";
        },
        get_value:function(node,ev){
            return node.firstChild.value;
        },
        focus:function(node){
            var a=node.firstChild; scheduler._focus(a, true);
        }
    },
    time:{
        render:function(sns) {
            if (!sns.time_format) {
                // default order
                sns.time_format = ["%H:%i", "%d", "%m", "%Y"];
            }
            // map: default order => real one
            sns._time_format_order = {};
            var time_format = sns.time_format;

            var cfg = scheduler.config;
            var dt = this.date.date_part(scheduler._currentDate());
            var last = 24*60, first = 0;
            if(scheduler.config.limit_time_select){
                last = 60*cfg.last_hour+1;
                first = 60*cfg.first_hour;
                dt.setHours(cfg.first_hour);
            }
            var html = "";

            for (var p = 0; p < time_format.length; p++) {
                var time_option = time_format[p];

                // adding spaces between selects
                if (p > 0) {
                    html += " ";
                }

                switch (time_option) {
                    case "%Y":
                        sns._time_format_order[3] = p;
                        //year
                        html+="<select>";
                        var year = dt.getFullYear()-5; //maybe take from config?
                        for (var i=0; i < 10; i++)
                            html+="<option value='"+(year+i)+"'>"+(year+i)+"</option>";
                        html+="</select> ";
                        break;
                    case "%m":
                        sns._time_format_order[2] = p;
                        //month
                        html+="<select>";
                        for (var i=0; i < 12; i++)
                            html+="<option value='"+i+"'>"+this.locale.date.month_full[i]+"</option>";
                        html += "</select>";
                        break;
                    case "%d":
                        sns._time_format_order[1] = p;
                        //days
                        html+="<select>";
                        for (var i=1; i < 32; i++)
                            html+="<option value='"+i+"'>"+i+"</option>";
                        html += "</select>";
                        break;
                    case "%H:%i":
                        sns._time_format_order[0] = p;
                        //hours
                        html += "<select>";
                        var i = first;
                        var tdate = dt.getDate();
                        sns._time_values = [];

                        while(i<last){
                            var time=this.templates.time_picker(dt);
                            html+="<option value='"+i+"'>"+time+"</option>";
                            sns._time_values.push(i);
                            dt.setTime(dt.valueOf()+this.config.time_step*60*1000);
                            var diff = (dt.getDate()!=tdate)?1:0; // moved or not to the next day
                            i=diff*24*60+dt.getHours()*60+dt.getMinutes();
                        }
                        html += "</select>";
                        break;
                }
            }

            return "<div style='height:30px;padding-top:0px;font-size:inherit;' class='dhx_section_time'>"+html+"<span style='font-weight:normal; font-size:10pt;'> &nbsp;&ndash;&nbsp; </span>"+html+"</div>";
        },
        set_value:function(node,value,ev,config){
            var cfg = scheduler.config;
            var s=node.getElementsByTagName("select");
            var map = config._time_format_order;

            if(cfg.full_day) {
                if (!node._full_day){
                    var html = "<label class='dhx_fullday'><input type='checkbox' name='full_day' value='true'> "+scheduler.locale.labels.full_day+"&nbsp;</label></input>";
                    if (!scheduler.config.wide_form)
                        html = node.previousSibling.innerHTML+html;
                    node.previousSibling.innerHTML=html;
                    node._full_day=true;
                }
                var input=node.previousSibling.getElementsByTagName("input")[0];
                input.checked = (scheduler.date.time_part(ev.start_date)===0 && scheduler.date.time_part(ev.end_date)===0);

                s[map[0]].disabled=input.checked;
                s[ map[0] + s.length/2 ].disabled=input.checked;

                input.onclick = function(){
                    if(input.checked) {
                        var obj = {};
                        scheduler.form_blocks.time.get_value(node,obj,config);

                        var start_date = scheduler.date.date_part(obj.start_date);
                        var end_date = scheduler.date.date_part(obj.end_date);

                        if (+end_date == +start_date || (+end_date >= +start_date && (ev.end_date.getHours() != 0 || ev.end_date.getMinutes() != 0)))
                            end_date = scheduler.date.add(end_date, 1, "day");
                    }

                    s[map[0]].disabled=input.checked;
                    s[ map[0] + s.length/2 ].disabled=input.checked;

                    _fill_lightbox_select(s,0,start_date||ev.start_date);
                    _fill_lightbox_select(s,4,end_date||ev.end_date);
                };
            }

            if(cfg.auto_end_date && cfg.event_duration) {
                function _update_lightbox_select() {
                    var start_date = new Date(s[map[3]].value,s[map[2]].value,s[map[1]].value,0,s[map[0]].value);
                    var end_date = new Date(start_date.getTime() + (scheduler.config.event_duration * 60 * 1000));
                    _fill_lightbox_select(s, 4, end_date);
                }
                for(var i=0; i<4; i++) {
                    s[i].onchange = _update_lightbox_select;
                }
            }

            function _fill_lightbox_select(s,i,d) {
                var time_values = config._time_values;
                var direct_value = d.getHours()*60+d.getMinutes();
                var fixed_value = direct_value;
                var value_found = false;
                for (var k=0; k<time_values.length; k++) {
                    var t_v = time_values[k];
                    if (t_v === direct_value) {
                        value_found = true;
                        break;
                    }
                    if (t_v < direct_value)
                        fixed_value = t_v;
                }

                s[i+map[0]].value=(value_found)?direct_value:fixed_value;
                if(!(value_found || fixed_value)){
                    s[i+map[0]].selectedIndex = -1;//show empty select in FF
                }
                s[i+map[1]].value=d.getDate();
                s[i+map[2]].value=d.getMonth();
                s[i+map[3]].value=d.getFullYear();
            }

            _fill_lightbox_select(s,0,ev.start_date);
            _fill_lightbox_select(s,4,ev.end_date);
        },
        get_value:function(node, ev, config) {
            s=node.getElementsByTagName("select");
            var map = config._time_format_order;

            ev.start_date=new Date(s[map[3]].value,s[map[2]].value,s[map[1]].value,0,s[map[0]].value);
            ev.end_date=new Date(s[map[3]+4].value,s[map[2]+4].value,s[map[1]+4].value,0,s[map[0]+4].value);

            if (ev.end_date<=ev.start_date)
                ev.end_date=scheduler.date.add(ev.start_date,scheduler.config.time_step,"minute");
            return {
                start_date: new Date(ev.start_date),
                end_date: new Date(ev.end_date)
            };
        },
        focus:function(node){
            scheduler._focus(node.getElementsByTagName("select")[0]);
        }
    }
};

scheduler.showCover=function(box){
    if (box){
        box.style.display="block";

        var scroll_top = window.pageYOffset||document.body.scrollTop||document.documentElement.scrollTop;
        var scroll_left = window.pageXOffset||document.body.scrollLeft||document.documentElement.scrollLeft;

        var view_height = window.innerHeight||document.documentElement.clientHeight;

        if(scroll_top) // if vertical scroll on window
            box.style.top=Math.round(scroll_top+Math.max((view_height-box.offsetHeight)/2, 0))+"px";
        else // vertical scroll on body
            box.style.top=Math.round(Math.max(((view_height-box.offsetHeight)/2), 0) + 9)+"px"; // +9 for compatibility with auto tests

        // not quite accurate but used for compatibility reasons
        if(document.documentElement.scrollWidth > document.body.offsetWidth) // if horizontal scroll on the window
            box.style.left=Math.round(scroll_left+(document.body.offsetWidth-box.offsetWidth)/2)+"px";
        else // horizontal scroll on the body
            box.style.left=Math.round((document.body.offsetWidth-box.offsetWidth)/2)+"px";
    }
    this.show_cover();
};
scheduler.showLightbox=function(id){
    if (!id) return;
    if (!this.callEvent("onBeforeLightbox",[id])) {
        if (this._new_event)
            this._new_event = null;
        return;
    }
    var box = this.getLightbox();
    this.showCover(box);
    this._fill_lightbox(id,box);
    this.callEvent("onLightbox",[id]);
};
scheduler._fill_lightbox = function(id, box) {
    var ev = this.getEvent(id);
    var s = box.getElementsByTagName("span");
    if (scheduler.templates.lightbox_header) {
        s[1].innerHTML = "";
        s[2].innerHTML = scheduler.templates.lightbox_header(ev.start_date, ev.end_date, ev);
    } else {
        s[1].innerHTML = this.templates.event_header(ev.start_date, ev.end_date, ev);
        s[2].innerHTML = (this.templates.event_bar_text(ev.start_date, ev.end_date, ev) || "").substr(0, 70); //IE6 fix
    }

    var sns = this.config.lightbox.sections;
    for (var i = 0; i < sns.length; i++) {
        var current_sns = sns[i];
        var node = document.getElementById(current_sns.id).nextSibling;
        var block = this.form_blocks[current_sns.type];
        var value = (ev[current_sns.map_to] !== undefined) ? ev[current_sns.map_to] : current_sns.default_value;
        block.set_value.call(this, node, value, ev, current_sns);
        if (sns[i].focus)
            block.focus.call(this, node);
    }

    scheduler._lightbox_id = id;
};
scheduler._lightbox_out=function(ev){
    var sns = this.config.lightbox.sections;
    for (var i=0; i < sns.length; i++) {
        var node = document.getElementById(sns[i].id);
        node=(node?node.nextSibling:node);
        var block=this.form_blocks[sns[i].type];
        var res=block.get_value.call(this,node,ev, sns[i]);
        if (sns[i].map_to!="auto")
            ev[sns[i].map_to]=res;
    }
    return ev;
};
scheduler._empty_lightbox=function(data){
    var id=scheduler._lightbox_id;
    var ev=this.getEvent(id);
    var box=this.getLightbox();

    this._lame_copy(ev, data);

    this.setEvent(ev.id,ev);
    this._edit_stop_event(ev,true);
    this.render_view_data();
};
scheduler.hide_lightbox=function(id){
    this.hideCover(this.getLightbox());
    this._lightbox_id=null;
    this.callEvent("onAfterLightbox",[]);
};
scheduler.hideCover=function(box){
    if (box) box.style.display="none";
    this.hide_cover();
};
scheduler.hide_cover=function(){
    if (this._cover)
        this._cover.parentNode.removeChild(this._cover);
    this._cover=null;
};
scheduler.show_cover=function(){
    this._cover=document.createElement("DIV");
    this._cover.className="dhx_cal_cover";
    var _document_height = ((document.height !== undefined) ? document.height : document.body.offsetHeight);
    var _scroll_height = ((document.documentElement) ? document.documentElement.scrollHeight : 0);
    this._cover.style.height = Math.max(_document_height, _scroll_height) + 'px';
    document.body.appendChild(this._cover);
};
scheduler.save_lightbox=function(){
    var data = this._lightbox_out({}, this._lame_copy(this.getEvent(this._lightbox_id)));
    if (this.checkEvent("onEventSave") && !this.callEvent("onEventSave",[this._lightbox_id, data, this._new_event]))
        return;
    this._empty_lightbox(data);
    this.hide_lightbox();
};
scheduler.startLightbox = function(id, box){
    this._lightbox_id = id;
    this._custom_lightbox = true;

    this._temp_lightbox = this._lightbox;
    this._lightbox = box;
    this.showCover(box);
};
scheduler.endLightbox = function(mode, box){
    this._edit_stop_event(scheduler.getEvent(this._lightbox_id),mode);
    if (mode)
        scheduler.render_view_data();
    this.hideCover(box);

    if (this._custom_lightbox){
        this._lightbox = this._temp_lightbox;
        this._custom_lightbox = false;
    }
    this._temp_lightbox = this._lightbox_id = null; // in case of custom lightbox user only calls endLightbox so we need to reset _lightbox_id
};
scheduler.resetLightbox = function(){
    if (scheduler._lightbox && !scheduler._custom_lightbox)
        scheduler._lightbox.parentNode.removeChild(scheduler._lightbox);
    scheduler._lightbox = null;
};
scheduler.cancel_lightbox=function(){
    this.callEvent("onEventCancel",[this._lightbox_id, this._new_event]);
    this.endLightbox(false);
    this.hide_lightbox();
};
scheduler._init_lightbox_events=function(){
    this.getLightbox().onclick=function(e){
        var src=e?e.target:event.srcElement;
        if (!src.className) src=src.previousSibling;
        if (src && src.className)
            switch(src.className){
                case "dhx_save_btn":
                    scheduler.save_lightbox();
                    break;
                case "dhx_delete_btn":
                    var c=scheduler.locale.labels.confirm_deleting;

                    scheduler._dhtmlx_confirm(c, scheduler.locale.labels.title_confirm_deleting, function(){
                        scheduler.deleteEvent(scheduler._lightbox_id);
                        scheduler._new_event = null; //clear flag, if it was unsaved event
                        scheduler.hide_lightbox();
                    });

                    break;
                case "dhx_cancel_btn":
                    scheduler.cancel_lightbox();
                    break;

                default:
                    if (src.getAttribute("dhx_button")) {
                        scheduler.callEvent("onLightboxButton", [src.className, src, e]);
                    } else {
                        var index, block, sec;
                        if (src.className.indexOf("dhx_custom_button") != -1) {
                            if (src.className.indexOf("dhx_custom_button_") != -1) {
                                index = src.parentNode.getAttribute("index");
                                sec = src.parentNode.parentNode;
                            } else {
                                index = src.getAttribute("index");
                                sec = src.parentNode;
                                src = src.firstChild;
                            }
                        }
                        if (index) {
                            block = scheduler.form_blocks[scheduler.config.lightbox.sections[index].type];
                            block.button_click(index, src, sec, sec.nextSibling);
                        }
                    }
                    break;
            }
    };
    this.getLightbox().onkeydown=function(e){
        switch((e||event).keyCode){
            case scheduler.keys.edit_save:
                if ((e||event).shiftKey) return;
                scheduler.save_lightbox();
                break;
            case scheduler.keys.edit_cancel:
                scheduler.cancel_lightbox();
                break;
            default:
                break;
        }
    };
};
scheduler.setLightboxSize=function(){
    var d = this._lightbox;
    if (!d) return;

    var con = d.childNodes[1];
    con.style.height="0px";
    con.style.height=con.scrollHeight+"px";
    d.style.height=con.scrollHeight+scheduler.xy.lightbox_additional_height+"px";
    con.style.height=con.scrollHeight+"px"; //it is incredible , how ugly IE can be
};

scheduler._init_dnd_events = function(){
    dhtmlxEvent(document.body, "mousemove", scheduler._move_while_dnd);
    dhtmlxEvent(document.body, "mouseup", scheduler._finish_dnd);
    scheduler._init_dnd_events = function(){};
};
scheduler._move_while_dnd = function(e){
    if (scheduler._dnd_start_lb){
        if (!document.dhx_unselectable){
            document.body.className += " dhx_unselectable";
            document.dhx_unselectable = true;
        }
        var lb = scheduler.getLightbox();
        var now = (e&&e.target)?[e.pageX, e.pageY]:[event.clientX, event.clientY];
        lb.style.top = scheduler._lb_start[1]+now[1]-scheduler._dnd_start_lb[1]+"px";
        lb.style.left = scheduler._lb_start[0]+now[0]-scheduler._dnd_start_lb[0]+"px";
    }
};
scheduler._ready_to_dnd = function(e){
    var lb = scheduler.getLightbox();
    scheduler._lb_start = [parseInt(lb.style.left,10), parseInt(lb.style.top,10)];
    scheduler._dnd_start_lb = (e&&e.target)?[e.pageX, e.pageY]:[event.clientX, event.clientY];
};
scheduler._finish_dnd = function(){
    if (scheduler._lb_start){
        scheduler._lb_start = scheduler._dnd_start_lb = false;
        document.body.className = document.body.className.replace(" dhx_unselectable","");
        document.dhx_unselectable = false;
    }
};
scheduler.getLightbox=function(){ //scheduler.config.wide_form=true;
    if (!this._lightbox){
        var d=document.createElement("DIV");
        d.className="dhx_cal_light";
        if (scheduler.config.wide_form)
            d.className+=" dhx_cal_light_wide";
        if (scheduler.form_blocks.recurring)
            d.className+=" dhx_cal_light_rec";

        if (/msie|MSIE 6/.test(navigator.userAgent))
            d.className+=" dhx_ie6";
        d.style.visibility="hidden";
        var html = this._lightbox_template;

        var buttons = this.config.buttons_left;
        for (var i = 0; i < buttons.length; i++)
            html+="<div class='dhx_btn_set dhx_left_btn_set "+buttons[i]+"_set'><div dhx_button='1' class='"+buttons[i]+"'></div><div>"+scheduler.locale.labels[buttons[i]]+"</div></div>";

        buttons = this.config.buttons_right;
        for (var i = 0; i < buttons.length; i++)
            html+="<div class='dhx_btn_set dhx_right_btn_set "+buttons[i]+"_set' style='float:right;'><div dhx_button='1' class='"+buttons[i]+"'></div><div>"+scheduler.locale.labels[buttons[i]]+"</div></div>";

        html+="</div>";
        d.innerHTML=html;
        if (scheduler.config.drag_lightbox){
            d.firstChild.onmousedown = scheduler._ready_to_dnd;
            d.firstChild.onselectstart = function(){ return false; };
            d.firstChild.style.cursor = "pointer";
            scheduler._init_dnd_events();

        }
        document.body.insertBefore(d,document.body.firstChild);
        this._lightbox=d;

        var sns=this.config.lightbox.sections;
        html="";
        for (var i=0; i < sns.length; i++) {
            var block=this.form_blocks[sns[i].type];
            if (!block) continue; //ignore incorrect blocks
            sns[i].id="area_"+this.uid();
            var button = "";
            if (sns[i].button){
                button = "<div class='dhx_custom_button' index='"+i+"'><div class='dhx_custom_button_"+sns[i].button+"'></div><div>"+this.locale.labels["button_"+sns[i].button]+"</div></div>";
            }

            if (this.config.wide_form){
                html+="<div class='dhx_wrap_section'>";
            }
            html+="<div id='"+sns[i].id+"' class='dhx_cal_lsection'>"+button+this.locale.labels["section_"+sns[i].name]+"</div>"+block.render.call(this,sns[i]);
            html+="</div>"
        }

        var ds=d.getElementsByTagName("div");
        for (var i=0; i<ds.length; i++) {
            var t_ds = ds[i];
            if (t_ds.className == "dhx_cal_larea") {
                t_ds.innerHTML = html;
                break;
            }
        }

        //sizes
        this.setLightboxSize();

        this._init_lightbox_events(this);
        d.style.display="none";
        d.style.visibility="visible";
    }
    return this._lightbox;
};
scheduler._lightbox_template="<div class='dhx_cal_ltitle'><span class='dhx_mark'>&nbsp;</span><span class='dhx_time'></span><span class='dhx_title'></span></div><div class='dhx_cal_larea'></div>";

scheduler._init_touch_events = function(){
    if (this.config.touch != "force")
        this.config.touch = this.config.touch
            && (   (navigator.userAgent.indexOf("Mobile")!=-1)
            || (navigator.userAgent.indexOf("iPad")!=-1)
            || (navigator.userAgent.indexOf("Android")!=-1)
            || (navigator.userAgent.indexOf("Touch")!=-1));

    if (this.config.touch){
        this.xy.scroll_width = 0;
        if (window.navigator.msPointerEnabled){
            this._touch_events(["MSPointerMove", "MSPointerDown", "MSPointerUp"], function(ev){
                if (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE ) return null;
                return ev;
            }, function(ev){
                return (!ev || ev.pointerType == ev.MSPOINTER_TYPE_MOUSE);
            });
        } else
            this._touch_events(["touchmove", "touchstart", "touchend"], function(ev){
                if (ev.touches && ev.touches.length > 1) return null;
                if (ev.touches[0])
                    return { target:ev.target, pageX:ev.touches[0].pageX, pageY:ev.touches[0].pageY };
                else
                    return ev;
            }, function(){ return false; });
    }
};

scheduler._touch_events = function(names, accessor, ignore){
    //webkit on android need to be handled separately
    var a_webkit = (navigator.userAgent.indexOf("Android")!=-1) && (navigator.userAgent.indexOf("WebKit")!=-1);
    var source, tracker, timer, drag_mode, scroll_mode, action_mode;
    var dblclicktime = 0;

    function check_direction_swipe(s_ev, e_ev, step){
        if (!s_ev || !e_ev) return;

        var dy = Math.abs(s_ev.pageY - e_ev.pageY);
        var dx = Math.abs(s_ev.pageX - e_ev.pageX);
        if (dx>step && (!dy || (dx/dy > 3))){
            if (s_ev.pageX > e_ev.pageX)
                scheduler._click.dhx_cal_next_button();
            else
                scheduler._click.dhx_cal_prev_button();
        }
    };
    dhtmlxEvent(document.body, names[0], function(e){
        if (ignore(e)) return;

        if (drag_mode){
            scheduler._on_mouse_move(accessor(e));
            scheduler._update_global_tip();
            if (e.preventDefault)
                e.preventDefault();
            e.cancelBubble = true;
            return false;
        }

        if (tracker && a_webkit){
            check_direction_swipe(tracker, accessor(e), 0);
        }

        tracker = accessor(e);
        //ignore common and scrolling moves
        if (!action_mode) return;

        //multitouch		
        if (!tracker){
            scroll_mode = true;
            return;
        }

        //target changed - probably in scroll mode

        if (source.target != tracker.target || (Math.abs(source.pageX - tracker.pageX) > 5) || (Math.abs(source.pageY - tracker.pageY) > 5)){
            scroll_mode = true;
            clearTimeout(timer);
        }

    });

    dhtmlxEvent(this._els["dhx_cal_data"][0], "scroll", drag_cancel);
    dhtmlxEvent(this._els["dhx_cal_data"][0], "touchcancel", drag_cancel);
    dhtmlxEvent(this._els["dhx_cal_data"][0], "contextmenu", function(e){
        if (action_mode){
            if (e && e.preventDefault)
                e.preventDefault();
            (e||event).cancelBubble = true;
            return false;
        }
    });
    dhtmlxEvent(this._els["dhx_cal_data"][0], names[1], function(e){
        if (ignore(e)) return;

        drag_mode = scroll_mode = tracker = false;
        action_mode = true;
        scheduler._temp_touch_block = true;

        var fake_event = tracker = accessor(e);
        if (!fake_event){
            scroll_mode = true;
            return;
        }

        //dbl click
        var now = new Date();

        if (!scroll_mode && !drag_mode && now - dblclicktime < 250){
            scheduler._click.dhx_cal_data(fake_event);
            window.setTimeout(function(){
                scheduler._on_dbl_click(fake_event);
            }, 50);

            if (e.preventDefault)
                e.preventDefault();
            e.cancelBubble = true;
            scheduler._block_next_stop = true;
            return false;
        }
        dblclicktime = now;

        //drag

        if (scroll_mode || drag_mode || !scheduler.config.touch_drag)
            return;

        //there is no target
        timer = setTimeout(function(){

            drag_mode = true;
            var target = source.target;
            if (target && target.className && target.className.indexOf("dhx_body") != -1)
                target = target.previousSibling;

            scheduler._on_mouse_down(source, target);
            if (scheduler._drag_mode && scheduler._drag_mode != "create"){
                var pos = -1;
                scheduler.for_rendered(scheduler._drag_id, function(node, i) {
                    pos = node.getBoundingClientRect().top;
                    node.style.display='none';
                    scheduler._rendered.splice(i, 1);
                });
                if (pos>=0){
                    var step = scheduler.config.time_step;
                    scheduler._move_pos_shift = step* Math.round((fake_event.pageY - pos)*60/(scheduler.config.hour_size_px*step));
                }
            }

            if (scheduler.config.touch_tip)
                scheduler._show_global_tip();
            scheduler._on_mouse_move(source);
        },scheduler.config.touch_drag);

        source = fake_event;
    });
    function drag_cancel(e){
        scheduler._hide_global_tip();
        if (drag_mode){
            scheduler._on_mouse_up( accessor(e||event) );
            scheduler._temp_touch_block = false;
        }
        scheduler._drag_id = null;
        scheduler._drag_mode=null;
        scheduler._drag_pos=null;

        clearTimeout(timer);
        drag_mode = action_mode = false;
        scroll_mode = true;
    }
    dhtmlxEvent(this._els["dhx_cal_data"][0], names[2], function(e){
        if (ignore(e)) return;

        if (!drag_mode)
            check_direction_swipe(source, tracker, 200);

        if (drag_mode)
            scheduler._ignore_next_click = true;

        drag_cancel(e);
        if (scheduler._block_next_stop){
            scheduler._block_next_stop = false;
            if (e.preventDefault)
                e.preventDefault();
            e.cancelBubble = true;
            return false;
        }
    });

    dhtmlxEvent(document.body, names[2], drag_cancel);
};

scheduler._show_global_tip = function(){
    scheduler._hide_global_tip();

    var toptip = scheduler._global_tip = document.createElement("DIV");
    toptip.className='dhx_global_tip';

    scheduler._update_global_tip(1);

    document.body.appendChild(toptip);
};
scheduler._update_global_tip = function(init){
    var toptip = scheduler._global_tip;
    if (toptip){
        var time = "";
        if (scheduler._drag_id && !init){
            var ev = scheduler.getEvent(scheduler._drag_id);
            if (ev)
                time = "<div>" + (ev._timed ? scheduler.templates.event_header(ev.start_date, ev.end_date, ev):scheduler.templates.day_date(ev.start_date, ev.end_date, ev)) + "</div>";
        }

        if (scheduler._drag_mode == "create" || scheduler._drag_mode == "new-size")
            toptip.innerHTML = (scheduler.locale.drag_to_create || "Drag to create")+time;
        else
            toptip.innerHTML = (scheduler.locale.drag_to_move || "Drag to move")+time;
    }
};
scheduler._hide_global_tip = function(){
    var toptip = scheduler._global_tip;
    if (toptip && toptip.parentNode){
        toptip.parentNode.removeChild(toptip);
        scheduler._global_tip = 0;
    }
};

scheduler._dp_init=function(dp){
    dp._methods=["_set_event_text_style","","changeEventId","deleteEvent"];

    this.attachEvent("onEventAdded",function(id){
        if (!this._loading && this._validId(id))
            dp.setUpdated(id,true,"inserted");
    });
    this.attachEvent("onConfirmedBeforeEventDelete", function(id){
        if (!this._validId(id)) return;
        var z=dp.getState(id);

        if (z=="inserted" || this._new_event) {  dp.setUpdated(id,false);		return true; }
        if (z=="deleted")  return false;
        if (z=="true_deleted")  return true;

        dp.setUpdated(id,true,"deleted");
        return false;
    });
    this.attachEvent("onEventChanged",function(id){
        if (!this._loading && this._validId(id))
            dp.setUpdated(id,true,"updated");
    });

    dp._getRowData=function(id,pref){
        var ev=this.obj.getEvent(id);
        var data = {};

        for (var a in ev){
            if (a.indexOf("_")==0) continue;
            if (ev[a] && ev[a].getUTCFullYear) //not very good, but will work
                data[a] = this.obj.templates.xml_format(ev[a]);
            else
                data[a] = ev[a];
        }

        return data;
    };
    dp._clearUpdateFlag=function(){};

    dp.attachEvent("insertCallback", scheduler._update_callback);
    dp.attachEvent("updateCallback", scheduler._update_callback);
    dp.attachEvent("deleteCallback", function(upd, id) {
        this.obj.setUserData(id, this.action_param, "true_deleted");
        this.obj.deleteEvent(id);
    });

};

scheduler._validId=function(id){
    return true;
};

scheduler.setUserData=function(id,name,value){
    if (id)
        this.getEvent(id)[name]=value;
    else
        this._userdata[name]=value;
};
scheduler.getUserData=function(id,name){
    return id?this.getEvent(id)[name]:this._userdata[name];
};
scheduler._set_event_text_style=function(id,style){
    this.for_rendered(id,function(r){
        r.style.cssText+=";"+style;
    });
    var ev = this.getEvent(id);
    ev["_text_style"]=style;
    this.event_updated(ev);
};

scheduler._update_callback = function(upd,id){
    var data		=	scheduler._xmlNodeToJSON(upd.firstChild);
    data.text		=	data.text||data._tagvalue;
    data.start_date	=	scheduler.templates.xml_date(data.start_date);
    data.end_date	=	scheduler.templates.xml_date(data.end_date);

    scheduler.addEvent(data);
};
scheduler._skin_settings = {
    fix_tab_position: [1,0],
    use_select_menu_space: [1,0],
    wide_form: [1,0],

    hour_size_px: [44,42],
    displayed_event_color: ["#ff4a4a", "ffc5ab"],
    displayed_event_text_color: ["#ffef80", "7e2727"]
};

scheduler._skin_xy = {
    lightbox_additional_height: [90,50],
    nav_height: [59,22],
    bar_height: [24,20]
};

scheduler._configure = function(col, data, skin){
    for (var key in data)
        if (typeof col[key] == "undefined")
            col[key] = data[key][skin];
};
scheduler._skin_init = function(){
    if (!scheduler.skin){
        var links = document.getElementsByTagName("link");
        for (var i = 0; i < links.length; i++) {
            var res = links[i].href.match("dhtmlxscheduler_([a-z]+).css");
            if (res){
                scheduler.skin = res[1];
                break;
            }
        }
    }



    var set = 0;
    if (scheduler.skin && scheduler.skin != "terrace") set = 1;

    //apply skin related settings
    this._configure(scheduler.config, scheduler._skin_settings, set);
    this._configure(scheduler.xy, scheduler._skin_xy, set);

    //classic skin need not any further customization
    if (set) return;


    var minic = scheduler.config.minicalendar;
    if (minic) minic.padding = 14;

    scheduler.templates.event_bar_date = function(start,end,ev) {
        var deadlineTimestamp = ev.end_date.getTime();
        var currentTimestamp = new Date().getTime();
        var border = getBorderColor(deadlineTimestamp, currentTimestamp);
        if (ev.task){
            var typeOfTask = ev.task.taskType;
            var nameOfTask = ev.task.name;
        } else{
            ev.task = {};
        }

        return '<div class="dhx_cal_event_line event-edge '+border+'" style="margin-left:-10px"><i class="icon-'+ev.task.taskType+'"></i> <span style="font-size:10px"> <strong>'+ scheduler.templates.event_date(start)+'</strong> '+ ev.task.name+'</span> </div> ';
    };

    scheduler._lightbox_template="<div class='dhx_cal_ltitle'><span class='dhx_mark'>&nbsp;</span><span class='dhx_time'></span><span class='dhx_title'></span><div class='dhx_close_icon'></div></div><div class='dhx_cal_larea'></div>";
    scheduler.attachEvent("onTemplatesReady", function() {

        var date_to_str = scheduler.date.date_to_str("%d");
        var old_month_day = scheduler.templates.month_day;
        scheduler.templates.month_day = function(date) {
            if (this._mode == "month") {
                var label = date_to_str(date);
                if (date.getDate() == 1) {
                    label = scheduler.locale.date.month_full[date.getMonth()] + " " + label;
                }
                if (+date == +scheduler.date.date_part(new Date)) {
                    label = scheduler.locale.labels.dhx_cal_today_button + " " + label;
                }
                return label;
            } else {
                return old_month_day.call(this, date);
            }
        };

        if (scheduler.config.fix_tab_position){
            var navline_divs = scheduler._els["dhx_cal_navline"][0].getElementsByTagName('div');
            var tabs = [];
            var last = 211;
            for (var i=0; i<navline_divs.length; i++) {
                var div = navline_divs[i];
                var name = div.getAttribute("name");
                if (name) { // mode tab
                    div.style.right = "auto";
                    switch (name) {
                        case "day_tab":
                            div.style.left = "0px";
                            break;
                        case "week_tab":
                            div.style.left = "50px";
                            break;
                        case "month_tab":
                            div.style.left = "105px";
                            break;
                        default:
                            div.style.right = last+"px";
                            div.className += " dhx_cal_tab_standalone";
                            last = last + 14 + div.offsetWidth;
                            break;
                    }
                }

            }
        }
    });
    scheduler._skin_init = function(){};
};


if (window.jQuery){

    (function( $ ){

        var methods = [];
        $.fn.dhx_scheduler = function(config){
            if (typeof(config) === 'string') {
                if (methods[config] ) {
                    return methods[config].apply(this, []);
                }else {
                    $.error('Method ' +  config + ' does not exist on jQuery.dhx_scheduler');
                }
            } else {
                var views = [];
                this.each(function() {
                    if (this && this.getAttribute){
                        if (!this.getAttribute("dhxscheduler")){
                            for (var key in config)
                                if (key!="data")
                                    scheduler.config[key] = config[key];

                            if (!this.getElementsByTagName("div").length){
                                this.innerHTML = '<div class="dhx_cal_navline"><div class="dhx_cal_prev_button">&nbsp;</div><div class="dhx_cal_next_button">&nbsp;</div><div class="dhx_cal_today_button"></div><div class="dhx_cal_date"></div><div class="dhx_cal_tab" name="day_tab" style="right:204px;"></div><div class="dhx_cal_tab" name="week_tab" style="right:140px;"></div><div class="dhx_cal_tab" name="month_tab" style="right:76px;"></div></div><div class="dhx_cal_header"></div><div class="dhx_cal_data"></div>';
                                this.className += " dhx_cal_container";
                            }
                            scheduler.init(this, scheduler.config.date, scheduler.config.mode);
                            if (config.data)
                                scheduler.parse(config.data);

                            views.push(scheduler);
                        }
                    }
                });

                if (views.length === 1) return views[0];
                return views;
            }
        };

    })(jQuery);

}


/*_TOPICS_
 @0:Initialization
 @1:Selection control
 @2:Add/delete
 @3:Private
 @4:Node/level control
 @5:Checkboxes/user data manipulation
 @6:Appearence control
 @7: Handlers
 */

function xmlPointer(data){
    this.d=data;
}
xmlPointer.prototype={
    text:function(){ if (!_isFF) return this.d.xml; var x = new XMLSerializer();   return x.serializeToString(this.d); },
    get:function(name){return this.d.getAttribute(name); },
    exists:function(){return !!this.d },
    content:function(){return this.d.firstChild?this.d.firstChild.data:""; }, // <4k in FF
    each:function(name,f,t,i){  var a=this.d.childNodes; var c=new xmlPointer(); if (a.length) for (i=i||0; i<a.length; i++) if (a[i].tagName==name) { c.d=a[i]; if(f.apply(t,[c,i])==-1) return; } },
    get_all:function(){ var a={}; var b=this.d.attributes; for (var i=0; i<b.length; i++) a[b[i].name]=b[i].value; return a; },
    sub:function(name){ var a=this.d.childNodes; var c=new xmlPointer(); if (a.length) for (var i=0; i<a.length; i++) if (a[i].tagName==name) { c.d=a[i]; return c; } },
    up:function(name){ return new xmlPointer(this.d.parentNode);  },
    set:function(name,val){ this.d.setAttribute(name,val);  },
    clone:function(name){ return new xmlPointer(this.d); },
    sub_exists:function(name){ var a=this.d.childNodes; if (a.length) for (var i=0; i<a.length; i++) if (a[i].tagName==name) return true;  return false;  },
    through:function(name,rule,v,f,t){  var a=this.d.childNodes; if (a.length) for (var i=0; i<a.length; i++) { if (a[i].tagName==name && a[i].getAttribute(rule)!=null && a[i].getAttribute(rule)!="" &&  (!v || a[i].getAttribute(rule)==v )) { var c=new xmlPointer(a[i]);  f.apply(t,[c,i]); } var w=this.d; this.d=a[i]; this.through(name,rule,v,f,t); this.d=w;  } }
}



/**
 *     @desc: tree constructor
 *     @param: htmlObject - parent html object or id of parent html object
 *     @param: width - tree width
 *     @param: height - tree height
 *     @param: rootId - id of virtual root node (same as tree node id attribute in xml)
 *     @type: public
 *     @topic: 0
 */


function dhtmlXTreeObject(htmlObject, width, height, rootId){
    if (_isIE) try { document.execCommand("BackgroundImageCache", false, true); } catch (e){}
    if (typeof(htmlObject)!="object")
        this.parentObject=document.getElementById(htmlObject);
    else
        this.parentObject=htmlObject;

    this.parentObject.style.overflow="hidden";
    this._itim_dg=true;
    this.dlmtr=",";
    this.dropLower=false;
    this.enableIEImageFix();

    this.xmlstate=0;
    this.mytype="tree";
    this.smcheck=true;   //smart checkboxes
    this.width=width;
    this.height=height;
    this.rootId=rootId;
    this.childCalc=null;
    this.def_img_x="18px";
    this.def_img_y="18px";
    this.def_line_img_x="18px";
    this.def_line_img_y="18px";

    this._dragged=new Array();
    this._selected=new Array();

    this.style_pointer="pointer";

    this._aimgs=true;
    this.htmlcA=" [";
    this.htmlcB="]";
    this.lWin=window;
    this.cMenu=0;
    this.mlitems=0;
    this.iconURL="";
    this.dadmode=0;
    this.slowParse=false;
    this.autoScroll=true;
    this.hfMode=0;
    this.nodeCut=new Array();
    this.XMLsource=0;
    this.XMLloadingWarning=0;
    this._idpull={};
    this._pullSize=0;
    this.treeLinesOn=true;
    this.tscheck=false;
    this.timgen=true;
    this.dpcpy=false;
    this._ld_id=null;
    this._oie_onXLE=[];
    this.imPath=window.dhx_globalImgPath||"";
    this.checkArray=new Array("iconUncheckAll.gif","iconCheckAll.gif","iconCheckGray.gif","iconUncheckDis.gif","iconCheckDis.gif","iconCheckDis.gif");
    this.radioArray=new Array("radio_off.gif","radio_on.gif","radio_on.gif","radio_off.gif","radio_on.gif","radio_on.gif");

    this.lineArray=new Array("line2.gif","line3.gif","line4.gif","blank.gif","blank.gif","line1.gif");
    this.minusArray=new Array("minus2.gif","minus3.gif","minus4.gif","minus.gif","minus5.gif");
    this.plusArray=new Array("plus2.gif","plus3.gif","plus4.gif","plus.gif","plus5.gif");
    this.imageArray=new Array("leaf.gif","folderOpen.gif","folderClosed.gif");
    this.cutImg= new Array(0,0,0);
    this.cutImage="but_cut.gif";

    dhtmlxEventable(this);

    this.dragger= new dhtmlDragAndDropObject();
//create root
    this.htmlNode=new dhtmlXTreeItemObject(this.rootId,"",0,this);
    this.htmlNode.htmlNode.childNodes[0].childNodes[0].style.display="none";
    this.htmlNode.htmlNode.childNodes[0].childNodes[0].childNodes[0].className="hiddenRow";
//init tree structures
    this.allTree=this._createSelf();
    this.allTree.appendChild(this.htmlNode.htmlNode);
    if(_isFF){
        this.allTree.childNodes[0].width="100%";
        this.allTree.childNodes[0].style.overflow="hidden";
    }

    var self=this;
    this.allTree.onselectstart=new Function("return false;");
    if (_isMacOS)
        this.allTree.oncontextmenu = function(e){
            return self._doContClick(e||window.event, true);
        };
    this.allTree.onmousedown = function(e){ return self._doContClick(e||window.event); };

    this.XMLLoader=new dtmlXMLLoaderObject(this._parseXMLTree,this,true,this.no_cashe);
    if (_isIE) this.preventIECashing(true);

//#__pro_feature:01112006{
//#complex_move:01112006{
    this.selectionBar=document.createElement("DIV");
    this.selectionBar.className="selectionBar";
    this.selectionBar.innerHTML="&nbsp;";
    this.selectionBar.style.display="none";
    this.allTree.appendChild(this.selectionBar);
//#}
//#}


    if (window.addEventListener) window.addEventListener("unload",function(){try{  self.destructor(); } catch(e){}},false);
    if (window.attachEvent) window.attachEvent("onunload",function(){ try{ self.destructor(); } catch(e){}});

    this.setImagesPath=this.setImagePath;
    this.setIconsPath=this.setIconPath;

    if (dhtmlx.image_path) this.setImagePath(dhtmlx.image_path);
    if (dhtmlx.skin) this.setSkin(dhtmlx.skin);

    return this;
};


/**
 *     @desc: set default data transfer mode
 *     @param: mode - data mode (json,xml,csv)
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.setDataMode=function(mode){
    this._datamode=mode;
}



dhtmlXTreeObject.prototype._doContClick=function(ev, force){
    if (!force && ev.button!=2) {
        if(this._acMenu){
            if (this._acMenu.hideContextMenu)
                this._acMenu.hideContextMenu()
            else
                this.cMenu._contextEnd();
        }
        return true;
    }




    var el=(_isIE?ev.srcElement:ev.target);
    while ((el)&&(el.tagName!="BODY")) {
        if (el.parentObject) break;
        el=el.parentNode;
    }

    if ((!el)||(!el.parentObject)) return true;

    var obj=el.parentObject;

    if (!this.callEvent("onRightClick",[obj.id,ev]))
        (ev.srcElement||ev.target).oncontextmenu = function(e){ (e||event).cancelBubble=true; return false; };

    this._acMenu=(obj.cMenu||this.cMenu);
    if (this._acMenu){
        if (!(this.callEvent("onBeforeContextMenu", [
            obj.id
        ]))) return true;

        (ev.srcElement||ev.target).oncontextmenu = function(e){ (e||event).cancelBubble=true; return false; };

        if (this._acMenu.showContextMenu){

            var dEl0=window.document.documentElement;
            var dEl1=window.document.body;
            var corrector = new Array((dEl0.scrollLeft||dEl1.scrollLeft),(dEl0.scrollTop||dEl1.scrollTop));
            if (_isIE){
                var x= ev.clientX+corrector[0];
                var y = ev.clientY+corrector[1];
            } else {
                var x= ev.pageX;
                var y = ev.pageY;
            }

            this._acMenu.showContextMenu(x-1,y-1)
            this.contextID=obj.id;
            ev.cancelBubble=true;
            this._acMenu._skip_hide=true;
        } else {
            el.contextMenuId=obj.id;
            el.contextMenu=this._acMenu;
            el.a=this._acMenu._contextStart;
            el.a(el, ev);
            el.a=null;
        }

        return false;
    }
    return true;
}


/**
 *     @desc: replace IMG tag with background images - solve problem with IE image caching , not works for IE6 SP1
 *     @param: mode - true/false - enable/disable fix
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableIEImageFix=function(mode){
    if (!mode){

        this._getImg=function(id){ return document.createElement((id==this.rootId)?"div":"img"); }
        this._setSrc=function(a,b){ a.src=b; }
        this._getSrc=function(a){ return a.src; }
    }	else	{

        this._getImg=function(){ var z=document.createElement("DIV"); z.innerHTML="&nbsp;"; z.className="dhx_bg_img_fix"; return z; }
        this._setSrc=function(a,b){ a.style.backgroundImage="url("+b+")"; }
        this._getSrc=function(a){ var z=a.style.backgroundImage;  return z.substr(4,z.length-5).replace(/(^")|("$)/g,""); }
    }
}

/**
 *	@desc: deletes tree and clears memory
 *	@type: public
 */
dhtmlXTreeObject.prototype.destructor=function(){
    for (var a in this._idpull){
        var z=this._idpull[a];
        if (!z) continue;
        z.parentObject=null;z.treeNod=null;z.childNodes=null;z.span=null;z.tr.nodem=null;z.tr=null;z.htmlNode.objBelong=null;z.htmlNode=null;
        this._idpull[a]=null;
    }
    this.parentObject.innerHTML="";

    if(this.XMLLoader)
        this.XMLLoader.destructor();

    this.allTree.onselectstart = null;
    this.allTree.oncontextmenu = null;
    this.allTree.onmousedown = null;

    for(var a in this){
        this[a]=null;
    }
}

function cObject(){
    return this;
}
cObject.prototype= new Object;
cObject.prototype.clone = function () {
    function _dummy(){};
    _dummy.prototype=this;
    return new _dummy();
}

/**
 *   @desc: tree node constructor
 *   @param: itemId - node id
 *   @param: itemText - node label
 *   @param: parentObject - parent item object
 *   @param: treeObject - tree object
 *   @param: actionHandler - onclick event handler(optional)
 *   @param: mode - do not show images
 *   @type: private
 *   @topic: 0
 */
function dhtmlXTreeItemObject(itemId,itemText,parentObject,treeObject,actionHandler,mode){
    this.htmlNode="";
    this.acolor="";
    this.scolor="";
    this.tr=0;
    this.childsCount=0;
    this.tempDOMM=0;
    this.tempDOMU=0;
    this.dragSpan=0;
    this.dragMove=0;
    this.span=0;
    this.closeble=1;
    this.childNodes=new Array();
    this.userData=new cObject();


    this.checkstate=0;
    this.treeNod=treeObject;
    this.label=itemText;
    this.parentObject=parentObject;
    this.actionHandler=actionHandler;
    this.images=new Array(treeObject.imageArray[0],treeObject.imageArray[1],treeObject.imageArray[2]);


    this.id=treeObject._globalIdStorageAdd(itemId,this);
    if (this.treeNod.checkBoxOff ) this.htmlNode=this.treeNod._createItem(1,this,mode);
    else  this.htmlNode=this.treeNod._createItem(0,this,mode);

    this.htmlNode.objBelong=this;
    return this;
};


/**
 *     @desc: register node
 *     @type: private
 *     @param: itemId - node id
 *     @param: itemObject - node object
 *     @topic: 3
 */
dhtmlXTreeObject.prototype._globalIdStorageAdd=function(itemId,itemObject){
    if (this._globalIdStorageFind(itemId,1,1)) {   itemId=itemId +"_"+(new Date()).valueOf(); return this._globalIdStorageAdd(itemId,itemObject); }
    this._idpull[itemId]=itemObject;
    this._pullSize++;
    return itemId;
};

/**
 *     @desc: unregister node
 *     @type: private
 *     @param: itemId - node id
 *     @topic: 3
 */
dhtmlXTreeObject.prototype._globalIdStorageSub=function(itemId){
    if (this._idpull[itemId]){
        this._unselectItem(this._idpull[itemId]);
        this._idpull[itemId]=null;
        this._pullSize--;
    }
    if ((this._locker)&&(this._locker[itemId])) this._locker[itemId]=false;
};

/**
 *     @desc: return node object
 *     @param: itemId - node id
 *     @type: private
 *     @topic: 3
 */
dhtmlXTreeObject.prototype._globalIdStorageFind=function(itemId,skipXMLSearch,skipParsing,isreparse){
    var z=this._idpull[itemId]
    if (z){
//#__pro_feature:01112006{
//#smart_parsing:01112006{
        if ((z.unParsed)&&(!skipParsing))
        {
            this.reParse(z,0);
        }
        if (this._srnd && !z.htmlNode) this._buildSRND(z,skipParsing);
        if ((isreparse)&&(this._edsbpsA)){
            for (var j=0; j<this._edsbpsA.length; j++)
                if (this._edsbpsA[j][2]==itemId){
                    dhtmlxError.throwError("getItem","Requested item still in parsing process.",itemId);
                    return null;
                }
        }
//#}
//#}
        return z;
    }
//#__pro_feature:01112006{
//#smart_parsing:01112006{
    if ((this.slowParse)&&(itemId!=0)&&(!skipXMLSearch)) return this.preParse(itemId);
    else
//#}
//#}
        return null;
};
//#__pro_feature:01112006{
//#smart_parsing:01112006{
dhtmlXTreeObject.prototype._getSubItemsXML=function(p){
    var z=[];
    p.each("item",function(c){
        z.push(c.get("id"));
    },this)
    return z.join(",");
}

/**
 *     @desc: enable/disable smart XML parsing mode (usefull for big, well structured XML)
 *     @beforeInit: 1
 *     @param: mode - 1 - on, 0 - off;
 *     @type: public
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableSmartXMLParsing=function(mode) { this.slowParse=convertStringToBoolean(mode); };
dhtmlXTreeObject.prototype.findXML=function(node,par,val){  }

dhtmlXTreeObject.prototype._getAllCheckedXML=function(p,list,mode){
    var z=[];

    if (mode==2)
        p.through("item","checked",-1,function(c){
            z.push(c.get("id"));
        },this);

    if (mode==1)
        p.through("item","id",null,function(c){
            if (c.get("checked") && (c.get("checked") !=-1))
                z.push(c.get("id"));
        },this);

    if (mode==0)
        p.through("item","id",null,function(c){
            if (!c.get("checked") || c.get("checked")==0 )
                z.push(c.get("id"));
        },this);
    if(z.length)
        return list+(list?",":"")+z.join(",");
    if (list) return list; else return "";
};


/**
 *     @desc: change state of node's checkbox and all childnodes checkboxes
 *     @type: private
 *     @param: itemId - target node id
 *     @param: state - checkbox state
 *     @param: sNode - target node object (optional, used by private methods)
 *     @topic: 5
 */
dhtmlXTreeObject.prototype._setSubCheckedXML=function(state,p){
    var val= state?"1":"";
    p.through("item","id",null,function(c){
        c.set("checked",val);
    },this);
}

dhtmlXTreeObject.prototype._getAllScraggyItemsXML=function(p,x){
    var z=[];
    var fff=function(c){
        if (!c.sub_exists("item"))
            z.push(c.get("id"));
        else
            c.each("item",fff,this);
    }
    fff(p);
    return z.join(",");
}

dhtmlXTreeObject.prototype._getAllFatItemsXML=function(p,x){
    var z=[];
    var fff=function(c){
        if (!c.sub_exists("item"))
            return;
        z.push(c.get("id"));
        c.each("item",fff,this);
    }
    fff(p);
    return z.join(",");
}

dhtmlXTreeObject.prototype._getAllSubItemsXML=function(itemId,z,p){
    var z=[];
    p.through("item","id",null,function(c){
        z.push(c.get("id"));
    },this)
    return z.join(",");
}

/**
 *     @desc: parse stored xml
 *     @param: node - XML node
 *     @type: private
 *     @edition: Professional
 *     @topic: 3
 */
dhtmlXTreeObject.prototype.reParse=function(node){
    var that=this;
    if (!this.parsCount) that.callEvent("onXLS",[that,node.id]);
    this.xmlstate=1;

    var tmp=node.unParsed;
    node.unParsed=0;
//               if (confirm("reParse "+node.id)) { window.asdasd.asdasd(); }
    this.XMLloadingWarning=1;
    var oldpid=this.parsingOn;
    var oldmd=this.waitUpdateXML;
    var oldpa=this.parsedArray;

    this.parsedArray=new Array();
    this.waitUpdateXML=false;
    this.parsingOn=node.id;
    this.parsedArray=new Array();

    this.setCheckList="";
    this._parse(tmp,node.id,2);
    var chArr=this.setCheckList.split(this.dlmtr);

    for (var i=0; i<this.parsedArray.length; i++)
        node.htmlNode.childNodes[0].appendChild(this.parsedArray[i]);

    if (tmp.get("order") && tmp.get("order")!="none")
        this._reorderBranch(node,tmp.get("order"),true);

    this.oldsmcheck=this.smcheck;
    this.smcheck=false;

    for (var n=0; n<chArr.length; n++)
        if (chArr[n])  this.setCheck(chArr[n],1);
    this.smcheck=this.oldsmcheck;

    this.parsingOn=oldpid;
    this.waitUpdateXML=oldmd;
    this.parsedArray=oldpa;
    this.XMLloadingWarning=0;
    this._redrawFrom(this,node);
    if (this._srnd && !node._sready)
        this.prepareSR(node.id);
    this.xmlstate=0;
    return true;
}

/**
 *     @desc: search for item in unparsed chunks
 *     @param: itemId - item ID
 *     @type: private
 *     @edition: Professional
 *     @topic: 3
 */
dhtmlXTreeObject.prototype.preParse=function(itemId){
    if (!itemId || !this._p) return null;
    var result=false;
    this._p.clone().through("item","id",itemId,function(c){
        this._globalIdStorageFind(c.up().get("id"));
        return result=true;
    },this);
    if (result){
        var n=this._globalIdStorageFind(itemId,true,false);
        if (!n)
            dhtmlxError.throwError("getItem","The item "+itemId+" not operable. Seems you have non-unique|incorrect IDs in tree's XML.",itemId);
    }
    return n;
}

//#}
//#}

/**
 *     @desc: escape string
 *     @param: itemId - item ID
 *     @type: private
 *     @topic: 3
 */
dhtmlXTreeObject.prototype._escape=function(str){
    switch(this.utfesc){
        case "none":
            return str;
            break;
        case "utf8":
            return encodeURIComponent(str);
            break;
        default:
            return escape(str);
            break;
    }
}



/**
 *     @desc: create and return  new line in tree
 *     @type: private
 *     @param: htmlObject - parent Node object
 *     @param: node - item object
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._drawNewTr=function(htmlObject,node)
{
    var tr =document.createElement('tr');
    var td1=document.createElement('td');
    var td2=document.createElement('td');
    td1.appendChild(document.createTextNode(" "));
    td2.colSpan=3;
    td2.appendChild(htmlObject);
    tr.appendChild(td1);  tr.appendChild(td2);
    return tr;
};
/**
 *     @desc: load tree from xml string
 *     @type: public
 *     @param: xmlString - XML string
 *     @param: afterCall - function which will be called after xml loading
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.loadXMLString=function(xmlString,afterCall){
    var that=this;
    if (!this.parsCount) this.callEvent("onXLS",[that,null]);
    this.xmlstate=1;

    if (afterCall) this.XMLLoader.waitCall=afterCall;
    this.XMLLoader.loadXMLString(xmlString);  };
/**
 *     @desc: load tree from xml file
 *     @type: public
 *     @param: file - link to XML file
 *     @param: afterCall - function which will be called after xml loading
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.loadXML=function(file,afterCall){
    if (this._datamode && this._datamode!="xml") return this["load"+this._datamode.toUpperCase()](file,afterCall);
    var that=this;
    if (!this.parsCount) this.callEvent("onXLS",[that,this._ld_id]);
    this._ld_id=null;
    this.xmlstate=1;
    this.XMLLoader=new dtmlXMLLoaderObject(this._parseXMLTree,this,true,this.no_cashe);

    if (afterCall) this.XMLLoader.waitCall=afterCall;
    this.XMLLoader.loadXML(file);
};
/**
 *     @desc: create new child node
 *     @type: private
 *     @param: parentObject - parent node object
 *     @param: itemId - new node id
 *     @param: itemText - new node text
 *     @param: itemActionHandler - function fired on node select event
 *     @param: image1 - image for node without children;
 *     @param: image2 - image for closed node;
 *     @param: image3 - image for opened node
 *     @param: optionStr - string of otions
 *     @param: childs - node childs flag (for dynamical trees) (optional)
 *     @param: beforeNode - node, after which new node will be inserted (optional)
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._attachChildNode=function(parentObject,itemId,itemText,itemActionHandler,image1,image2,image3,optionStr,childs,beforeNode,afterNode){

    if (beforeNode && beforeNode.parentObject) parentObject=beforeNode.parentObject;
    if (((parentObject.XMLload==0)&&(this.XMLsource))&&(!this.XMLloadingWarning))
    {
        parentObject.XMLload=1;
        this._loadDynXML(parentObject.id);

    }

    var Count=parentObject.childsCount;
    var Nodes=parentObject.childNodes;


    if (afterNode && afterNode.tr.previousSibling){
        if (afterNode.tr.previousSibling.previousSibling){
            beforeNode=afterNode.tr.previousSibling.nodem;
        }
        else
            optionStr=optionStr.replace("TOP","")+",TOP";
    }

    if (beforeNode)
    {
        var ik,jk;
        for (ik=0; ik<Count; ik++)
            if (Nodes[ik]==beforeNode)
            {
                for (jk=Count; jk!=ik; jk--)
                    Nodes[1+jk]=Nodes[jk];
                break;
            }
        ik++;
        Count=ik;
    }


    if (optionStr) {
        var tempStr=optionStr.split(",");
        for (var i=0; i<tempStr.length; i++)
        {
            switch(tempStr[i])
            {
                case "TOP": if (parentObject.childsCount>0) { beforeNode=new Object; beforeNode.tr=parentObject.childNodes[0].tr.previousSibling; }
                    parentObject._has_top=true;
                    for  (ik=Count; ik>0; ik--)
                        Nodes[ik]=Nodes[ik-1];
                    Count=0;
                    break;
            }
        };
    };

    var n;
    if (!(n=this._idpull[itemId]) || n.span!=-1){
        n=Nodes[Count]=new dhtmlXTreeItemObject(itemId,itemText,parentObject,this,itemActionHandler,1);
        itemId = Nodes[Count].id;
        parentObject.childsCount++;
    }

    if(!n.htmlNode) {
        n.label=itemText;
        n.htmlNode=this._createItem((this.checkBoxOff?1:0),n);
        n.htmlNode.objBelong=n;
    }

    if(image1) n.images[0]=image1;
    if(image2) n.images[1]=image2;
    if(image3) n.images[2]=image3;


    var tr=this._drawNewTr(n.htmlNode);
    if ((this.XMLloadingWarning)||(this._hAdI))
        n.htmlNode.parentNode.parentNode.style.display="none";


    if ((beforeNode)&&(beforeNode.tr.nextSibling))
        parentObject.htmlNode.childNodes[0].insertBefore(tr,beforeNode.tr.nextSibling);
    else
    if (this.parsingOn==parentObject.id){
        this.parsedArray[this.parsedArray.length]=tr;
    }
    else
        parentObject.htmlNode.childNodes[0].appendChild(tr);


    if ((beforeNode)&&(!beforeNode.span)) beforeNode=null;

    if (this.XMLsource) if ((childs)&&(childs!=0)) n.XMLload=0; else n.XMLload=1;
    n.tr=tr;
    tr.nodem=n;

    if (parentObject.itemId==0)
        tr.childNodes[0].className="hiddenRow";

    if ((parentObject._r_logic)||(this._frbtr))
        this._setSrc(n.htmlNode.childNodes[0].childNodes[0].childNodes[1].childNodes[0],this.imPath+this.radioArray[0]);


    if (optionStr) {
        var tempStr=optionStr.split(",");

        for (var i=0; i<tempStr.length; i++)
        {
            switch(tempStr[i])
            {
                case "SELECT": this.selectItem(itemId,false); break;
                case "CALL": this.selectItem(itemId,true);   break;
                case "CHILD":  n.XMLload=0;  break;
                case "CHECKED":
                    if (this.XMLloadingWarning)
                        this.setCheckList+=this.dlmtr+itemId;
                    else
                        this.setCheck(itemId,1);
                    break;
                case "HCHECKED":
                    this._setCheck(n,"unsure");
                    break;
                case "OPEN": n.openMe=1;  break;
            }
        };
    };

    if (!this.XMLloadingWarning)
    {
        if ((this._getOpenState(parentObject)<0)&&(!this._hAdI)) this.openItem(parentObject.id);

        if (beforeNode)
        {
            this._correctPlus(beforeNode);
            this._correctLine(beforeNode);
        }
        this._correctPlus(parentObject);
        this._correctLine(parentObject);
        this._correctPlus(n);
        if (parentObject.childsCount>=2)
        {
            this._correctPlus(Nodes[parentObject.childsCount-2]);
            this._correctLine(Nodes[parentObject.childsCount-2]);
        }
        if (parentObject.childsCount!=2) this._correctPlus(Nodes[0]);

        if (this.tscheck) this._correctCheckStates(parentObject);

        if (this._onradh){
            if (this.xmlstate==1){
                var old=this.onXLE;
                this.onXLE=function(id){ this._onradh(itemId); if (old) old(id); }
            }
            else
                this._onradh(itemId);
        }

    }
    return n;
};


//#__pro_feature:01112006{
//#context_menu:01112006{

/**
 *     @desc: enable context menu
 *     @param: menu - dhtmlXMenu object
 *     @edition: Professional
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableContextMenu=function(menu){  if (menu) this.cMenu=menu; };

/**
 *     @desc: set context menu to individual nodes
 *     @type: public
 *     @param: itemId - node id
 *     @param: cMenu - context menu object
 *     @edition: Professional
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.setItemContextMenu=function(itemId,cMenu){
    var l=itemId.toString().split(this.dlmtr);
    for (var i=0; i<l.length; i++)
    {
        var temp=this._globalIdStorageFind(l[i]);
        if (!temp) continue;
        temp.cMenu=cMenu;
    }
}

//#}
//#}

/**
 *     @desc: create new node as a child to specified with parentId
 *     @type: deprecated
 *     @param: parentId - parent node id
 *     @param: itemId - new node id
 *     @param: itemText - new node text
 *     @param: itemActionHandler - function fired on node select event (optional)
 *     @param: image1 - image for node without children; (optional)
 *     @param: image2 - image for closed node; (optional)
 *     @param: image3 - image for opened node (optional)
 *     @param: optionStr - options string (optional)
 *     @param: children - node children flag (for dynamical trees) (optional)
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.insertNewItem=function(parentId,itemId,itemText,itemActionHandler,image1,image2,image3,optionStr,children){
    var parentObject=this._globalIdStorageFind(parentId);
    if (!parentObject) return (-1);
    var nodez=this._attachChildNode(parentObject,itemId,itemText,itemActionHandler,image1,image2,image3,optionStr,children);
//#__pro_feature:01112006{
//#child_calc:01112006{
    if ((!this.XMLloadingWarning)&&(this.childCalc))  this._fixChildCountLabel(parentObject);
//#}
//#}
    return nodez;
};
/**
 *     @desc: create new node as a child to specified with parentId
 *     @type: public
 *     @param: parentId - parent node id
 *     @param: itemId - new node id
 *     @param: itemText - new node label
 *     @param: itemActionHandler - function fired on node select event (optional)
 *     @param: image1 - image for node without children; (optional)
 *     @param: image2 - image for closed node; (optional)
 *     @param: image3 - image for opened node (optional)
 *     @param: optionStr - options string (optional)
 *     @param: children - node children flag (for dynamical trees) (optional)
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.insertNewChild=function(parentId,itemId,itemText,itemActionHandler,image1,image2,image3,optionStr,children){
    return this.insertNewItem(parentId,itemId,itemText,itemActionHandler,image1,image2,image3,optionStr,children);
}
/**
 *     @desc: parse xml
 *     @type: private
 *     @param: dhtmlObject - jsTree object
 *     @param: node - top XML node
 *     @param: parentId - parent node id
 *     @param: level - level of tree
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._parseXMLTree=function(a,b,c,d,xml){
    var p=new xmlPointer(xml.getXMLTopNode("tree"));
    a._parse(p);
    a._p=p;
}

dhtmlXTreeObject.prototype._parseItem=function(c,temp,preNode,befNode){
    var id;
    if (this._srnd && (!this._idpull[id=c.get("id")] || !this._idpull[id].span))
    {
        this._addItemSRND(temp.id,id,c);
        return;
    }

    var a=c.get_all();

    if ((typeof(this.waitUpdateXML)=="object")&&(!this.waitUpdateXML[a.id])){
        this._parse(c,a.id,1);
        return;
    }

//#__pro_feature:01112006{
    if ((a.text===null)||(typeof(a.text)=="undefined")){
        a.text=c.sub("itemtext");
        if (a.text) a.text=a.text.content();
    }
//#}




    var zST=[];
    if (a.select) zST.push("SELECT");
    if (a.top) zST.push("TOP");
    if (a.call) this.nodeAskingCall=a.id;
    if (a.checked==-1) zST.push("HCHECKED");
    else if (a.checked) zST.push("CHECKED");
    if (a.open) zST.push("OPEN");

    if (this.waitUpdateXML){
        if (this._globalIdStorageFind(a.id))
            var newNode=this.updateItem(a.id,a.text,a.im0,a.im1,a.im2,a.checked,a.child);
        else{
            if (this.npl==0) zST.push("TOP");
            else preNode=temp.childNodes[this.npl];

            var newNode=this._attachChildNode(temp,a.id,a.text,0,a.im0,a.im1,a.im2,zST.join(","),a.child,0,preNode);
            preNode=null;
        }
    }
    else
        var newNode=this._attachChildNode(temp,a.id,a.text,0,a.im0,a.im1,a.im2,zST.join(","),a.child,(befNode||0),preNode);
    if (a.tooltip)
        newNode.span.parentNode.parentNode.title=a.tooltip;

    if (a.style)
        if (newNode.span.style.cssText)
            newNode.span.style.cssText+=(";"+a.style);
        else
            newNode.span.setAttribute("style",newNode.span.getAttribute("style")+"; "+a.style);

    if (a.radio) newNode._r_logic=true;

    if (a.nocheckbox){
        var check_node=newNode.span.parentNode.previousSibling.previousSibling;
        check_node.childNodes[0].style.display='none';
        if (window._KHTMLrv) check_node.style.display="none";
        newNode.nocheckbox=true;
    }
    if (a.disabled){
        if (a.checked!=null) this._setCheck(newNode,a.checked);
        this.disableCheckbox(newNode,1);
    }


    newNode._acc=a.child||0;

    if (this.parserExtension) this.parserExtension._parseExtension.call(this,c,a,(temp?temp.id:0));

    this.setItemColor(newNode,a.aCol,a.sCol);
    if (a.locked=="1")    this.lockItem(newNode.id,true,true);

    if ((a.imwidth)||(a.imheight))   this.setIconSize(a.imwidth,a.imheight,newNode);
    if ((a.closeable=="0")||(a.closeable=="1"))  this.setItemCloseable(newNode,a.closeable);
    var zcall="";
    if (a.topoffset) this.setItemTopOffset(newNode,a.topoffset);
    if ((!this.slowParse)||(typeof(this.waitUpdateXML)=="object")){
        if (c.sub_exists("item"))
            zcall=this._parse(c,a.id,1);
    }
//#__pro_feature:01112006{
//#smart_parsing:01112006{
    else {
        if ((!newNode.childsCount) && c.sub_exists("item"))
            newNode.unParsed=c.clone();

        c.each("userdata",function(u){
            this.setUserData(a.id,u.get("name"),u.content());
        },this);
    }
//#}                     
//#}
    if (zcall!="") this.nodeAskingCall=zcall;


    c.each("userdata",function(u){
        this.setUserData(c.get("id"),u.get("name"),u.content());
    },this)


}
dhtmlXTreeObject.prototype._parse=function(p,parentId,level,start){
    if (this._srnd && !this.parentObject.offsetHeight) {
        var self=this;
        return window.setTimeout(function(){
            self._parse(p,parentId,level,start);
        },100);
    }
    if (!p.exists()) return;

    this.skipLock=true; //disable item locking
    //loading flags


    if (!parentId) {          //top level  
        parentId=p.get("id");
        if (p.get("radio"))
            this.htmlNode._r_logic=true;
        this.parsingOn=parentId;
        this.parsedArray=new Array();
        this.setCheckList="";
        this.nodeAskingCall="";
    }

    var temp=this._globalIdStorageFind(parentId);
    if (!temp) return dhtmlxError.throwError("DataStructure","XML refers to not existing parent");

    this.parsCount=this.parsCount?(this.parsCount+1):1;
    this.XMLloadingWarning=1;

    if ((temp.childsCount)&&(!start)&&(!this._edsbps)&&(!temp._has_top))
        var preNode=0;//temp.childNodes[temp.childsCount-1];
    else
        var preNode=0;

    this.npl=0;

    p.each("item",function(c,i){

        temp.XMLload=1;

        this._parseItem(c,temp,0,preNode);

//#__pro_feature:01112006{
//#distributed_load:01112006{
        if ((this._edsbps)&&(this.npl==this._edsbpsC)){
            this._distributedStart(p,i+1,parentId,level,temp.childsCount);
            return -1;
        }
//#}
//#}
        this.npl++;



    },this,start);


    if (!level) {
        p.each("userdata",function(u){
            this.setUserData(p.get("id"),u.get("name"),u.content());
        },this);

        temp.XMLload=1;
        if (this.waitUpdateXML){
            this.waitUpdateXML=false;
            for (var i=temp.childsCount-1; i>=0; i--)
                if (temp.childNodes[i]._dmark)
                    this.deleteItem(temp.childNodes[i].id);
        }

        var parsedNodeTop=this._globalIdStorageFind(this.parsingOn);

        for (var i=0; i<this.parsedArray.length; i++)
            temp.htmlNode.childNodes[0].appendChild(this.parsedArray[i]);
        this.parsedArray = [];

        this.lastLoadedXMLId=parentId;
        this.XMLloadingWarning=0;

        var chArr=this.setCheckList.split(this.dlmtr);
        for (var n=0; n<chArr.length; n++)
            if (chArr[n]) this.setCheck(chArr[n],1);

        if ((this.XMLsource)&&(this.tscheck)&&(this.smcheck)&&(temp.id!=this.rootId)){
            if (temp.checkstate===0)
                this._setSubChecked(0,temp);
            else if (temp.checkstate===1)
                this._setSubChecked(1,temp);
        }

        this._redrawFrom(this,null,start)
        if (p.get("order") && p.get("order")!="none")
            this._reorderBranch(temp,p.get("order"),true);

        if (this.nodeAskingCall!="") this.callEvent("onClick",[this.nodeAskingCall,this.getSelectedItemId()]);
        if (this._branchUpdate) this._branchUpdateNext(p);
    }


    if (this.parsCount==1) {
        this.parsingOn=null;
//#__pro_feature:01112006{
//#smart_parsing:01112006{
        //if ((this.slowParse)&&(this.parsingOn==this.rootId))
        if (this._srnd && temp.id!=this.rootId){
            this.prepareSR(temp.id);
            if (this.XMLsource) this.openItem(temp.id)
        }

        p.through("item","open",null,function(c){
            this.openItem(c.get("id"));
        },this);
//#}
//#}


        if ((!this._edsbps)||(!this._edsbpsA.length)){
            var that=this;
            window.setTimeout( function(){  that.callEvent("onXLE",[that,parentId]); },1);
            this.xmlstate=0;
        }
        this.skipLock=false;
    }
    this.parsCount--;

//#__pro_feature:01112006{
//#distributed_load:01112006{
    var that=this;
    if (this._edsbps) window.setTimeout(function(){ that._distributedStep(parentId); },this._edsbpsD);
//#}
//#}



    if (!level && this.onXLE) this.onXLE(this,parentId);
    return this.nodeAskingCall;
};


dhtmlXTreeObject.prototype._branchUpdateNext=function(p){
    p.each("item",function(c){
        var nid=c.get("id");
        if (this._idpull[nid] && (!this._idpull[nid].XMLload))  return;
        this._branchUpdate++;
        this.smartRefreshItem(c.get("id"),c);
    },this)
    this._branchUpdate--;
}

dhtmlXTreeObject.prototype.checkUserData=function(node,parentId){
    if ((node.nodeType==1)&&(node.tagName == "userdata"))
    {
        var name=node.getAttribute("name");
        if ((name)&&(node.childNodes[0]))
            this.setUserData(parentId,name,node.childNodes[0].data);
    }
}




/**
 *     @desc: reset tree images from selected level
 *     @type: private
 *     @param: dhtmlObject - tree
 *     @param: itemObject - current item
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._redrawFrom=function(dhtmlObject,itemObject,start,visMode){
    if (!itemObject) {
        var tempx=dhtmlObject._globalIdStorageFind(dhtmlObject.lastLoadedXMLId);
        dhtmlObject.lastLoadedXMLId=-1;
        if (!tempx) return 0;
    }
    else tempx=itemObject;
    var acc=0;

    for (var i=(start?start-1:0); i<tempx.childsCount; i++)
    {
        if ((!this._branchUpdate)||(this._getOpenState(tempx)==1))
            if ((!itemObject)||(visMode==1)) tempx.childNodes[i].htmlNode.parentNode.parentNode.style.display="";
        if (tempx.childNodes[i].openMe==1)
        {
            this._openItem(tempx.childNodes[i]);
            tempx.childNodes[i].openMe=0;
        }

        dhtmlObject._redrawFrom(dhtmlObject,tempx.childNodes[i]);
//#__pro_feature:01112006{
//#child_calc:01112006{
        if (this.childCalc!=null){

            if ((tempx.childNodes[i].unParsed)||((!tempx.childNodes[i].XMLload)&&(this.XMLsource)))
            {

                if (tempx.childNodes[i]._acc)
                    tempx.childNodes[i].span.innerHTML=tempx.childNodes[i].label+this.htmlcA+tempx.childNodes[i]._acc+this.htmlcB;
                else
                    tempx.childNodes[i].span.innerHTML=tempx.childNodes[i].label;
            }
            if ((tempx.childNodes[i].childNodes.length)&&(this.childCalc))
            {
                if (this.childCalc==1)
                {
                    tempx.childNodes[i].span.innerHTML=tempx.childNodes[i].label+this.htmlcA+tempx.childNodes[i].childsCount+this.htmlcB;
                }
                if (this.childCalc==2)
                {
                    var zCount=tempx.childNodes[i].childsCount-(tempx.childNodes[i].pureChilds||0);
                    if (zCount)
                        tempx.childNodes[i].span.innerHTML=tempx.childNodes[i].label+this.htmlcA+zCount+this.htmlcB;
                    if (tempx.pureChilds) tempx.pureChilds++; else tempx.pureChilds=1;
                }
                if (this.childCalc==3)
                {
                    tempx.childNodes[i].span.innerHTML=tempx.childNodes[i].label+this.htmlcA+tempx.childNodes[i]._acc+this.htmlcB;
                }
                if (this.childCalc==4)
                {
                    var zCount=tempx.childNodes[i]._acc;
                    if (zCount)
                        tempx.childNodes[i].span.innerHTML=tempx.childNodes[i].label+this.htmlcA+zCount+this.htmlcB;
                }
            }
            else if (this.childCalc==4)   {
                acc++;
            }

            acc+=tempx.childNodes[i]._acc;

            if (this.childCalc==3){
                acc++;
            }

        }
//#}
//#}

    };

    if ((!tempx.unParsed)&&((tempx.XMLload)||(!this.XMLsource)))
        tempx._acc=acc;
    dhtmlObject._correctLine(tempx);
    dhtmlObject._correctPlus(tempx);
//#__pro_feature:01112006{
//#child_calc:01112006{
    if ((this.childCalc)&&(!itemObject)) dhtmlObject._fixChildCountLabel(tempx);
//#}
//#}
};

/**
 *     @desc: create and return main html element of tree
 *     @type: private
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._createSelf=function(){
    var div=document.createElement('div');
    div.className="containerTableStyle";
    div.style.width=this.width;
    div.style.height=this.height;
    this.parentObject.appendChild(div);
    return div;
};

/**
 *     @desc: collapse target node
 *     @type: private
 *     @param: itemObject - item object
 *     @topic: 4
 */
dhtmlXTreeObject.prototype._xcloseAll=function(itemObject)
{
    if (itemObject.unParsed) return;
    if (this.rootId!=itemObject.id) {
        if (!itemObject.htmlNode) return;//srnd
        var Nodes=itemObject.htmlNode.childNodes[0].childNodes;
        var Count=Nodes.length;

        for (var i=1; i<Count; i++)
            Nodes[i].style.display="none";

        this._correctPlus(itemObject);
    }

    for (var i=0; i<itemObject.childsCount; i++)
        if (itemObject.childNodes[i].childsCount)
            this._xcloseAll(itemObject.childNodes[i]);
};
/**
 *     @desc: expand target node
 *     @type: private
 *     @param: itemObject - item object
 *     @topic: 4
 */
dhtmlXTreeObject.prototype._xopenAll=function(itemObject)
{
    this._HideShow(itemObject,2);
    for (var i=0; i<itemObject.childsCount; i++)
        this._xopenAll(itemObject.childNodes[i]);
};
/**
 *     @desc: set correct tree-line and node images
 *     @type: private
 *     @param: itemObject - item object
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._correctPlus=function(itemObject){
    if (!itemObject.htmlNode) return;
    var imsrc=itemObject.htmlNode.childNodes[0].childNodes[0].childNodes[0].lastChild;
    var imsrc2=itemObject.htmlNode.childNodes[0].childNodes[0].childNodes[2].childNodes[0];

    var workArray=this.lineArray;
    if ((this.XMLsource)&&(!itemObject.XMLload))
    {
        var workArray=this.plusArray;
        this._setSrc(imsrc2,this.iconURL+itemObject.images[2]);
        if (this._txtimg) return (imsrc.innerHTML="[+]");
    }
    else
    if ((itemObject.childsCount)||(itemObject.unParsed))
    {
        if ((itemObject.htmlNode.childNodes[0].childNodes[1])&&( itemObject.htmlNode.childNodes[0].childNodes[1].style.display!="none" ))
        {
            if (!itemObject.wsign) var workArray=this.minusArray;
            this._setSrc(imsrc2,this.iconURL+itemObject.images[1]);
            if (this._txtimg) return (imsrc.innerHTML="[-]");
        }
        else
        {
            if (!itemObject.wsign) var workArray=this.plusArray;
            this._setSrc(imsrc2,this.iconURL+itemObject.images[2]);
            if (this._txtimg) return (imsrc.innerHTML="[+]");
        }
    }
    else
    {
        this._setSrc(imsrc2,this.iconURL+itemObject.images[0]);
    }


    var tempNum=2;
    if (!itemObject.treeNod.treeLinesOn) this._setSrc(imsrc,this.imPath+workArray[3]);
    else {
        if (itemObject.parentObject) tempNum=this._getCountStatus(itemObject.id,itemObject.parentObject);
        this._setSrc(imsrc,this.imPath+workArray[tempNum]);
    }
};

/**
 *     @desc: set correct tree-line images
 *     @type: private
 *     @param: itemObject - item object
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._correctLine=function(itemObject){
    if (!itemObject.htmlNode) return;
    var sNode=itemObject.parentObject;
    if (sNode)
        if ((this._getLineStatus(itemObject.id,sNode)==0)||(!this.treeLinesOn))
            for(var i=1; i<=itemObject.childsCount; i++){
                if (!itemObject.htmlNode.childNodes[0].childNodes[i]) break;
                itemObject.htmlNode.childNodes[0].childNodes[i].childNodes[0].style.backgroundImage="";
                itemObject.htmlNode.childNodes[0].childNodes[i].childNodes[0].style.backgroundRepeat="";
            }
        else
            for(var i=1; i<=itemObject.childsCount; i++){
                if (!itemObject.htmlNode.childNodes[0].childNodes[i]) break;
                itemObject.htmlNode.childNodes[0].childNodes[i].childNodes[0].style.backgroundImage="url("+this.imPath+this.lineArray[5]+")";
                itemObject.htmlNode.childNodes[0].childNodes[i].childNodes[0].style.backgroundRepeat="repeat-y";
            }
};
/**
 *     @desc: return type of node
 *     @type: private
 *     @param: itemId - item id
 *     @param: itemObject - parent node object
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._getCountStatus=function(itemId,itemObject){
    if (itemObject.childsCount<=1) { if (itemObject.id==this.rootId) return 4; else  return 0; }

    if (itemObject.childNodes[0].id==itemId) if (itemObject.id==this.rootId) return 2; else return 1;
    if (itemObject.childNodes[itemObject.childsCount-1].id==itemId) return 0;

    return 1;
};
/**
 *     @desc: return type of node
 *     @type: private
 *     @param: itemId - node id
 *     @param: itemObject - parent node object
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._getLineStatus =function(itemId,itemObject){
    if (itemObject.childNodes[itemObject.childsCount-1].id==itemId) return 0;
    return 1;
}

/**
 *     @desc: open/close node
 *     @type: private
 *     @param: itemObject - node object
 *     @param: mode - open/close mode [1-close 2-open](optional)
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._HideShow=function(itemObject,mode){
    if ((this.XMLsource)&&(!itemObject.XMLload)) {
        if (mode==1) return; //close for not loaded node - ignore it
        itemObject.XMLload=1;
        this._loadDynXML(itemObject.id);
        return; };
//#__pro_feature:01112006{
//#smart_parsing:01112006{
    if (itemObject.unParsed) this.reParse(itemObject);
//#}
//#}
    var Nodes=itemObject.htmlNode.childNodes[0].childNodes; var Count=Nodes.length;
    if (Count>1){
        if ( ( (Nodes[1].style.display!="none") || (mode==1) ) && (mode!=2) ) {
//nb:solves standard doctype prb in IE
            this.allTree.childNodes[0].border = "1";
            this.allTree.childNodes[0].border = "0";
            nodestyle="none";
        }
        else  nodestyle="";

        for (var i=1; i<Count; i++)
            Nodes[i].style.display=nodestyle;
    }
    this._correctPlus(itemObject);
}

/**
 *     @desc: return node state
 *     @type: private
 *     @param: itemObject - node object
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._getOpenState=function(itemObject){
    if (!itemObject.htmlNode) return 0; //srnd
    var z=itemObject.htmlNode.childNodes[0].childNodes;
    if (z.length<=1) return 0;
    if    (z[1].style.display!="none") return 1;
    else return -1;
}



/**
 *     @desc: ondblclick item  event handler
 *     @type: private
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.onRowClick2=function(){
    var that=this.parentObject.treeNod;
    if (!that.callEvent("onDblClick",[this.parentObject.id,that])) return false;
    if ((this.parentObject.closeble)&&(this.parentObject.closeble!="0"))
        that._HideShow(this.parentObject);
    else
        that._HideShow(this.parentObject,2);

    if    (that.checkEvent("onOpenEnd"))
        if (!that.xmlstate)
            that.callEvent("onOpenEnd",[this.parentObject.id,that._getOpenState(this.parentObject)]);
        else{
            that._oie_onXLE.push(that.onXLE);
            that.onXLE=that._epnFHe;
        }
    return false;
};
/**
 *     @desc: onclick item event handler
 *     @type: private
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.onRowClick=function(){
    var that=this.parentObject.treeNod;
    if (!that.callEvent("onOpenStart",[this.parentObject.id,that._getOpenState(this.parentObject)])) return 0;
    if ((this.parentObject.closeble)&&(this.parentObject.closeble!="0"))
        that._HideShow(this.parentObject);
    else
        that._HideShow(this.parentObject,2);


    if    (that.checkEvent("onOpenEnd"))
        if (!that.xmlstate)
            that.callEvent("onOpenEnd",[this.parentObject.id,that._getOpenState(this.parentObject)]);
        else{
            that._oie_onXLE.push(that.onXLE);
            that.onXLE=that._epnFHe;
        }

};

dhtmlXTreeObject.prototype._epnFHe=function(that,id,flag){
    if (id!=this.rootId)
        this.callEvent("onOpenEnd",[id,that.getOpenState(id)]);
    that.onXLE=that._oie_onXLE.pop();

    if (!flag && !that._oie_onXLE.length)
        if (that.onXLE) that.onXLE(that,id);
}



/**
 *     @desc: onclick item image event handler
 *     @type: private
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.onRowClickDown=function(e){
    e=e||window.event;
    var that=this.parentObject.treeNod;
    that._selectItem(this.parentObject,e);
};


/*****
 SELECTION
 *****/

/**
 *     @desc: retun selected item id
 *     @type: public
 *     @return: id of selected item
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.getSelectedItemId=function()
{
    var str=new Array();
    for (var i=0; i<this._selected.length; i++) str[i]=this._selected[i].id;
    return (str.join(this.dlmtr));
};

/**
 *     @desc: visual select item in tree
 *     @type: private
 *     @param: node - tree item object
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._selectItem=function(node,e){
    if (this.checkEvent("onSelect")) this._onSSCFold=this.getSelectedItemId();
//#__pro_feature:01112006{
//#multiselect:01112006{
    if ((!this._amsel)||(!e)||((!e.ctrlKey)&&(!e.metaKey)&&(!e.shiftKey)))
//#}
//#}
        this._unselectItems();
//#__pro_feature:01112006{
//#multiselect:01112006{
    if ((node.i_sel)&&(this._amsel)&&(e)&&(e.ctrlKey || e.metaKey))
        this._unselectItem(node);
    else
    if ((!node.i_sel)&&((!this._amselS)||(this._selected.length==0)||(this._selected[0].parentObject==node.parentObject)))
        if ((this._amsel)&&(e)&&(e.shiftKey)&&(this._selected.length!=0)&&(this._selected[this._selected.length-1].parentObject==node.parentObject)){
            var a=this._getIndex(this._selected[this._selected.length-1]);
            var b=this._getIndex(node);
            if (b<a) { var c=a; a=b; b=c; }
            for (var i=a; i<=b; i++)
                if (!node.parentObject.childNodes[i].i_sel)
                    this._markItem(node.parentObject.childNodes[i]);
        }
        else
//#}
//#}
            this._markItem(node);
    if (this.checkEvent("onSelect")) {
        var z=this.getSelectedItemId();
        if (z!=this._onSSCFold)
            this.callEvent("onSelect",[z]);
    }
}
dhtmlXTreeObject.prototype._markItem=function(node){
    if (node.scolor)  node.span.style.color=node.scolor;
    node.span.className="selectedTreeRow";
    node.i_sel=true;
    this._selected[this._selected.length]=node;
}

/**
 *     @desc: retun node index in children collection by Id
 *     @type: public
 *     @param: itemId - node id
 *     @return: node index
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.getIndexById=function(itemId){
    var z=this._globalIdStorageFind(itemId);
    if (!z) return null;
    return this._getIndex(z);
};
dhtmlXTreeObject.prototype._getIndex=function(w){
    var z=w.parentObject;
    for (var i=0; i<z.childsCount; i++)
        if (z.childNodes[i]==w) return i;
};





/**
 *     @desc: visual unselect item in tree
 *     @type: private
 *     @param: node - tree item object
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._unselectItem=function(node){
    if ((node)&&(node.i_sel))
    {

        node.span.className="standartTreeRow";
        if (node.acolor)  node.span.style.color=node.acolor;
        node.i_sel=false;
        for (var i=0; i<this._selected.length; i++)
            if (!this._selected[i].i_sel) {
                this._selected.splice(i,1);
                break;
            }

    }
}

/**
 *     @desc: visual unselect items in tree
 *     @type: private
 *     @param: node - tree item object
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._unselectItems=function(){
    for (var i=0; i<this._selected.length; i++){
        var node=this._selected[i];
        node.span.className="standartTreeRow";
        if (node.acolor)  node.span.style.color=node.acolor;
        node.i_sel=false;
    }
    this._selected=new Array();
}


/**
 *     @desc: select node text event handler
 *     @type: private
 *     @param: e - event object
 *     @param: htmlObject - node object
 *     @param: mode - if false - call onSelect event
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.onRowSelect=function(e,htmlObject,mode){
    e=e||window.event;

    var obj=this.parentObject;
    if (htmlObject) obj=htmlObject.parentObject;
    var that=obj.treeNod;

    var lastId=that.getSelectedItemId();
    if ((!e)||(!e.skipUnSel))
        that._selectItem(obj,e);

    if (!mode) {
        if (obj.actionHandler) obj.actionHandler(obj.id,lastId);
        else that.callEvent("onClick",[obj.id,lastId]);
    }
};





/**
 *     @desc: fix checkbox state
 *     @type: private
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._correctCheckStates=function(dhtmlObject){

    if (!this.tscheck) return;
    if (!dhtmlObject) return;
    if (dhtmlObject.id==this.rootId) return;
    //calculate state
    var act=dhtmlObject.childNodes;
    var flag1=0; var flag2=0;
    if (dhtmlObject.childsCount==0) return;
    for (var i=0; i<dhtmlObject.childsCount; i++){
        if (act[i].dscheck) continue;
        if (act[i].checkstate==0) flag1=1;
        else if (act[i].checkstate==1) flag2=1;
        else { flag1=1; flag2=1; break; }
    }

    if ((flag1)&&(flag2)) this._setCheck(dhtmlObject,"unsure");
    else if (flag1)  this._setCheck(dhtmlObject,false);
    else  this._setCheck(dhtmlObject,true);

    this._correctCheckStates(dhtmlObject.parentObject);
}

/**
 *     @desc: checbox select action
 *     @type: private
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.onCheckBoxClick=function(e){
    if (!this.treeNod.callEvent("onBeforeCheck",[this.parentObject.id,this.parentObject.checkstate]))
        return;

    if (this.parentObject.dscheck) return true;
    if (this.treeNod.tscheck)
        if (this.parentObject.checkstate==1) this.treeNod._setSubChecked(false,this.parentObject);
        else this.treeNod._setSubChecked(true,this.parentObject);
    else
    if (this.parentObject.checkstate==1) this.treeNod._setCheck(this.parentObject,false);
    else this.treeNod._setCheck(this.parentObject,true);
    this.treeNod._correctCheckStates(this.parentObject.parentObject);

    return this.treeNod.callEvent("onCheck",[this.parentObject.id,this.parentObject.checkstate]);
};
/**
 *     @desc: create HTML elements for tree node
 *     @type: private
 *     @param: acheck - enable/disable checkbox
 *     @param: itemObject - item object
 *     @param: mode - mode
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._createItem=function(acheck,itemObject,mode){
    var table=document.createElement('table');
    table.cellSpacing=0;table.cellPadding=0;
    table.border=0;

    if(this.hfMode)table.style.tableLayout="fixed";
    table.style.margin=0;table.style.padding=0;

    var tbody=document.createElement('tbody');
    var tr=document.createElement('tr');

    var td1=document.createElement('td');
    td1.className="standartTreeImage";

    if(this._txtimg){
        var img0=document.createElement("div");
        td1.appendChild(img0);
        img0.className="dhx_tree_textSign";
    }
    else
    {
        var img0=this._getImg(itemObject.id);
        img0.border="0";
        if (img0.tagName=="IMG") img0.align="absmiddle";
        td1.appendChild(img0); img0.style.padding=0; img0.style.margin=0;
        img0.style.width=this.def_line_img_x; img0.style.height=this.def_line_img_y;
    }

    var td11=document.createElement('td');
//         var inp=document.createElement("input");            inp.type="checkbox"; inp.style.width="12px"; inp.style.height="12px";
    var inp=this._getImg(this.cBROf?this.rootId:itemObject.id);
    inp.checked=0; this._setSrc(inp,this.imPath+this.checkArray[0]); inp.style.width="16px"; inp.style.height="16px";
    //can cause problems with hide/show check
    if (!acheck) ((!_isIE)?td11:inp).style.display="none";

    // td11.className="standartTreeImage";
    //if (acheck)
    td11.appendChild(inp);
    if ((!this.cBROf)&&(inp.tagName=="IMG")) inp.align="absmiddle";
    inp.onclick=this.onCheckBoxClick;
    inp.treeNod=this;
    inp.parentObject=itemObject;
    if (!window._KHTMLrv) td11.width="20px";
    else td11.width="16px";

    var td12=document.createElement('td');
    td12.className="standartTreeImage";
    var img=this._getImg(this.timgen?itemObject.id:this.rootId);
    img.onmousedown=this._preventNsDrag; img.ondragstart=this._preventNsDrag;
    img.border="0";
    if (this._aimgs){
        img.parentObject=itemObject;
        if (img.tagName=="IMG") img.align="absmiddle";
        img.onclick=this.onRowSelect; }
    if (!mode) this._setSrc(img,this.iconURL+this.imageArray[0]);
    td12.appendChild(img); img.style.padding=0; img.style.margin=0;
    if (this.timgen)
    {
        td12.style.width=img.style.width=this.def_img_x; img.style.height=this.def_img_y; }
    else
    {
        img.style.width="0px"; img.style.height="0px";
        if (_isOpera || window._KHTMLrv )    td12.style.display="none";
    }


    var td2=document.createElement('td');
    td2.className="standartTreeRow";

    itemObject.span=document.createElement('span');
    itemObject.span.className="standartTreeRow";
    if (this.mlitems) {
        itemObject.span.style.width=this.mlitems;
        //	if (!_isIE)
        itemObject.span.style.display="block";
    }
    else td2.noWrap=true;
    if (_isIE && _isIE>7) td2.style.width="999999px";
    else if (!window._KHTMLrv) td2.style.width="100%";

//      itemObject.span.appendChild(document.createTextNode(itemObject.label));
    itemObject.span.innerHTML=itemObject.label;
    td2.appendChild(itemObject.span);
    td2.parentObject=itemObject;        td1.parentObject=itemObject;
    td2.onclick=this.onRowSelect; td1.onclick=this.onRowClick; td2.ondblclick=this.onRowClick2;
    if (this.ettip)
        tr.title=itemObject.label;

    if (this.dragAndDropOff) {
        if (this._aimgs) { this.dragger.addDraggableItem(td12,this); td12.parentObject=itemObject; }
        this.dragger.addDraggableItem(td2,this);
    }

    itemObject.span.style.paddingLeft="5px";      itemObject.span.style.paddingRight="5px";   td2.style.verticalAlign="";
    td2.style.fontSize="10pt";       td2.style.cursor=this.style_pointer;
    tr.appendChild(td1);            tr.appendChild(td11);            tr.appendChild(td12);
    tr.appendChild(td2);
    tbody.appendChild(tr);
    table.appendChild(tbody);

    if (this.ehlt || this.checkEvent("onMouseIn") || this.checkEvent("onMouseOut")){//highlighting
        tr.onmousemove=this._itemMouseIn;
        tr[(_isIE)?"onmouseleave":"onmouseout"]=this._itemMouseOut;
    }
    return table;
};


/**
 *     @desc: set path to images directory
 *     @param: newPath - path to images directory (related to the page with tree or absolute http url)
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.setImagePath=function( newPath ){ this.imPath=newPath; this.iconURL=newPath; };
/**
 *   @desc: set path to external images used as tree icons
 *   @type: public
 *   @param: path - url (or relative path) of images folder with closing "/"
 *   @topic: 0,7
 */
dhtmlXTreeObject.prototype.setIconPath=function(path){
    this.iconURL=path;
}

//#__pro_feature:01112006{
//#child_calc:01112006{

/**
 *     @desc: return count of leafs
 *     @param: itemNode -  node object
 *     @type: private
 *     @edition: Professional
 *     @topic: 4
 */
dhtmlXTreeObject.prototype._getLeafCount=function(itemNode){
    var a=0;
    for (var b=0; b<itemNode.childsCount; b++)
        if (itemNode.childNodes[b].childsCount==0) a++;
    return a;
}

/**
 *     @desc: get value of child counter (child counter must be enabled)
 *     @type: private
 *     @param: itemId - id of selected item
 *     @edition: Professional
 *     @return: counter value (related to counter mode)
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._getChildCounterValue=function(itemId){
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    if ((temp.unParsed)||((!temp.XMLload)&&(this.XMLsource)))
        return temp._acc
    switch(this.childCalc)
    {
        case 1: return temp.childsCount; break;
        case 2: return this._getLeafCount(temp); break;
        case 3: return temp._acc; break;
        case 4: return temp._acc; break;
    }
}

/**
 *     @desc: fix node child counter
 *     @param: itemNode -  node object
 *     @type: private
 *     @edition: Professional
 *     @topic: 4
 */
dhtmlXTreeObject.prototype._fixChildCountLabel=function(itemNode,index){
    if (this.childCalc==null) return;
    if ((itemNode.unParsed)||((!itemNode.XMLload)&&(this.XMLsource)))
    {
        if (itemNode._acc)
            itemNode.span.innerHTML=itemNode.label+this.htmlcA+itemNode._acc+this.htmlcB;
        else
            itemNode.span.innerHTML=itemNode.label;

        return;
    }

    switch(this.childCalc){
        case 1:
            if (itemNode.childsCount!=0)
                itemNode.span.innerHTML=itemNode.label+this.htmlcA+itemNode.childsCount+this.htmlcB;
            else itemNode.span.innerHTML=itemNode.label;
            break;
        case 2:
            var z=this._getLeafCount(itemNode);
            if (z!=0)
                itemNode.span.innerHTML=itemNode.label+this.htmlcA+z+this.htmlcB;
            else itemNode.span.innerHTML=itemNode.label;
            break;
        case 3:
            if (itemNode.childsCount!=0)
            {
                var bcc=0;
                for (var a=0; a<itemNode.childsCount; a++)   {
                    if (!itemNode.childNodes[a]._acc) itemNode.childNodes[a]._acc=0;
                    bcc+=itemNode.childNodes[a]._acc*1;      }
                bcc+=itemNode.childsCount*1;

                itemNode.span.innerHTML=itemNode.label+this.htmlcA+bcc+this.htmlcB;
                itemNode._acc=bcc;
            }
            else { itemNode.span.innerHTML=itemNode.label;   itemNode._acc=0; }
            if ((itemNode.parentObject)&&(itemNode.parentObject!=this.htmlNode))
                this._fixChildCountLabel(itemNode.parentObject);
            break;
        case 4:
            if (itemNode.childsCount!=0)
            {
                var bcc=0;
                for (var a=0; a<itemNode.childsCount; a++)   {
                    if (!itemNode.childNodes[a]._acc) itemNode.childNodes[a]._acc=1;
                    bcc+=itemNode.childNodes[a]._acc*1;      }

                itemNode.span.innerHTML=itemNode.label+this.htmlcA+bcc+this.htmlcB;
                itemNode._acc=bcc;
            }
            else { itemNode.span.innerHTML=itemNode.label;   itemNode._acc=1; }
            if ((itemNode.parentObject)&&(itemNode.parentObject!=this.htmlNode))
                this._fixChildCountLabel(itemNode.parentObject);
            break;
    }
}

/**
 *     @desc: set children calculation mode
 *     @param: mode - mode name as string . Possible values: child - children, no recursive; leafs - children without subchildren, no recursive;  ,childrec - children, recursive; leafsrec - children without subchildren, recursive; disabled (disabled by default)
 *     @type: public
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.setChildCalcMode=function( mode ){
    switch(mode){
        case "child": this.childCalc=1; break;
        case "leafs": this.childCalc=2; break;
        case "childrec": this.childCalc=3; break;
        case "leafsrec": this.childCalc=4; break;
        case "disabled": this.childCalc=null; break;
        default: this.childCalc=4;
    }
}
/**
 *     @desc: set children calculation prefix and postfix
 *     @param: htmlA - postfix ([ - by default)
 *     @param: htmlB - postfix (] - by default)
 *     @type: public
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.setChildCalcHTML=function( htmlA,htmlB ){
    this.htmlcA=htmlA;      this.htmlcB=htmlB;
}
//#}
//#}

/**
 *     @desc: set function called when tree node selected
 *     @param: (function) func - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event: onRightClick
 *     @depricated: use grid.attachEvent("onRightClick",func); instead
 *     @eventdesc:  Event occurs after right mouse button was clicked.
 Assigning this handler can disable default context menu, and incompattible with dhtmlXMenu integration.
 *     @eventparam: (string) ID of clicked item
 *     @eventparam: (object) event object
 */
dhtmlXTreeObject.prototype.setOnRightClickHandler=function(func){  this.attachEvent("onRightClick",func);   };

/**
 *     @desc: set function called when tree node clicked, also can be forced to call from API
 *     @param: func - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event: onClick
 *     @depricated: use grid.attachEvent("onClick",func); instead
 *     @eventdesc: Event raises immideatly after text part of item in tree was clicked, but after default onClick functionality was processed.
 Richt mouse button click can be catched by onRightClick event handler.
 *     @eventparam:  ID of clicked item
 *     @eventparam:  ID of previously selected item
 */
dhtmlXTreeObject.prototype.setOnClickHandler=function(func){  this.attachEvent("onClick",func);  };

/**
 *     @desc: set function called when tree node selected or unselected, include any select change caused by any functionality
 *     @param: func - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event: onSelect
 *     @depricated: use grid.attachEvent("onSelect",func); instead
 *     @eventdesc: Event raises immideatly after selection in tree was changed
 *     @eventparam:  selected item ID ( list of IDs in case of multiselection)
 */
dhtmlXTreeObject.prototype.setOnSelectStateChange=function(func){  this.attachEvent("onSelect",func); };


/**
 *     @desc: enables dynamic loading from XML
 *     @type: public
 *     @param: filePath - name of script returning XML; in case of virtual loading - user defined function
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.setXMLAutoLoading=function(filePath){  this.XMLsource=filePath; };

/**
 *     @desc: set function called before checkbox checked/unchecked
 *     @param: func - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event: onCheck
 *     @depricated: use tree.attachEvent("onCheck",func); instead
 *     @eventdesc: Event raises right before item in tree was checked/unchecked. can be canceled (return false from event handler)
 *     @eventparam: ID of item which will be checked/unchecked
 *     @eventparam: Current checkbox state. 1 - item checked, 0 - item unchecked.
 *		@eventreturn: true - confirm changing checked state; false - deny chaning checked state;
 */
dhtmlXTreeObject.prototype.setOnCheckHandler=function(func){ this.attachEvent("onCheck",func);  };


/**
 *     @desc: set function called before tree node opened/closed
 *     @param: func - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event:  onOpen
 *     @depricated: use grid.attachEvent("onOpenStart",func); instead
 *     @eventdesc: Event raises immideatly after item in tree got command to open/close , and before item was opened//closed. Event also raised for unclosable nodes and nodes without open/close functionality - in that case result of function will be ignored.
 Event does not occur if node was opened by dhtmlXtree API.
 *     @eventparam: ID of node which will be opened/closed
 *     @eventparam: Current open state of tree item. 0 - item has not children, -1 - item closed, 1 - item opened.
 *     @eventreturn: true - confirm opening/closing; false - deny opening/closing;
 */
dhtmlXTreeObject.prototype.setOnOpenHandler=function(func){  this.attachEvent("onOpenStart",func);   };
/**
 *     @desc: set function called before tree node opened/closed
 *     @param: func - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event:  onOpenStart
 *     @depricated: use grid.attachEvent("onOpenStart",func); instead
 *     @eventdesc: Event raises immideatly after item in tree got command to open/close , and before item was opened//closed. Event also raised for unclosable nodes and nodes without open/close functionality - in that case result of function will be ignored.
 Event not raised if node opened by dhtmlXtree API.
 *     @eventparam: ID of node which will be opened/closed
 *     @eventparam: Current open state of tree item. 0 - item has not children, -1 - item closed, 1 - item opened.
 *     @eventreturn: true - confirm opening/closing; false - deny opening/closing;
 */
dhtmlXTreeObject.prototype.setOnOpenStartHandler=function(func){  this.attachEvent("onOpenStart",func);    };

/**
 *     @desc: set function called after tree node opened/closed
 *     @param: func - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event:  onOpenEnd
 *     @depricated: use grid.attachEvent("onOpenEnd",func); instead
 *     @eventdesc: Event raises immideatly after item in tree was opened//closed. Event also raised for unclosable nodes and nodes without open/close functionality - in that case result of function will be ignored.
 Event not raised if node opened by dhtmlXtree API.
 *     @eventparam: ID of node which will be opened/closed
 *     @eventparam: Current open state of tree item. 0 - item has not children, -1 - item closed, 1 - item opened.
 */
dhtmlXTreeObject.prototype.setOnOpenEndHandler=function(func){  this.attachEvent("onOpenEnd",func);  };

/**
 *     @desc: set function called when tree node double clicked
 *     @param: func - event handling function
 *     @type: public
 *     @topic: 0,7
 *     @event: onDblClick
 *     @depricated: use grid.attachEvent("onDblClick",func); instead
 *     @eventdesc: Event raised immideatly after item in tree was doubleclicked, before default onDblClick functionality was processed.
 Beware using both onClick and onDblClick events, because component can  generate onClick event before onDblClick event while doubleclicking item in tree.
 ( that behavior depend on used browser )
 *     @eventparam:  ID of item which was doubleclicked
 *     @eventreturn:  true - confirm opening/closing; false - deny opening/closing;
 */
dhtmlXTreeObject.prototype.setOnDblClickHandler=function(func){ this.attachEvent("onDblClick",func);   };









/**
 *     @desc: expand target node and all sub nodes
 *     @type: public
 *     @param: itemId - node id
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.openAllItems=function(itemId)
{
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    this._xopenAll(temp);
};

/**
 *     @desc: return open/close state
 *     @type: public
 *     @param: itemId - node id
 *     @return: -1 - close, 1 - opened, 0 - node doesn't have children
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.getOpenState=function(itemId){
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return "";
    return this._getOpenState(temp);
};

/**
 *     @desc: collapse target node and all sub nodes
 *     @type: public
 *     @param: itemId - node id
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.closeAllItems=function(itemId)
{
    if (itemId===window.undefined) itemId=this.rootId;

    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    this._xcloseAll(temp);

//nb:solves standard doctype prb in IE
    this.allTree.childNodes[0].border = "1";
    this.allTree.childNodes[0].border = "0";

};


/**
 *     @desc: set user data for target node
 *     @type: public
 *     @param: itemId - target node id
 *     @param: name - key for user data
 *     @param: value - user data value
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.setUserData=function(itemId,name,value){
    var sNode=this._globalIdStorageFind(itemId,0,true);
    if (!sNode) return;
    if(name=="hint")
        sNode.htmlNode.childNodes[0].childNodes[0].title=value;
    if (typeof(sNode.userData["t_"+name])=="undefined"){
        if (!sNode._userdatalist) sNode._userdatalist=name;
        else sNode._userdatalist+=","+name;
    }
    sNode.userData["t_"+name]=value;
};

/**
 *     @desc: get user data from target node
 *     @type: public
 *     @param: itemId - target node id
 *     @param: name - key for user data
 *     @return: value of user data
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.getUserData=function(itemId,name){
    var sNode=this._globalIdStorageFind(itemId,0,true);
    if (!sNode) return;
    return sNode.userData["t_"+name];
};




/**
 *     @desc: get node color (text color)
 *     @param: itemId - id of node
 *     @type: public
 *     @return: color of node (empty string for default color);
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.getItemColor=function(itemId)
{
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;

    var res= new Object();
    if (temp.acolor) res.acolor=temp.acolor;
    if (temp.scolor) res.scolor=temp.scolor;
    return res;
};
/**
 *     @desc: set node text color
 *     @param: itemId - id of node
 *     @param: defaultColor - node color
 *     @param: selectedColor - selected node color
 *     @type: public
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.setItemColor=function(itemId,defaultColor,selectedColor)
{
    if ((itemId)&&(itemId.span))
        var temp=itemId;
    else
        var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    else {
        if (temp.i_sel)
        {  if (selectedColor) temp.span.style.color=selectedColor; }
        else
        {  if (defaultColor) temp.span.style.color=defaultColor;  }

        if (selectedColor) temp.scolor=selectedColor;
        if (defaultColor) temp.acolor=defaultColor;
    }
};

/**
 *     @desc: return node text
 *     @param: itemId - id of node
 *     @type: public
 *     @return: text of item (with HTML formatting, if any)
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.getItemText=function(itemId)
{
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    return(temp.htmlNode.childNodes[0].childNodes[0].childNodes[3].childNodes[0].innerHTML);
};
/**
 *     @desc: return parent item id
 *     @param: itemId - id of node
 *     @type: public
 *     @return: id of parent item
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.getParentId=function(itemId)
{
    var temp=this._globalIdStorageFind(itemId);
    if ((!temp)||(!temp.parentObject)) return "";
    return temp.parentObject.id;
};



/**
 *     @desc: change item id
 *     @type: public
 *     @param: itemId - old node id
 *     @param: newItemId - new node id
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.changeItemId=function(itemId,newItemId)
{
    if (itemId==newItemId) return;
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    temp.id=newItemId;
    temp.span.contextMenuId=newItemId;
    this._idpull[newItemId]=this._idpull[itemId];
    delete this._idpull[itemId];
};


/**
 *     @desc: mark selected item as cut
 *     @type: public
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.doCut=function(){
    if (this.nodeCut) this.clearCut();
    this.nodeCut=(new Array()).concat(this._selected);
    for (var i=0; i<this.nodeCut.length; i++){
        var tempa=this.nodeCut[i];
        tempa._cimgs=new Array();
        tempa._cimgs[0]=tempa.images[0];
        tempa._cimgs[1]=tempa.images[1];
        tempa._cimgs[2]=tempa.images[2];
        tempa.images[0]=tempa.images[1]=tempa.images[2]=this.cutImage;
        this._correctPlus(tempa);
    }
};

/**
 *     @desc: insert previously cut branch
 *     @param: itemId - id of new parent node
 *     @type: public
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.doPaste=function(itemId){
    var tobj=this._globalIdStorageFind(itemId);
    if (!tobj) return 0;
    for (var i=0; i<this.nodeCut.length; i++){
        if (this._checkPNodes(tobj,this.nodeCut[i])) continue;
        this._moveNode(this.nodeCut[i],tobj);
    }
    this.clearCut();
};

/**
 *     @desc: clear cut
 *     @type: public
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.clearCut=function(){
    for (var i=0; i<this.nodeCut.length; i++)
    {
        var tempa=this.nodeCut[i];
        tempa.images[0]=tempa._cimgs[0];
        tempa.images[1]=tempa._cimgs[1];
        tempa.images[2]=tempa._cimgs[2];
        this._correctPlus(tempa);
    }
    this.nodeCut=new Array();
};



/**
 *     @desc: move node with subnodes
 *     @type: private
 *     @param: itemObject - moved node object
 *     @param: targetObject - new parent node
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._moveNode=function(itemObject,targetObject){
//#__pro_feature:01112006{
//#complex_move:01112006{
    var mode=this.dadmodec;
    if (mode==1)
    {
        var z=targetObject;
        if (this.dadmodefix<0)
        {

            while (true){
                z=this._getPrevNode(z);
                if ((z==-1)) { z=this.htmlNode; break; }
                if ((z.tr==0)||(z.tr.style.display=="")||(!z.parentObject)) break;
            }

            var nodeA=z;
            var nodeB=targetObject;

        }
        else
        {
            if ((z.tr)&&(z.tr.nextSibling)&&(z.tr.nextSibling.nodem)&&!this._getOpenState(z)){
                z = z.tr.nextSibling.nodem;
            }
            else{
                z=this._getNextNode(z);
                if ((z==-1)) z=this.htmlNode;
            }

            var nodeB=z;
            var nodeA=targetObject;
        }


        if (this._getNodeLevel(nodeA,0)>this._getNodeLevel(nodeB,0))
        {
            if (!this.dropLower)
                return this._moveNodeTo(itemObject,nodeA.parentObject);
            else
            if  (nodeB.id!=this.rootId)
                return this._moveNodeTo(itemObject,nodeB.parentObject,nodeB);
            else
                return this._moveNodeTo(itemObject,this.htmlNode,null);
        }
        else
        {
            return this._moveNodeTo(itemObject,nodeB.parentObject,nodeB);
        }


    }
    else
//#}
//#}
        return this._moveNodeTo(itemObject,targetObject);

}

/**
 *     @desc: fix order of nodes in collection
 *     @type: private
 *     @param: target - parent item node
 *     @param: zParent - before node
 *     @edition: Professional
 *     @topic: 2
 */

dhtmlXTreeObject.prototype._fixNodesCollection=function(target,zParent){
    var flag=0; var icount=0;
    var Nodes=target.childNodes;
    var Count=target.childsCount-1;

    if (zParent==Nodes[Count]) return;
    for (var i=0; i<Count; i++)
        if (Nodes[i]==Nodes[Count]) {  Nodes[i]=Nodes[i+1]; Nodes[i+1]=Nodes[Count]; }

//         Count=target.childsCount;
    for (var i=0; i<Count+1; i++)
    {
        if (flag) {
            var temp=Nodes[i];
            Nodes[i]=flag;
            flag=temp;
        }
        else
        if (Nodes[i]==zParent) {   flag=Nodes[i]; Nodes[i]=Nodes[Count];  }
    }
};

/**
 *     @desc: recreate branch
 *     @type: private
 *     @param: itemObject - moved node object
 *     @param: targetObject - new parent node
 *     @param: level - top level flag
 *     @param: beforeNode - node for sibling mode
 *     @mode: mode - DragAndDrop mode (0 - as child, 1 as sibling)
 *     @edition: Professional
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._recreateBranch=function(itemObject,targetObject,beforeNode,level){
    var i; var st="";
    if (beforeNode){
        for (i=0; i<targetObject.childsCount; i++)
            if (targetObject.childNodes[i]==beforeNode) break;

        if (i!=0)
            beforeNode=targetObject.childNodes[i-1];
        else{
            st="TOP";
            beforeNode="";
        }
    }

    var t2=this._onradh; this._onradh=null;
    var newNode=this._attachChildNode(targetObject,itemObject.id,itemObject.label,0,itemObject.images[0],itemObject.images[1],itemObject.images[2],st,0,beforeNode);

    //copy user data
    newNode._userdatalist=itemObject._userdatalist;
    newNode.userData=itemObject.userData.clone();
    newNode.XMLload=itemObject.XMLload;
    if (t2){
        this._onradh=t2; this._onradh(newNode.id); }

//#__pro_feature:01112006{
//#smart_parsing:01112006{
    //copy unparsed chunk
    if (itemObject.treeNod.dpcpy) itemObject.treeNod._globalIdStorageFind(itemObject.id);
    else newNode.unParsed=itemObject.unParsed;
    this._correctPlus(newNode);
    //this._correctLine(newNode);

//#}
//#}
    for (var i=0; i<itemObject.childsCount; i++)
        this._recreateBranch(itemObject.childNodes[i],newNode,0,1);

//#__pro_feature:01112006{
//#child_calc:01112006{
    if ((!level)&&(this.childCalc)) { this._redrawFrom(this,targetObject);  }
//#}
//#}
    return newNode;
}
/**
 *     @desc: move single node
 *     @type: private
 *     @param: itemObject - moved node object
 *     @param: targetObject - new parent node
 *     @mode: mode - DragAndDrop mode (0 - as child, 1 as sibling)
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._moveNodeTo=function(itemObject,targetObject,beforeNode){
    //return;
    if   (itemObject.treeNod._nonTrivialNode)
        return itemObject.treeNod._nonTrivialNode(this,targetObject,beforeNode,itemObject);

    if (this._checkPNodes(targetObject,itemObject))
        return false;

    if    (targetObject.mytype)
        var framesMove=(itemObject.treeNod.lWin!=targetObject.lWin);
    else
        var framesMove=(itemObject.treeNod.lWin!=targetObject.treeNod.lWin);

    if (!this.callEvent("onDrag",[itemObject.id,targetObject.id,(beforeNode?beforeNode.id:null),itemObject.treeNod,targetObject.treeNod])) return false;
    if ((targetObject.XMLload==0)&&(this.XMLsource))
    {
        targetObject.XMLload=1;
        this._loadDynXML(targetObject.id);
    }
    this.openItem(targetObject.id);

    var oldTree=itemObject.treeNod;
    var c=itemObject.parentObject.childsCount;
    var z=itemObject.parentObject;


    if ((framesMove)||(oldTree.dpcpy)) {//interframe drag flag
        var _otiid=itemObject.id;
        itemObject=this._recreateBranch(itemObject,targetObject,beforeNode);
        if (!oldTree.dpcpy) oldTree.deleteItem(_otiid);
    }
    else
    {

        var Count=targetObject.childsCount; var Nodes=targetObject.childNodes;
        if (Count==0) targetObject._open=true;
        oldTree._unselectItem(itemObject);
        Nodes[Count]=itemObject;
        itemObject.treeNod=targetObject.treeNod;
        targetObject.childsCount++;

        var tr=this._drawNewTr(Nodes[Count].htmlNode);

        if (!beforeNode)
        {
            targetObject.htmlNode.childNodes[0].appendChild(tr);
            if (this.dadmode==1) this._fixNodesCollection(targetObject,beforeNode);
        }
        else
        {
            targetObject.htmlNode.childNodes[0].insertBefore(tr,beforeNode.tr);
            this._fixNodesCollection(targetObject,beforeNode);
            Nodes=targetObject.childNodes;
        }


    }

    if ((!oldTree.dpcpy)&&(!framesMove))   {
        var zir=itemObject.tr;

        if ((document.all)&&(navigator.appVersion.search(/MSIE\ 5\.0/gi)!=-1))
        {
            window.setTimeout(function() { zir.parentNode.removeChild(zir); } , 250 );
        }
        else   //if (zir.parentNode) zir.parentNode.removeChild(zir,true);

            itemObject.parentObject.htmlNode.childNodes[0].removeChild(itemObject.tr);

        //itemObject.tr.removeNode(true);
        if ((!beforeNode)||(targetObject!=itemObject.parentObject)){
            for (var i=0; i<z.childsCount; i++){
                if (z.childNodes[i].id==itemObject.id) {
                    z.childNodes[i]=0;
                    break;            }}}
        else z.childNodes[z.childsCount-1]=0;

        oldTree._compressChildList(z.childsCount,z.childNodes);
        z.childsCount--;
    }


    if ((!framesMove)&&(!oldTree.dpcpy)) {
        itemObject.tr=tr;
        tr.nodem=itemObject;
        itemObject.parentObject=targetObject;

        if (oldTree!=targetObject.treeNod) {
            if(itemObject.treeNod._registerBranch(itemObject,oldTree)) return;      this._clearStyles(itemObject);  this._redrawFrom(this,itemObject.parentObject);
            if(this._onradh) this._onradh(itemObject.id);
        };

        this._correctPlus(targetObject);
        this._correctLine(targetObject);

        this._correctLine(itemObject);
        this._correctPlus(itemObject);

        //fix target siblings
        if (beforeNode)
        {

            this._correctPlus(beforeNode);
            //this._correctLine(beforeNode);
        }
        else
        if (targetObject.childsCount>=2)
        {

            this._correctPlus(Nodes[targetObject.childsCount-2]);
            this._correctLine(Nodes[targetObject.childsCount-2]);
        }

        this._correctPlus(Nodes[targetObject.childsCount-1]);
        //this._correctLine(Nodes[targetObject.childsCount-1]);


        if (this.tscheck) this._correctCheckStates(targetObject);
        if (oldTree.tscheck) oldTree._correctCheckStates(z);

    }

    //fix source parent

    if (c>1) { oldTree._correctPlus(z.childNodes[c-2]);
        oldTree._correctLine(z.childNodes[c-2]);
    }


//      if (z.childsCount==0)
    oldTree._correctPlus(z);
    oldTree._correctLine(z);

//#__pro_feature:01112006{
//#child_calc:01112006{
    this._fixChildCountLabel(targetObject);
    oldTree._fixChildCountLabel(z);
//#}
//#}
    this.callEvent("onDrop",[itemObject.id,targetObject.id,(beforeNode?beforeNode.id:null),oldTree,targetObject.treeNod]);
    return itemObject.id;
};



/**
 *     @desc: recursive set default styles for node
 *     @type: private
 *     @param: itemObject - target node object
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._clearStyles=function(itemObject){
    if (!itemObject.htmlNode) return; //some weird case in SRND mode
    var td1=itemObject.htmlNode.childNodes[0].childNodes[0].childNodes[1];
    var td3=td1.nextSibling.nextSibling;

    itemObject.span.innerHTML=itemObject.label;
    itemObject.i_sel=false;

    if (itemObject._aimgs)
        this.dragger.removeDraggableItem(td1.nextSibling);

    if (this.checkBoxOff) {
        td1.childNodes[0].style.display="";
        td1.childNodes[0].onclick=this.onCheckBoxClick;
        this._setSrc(td1.childNodes[0],this.imPath+this.checkArray[itemObject.checkstate]);
    }
    else td1.childNodes[0].style.display="none";
    td1.childNodes[0].treeNod=this;

    this.dragger.removeDraggableItem(td3);
    if (this.dragAndDropOff) this.dragger.addDraggableItem(td3,this);
    if (this._aimgs) this.dragger.addDraggableItem(td1.nextSibling,this);

    td3.childNodes[0].className="standartTreeRow";
    td3.onclick=this.onRowSelect; td3.ondblclick=this.onRowClick2;
    td1.previousSibling.onclick=this.onRowClick;

    this._correctLine(itemObject);
    this._correctPlus(itemObject);
    for (var i=0; i<itemObject.childsCount; i++) this._clearStyles(itemObject.childNodes[i]);

};
/**
 *     @desc: register node and all children nodes
 *     @type: private
 *     @param: itemObject - node object
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._registerBranch=function(itemObject,oldTree){
    if (oldTree) oldTree._globalIdStorageSub(itemObject.id);
    itemObject.id=this._globalIdStorageAdd(itemObject.id,itemObject);
    itemObject.treeNod=this;
    for (var i=0; i<itemObject.childsCount; i++)
        this._registerBranch(itemObject.childNodes[i],oldTree);
    return 0;
};


/**
 *     @desc: enable three state checkboxes
 *     @beforeInit: 1
 *     @param: mode - 1 - on, 0 - off;
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableThreeStateCheckboxes=function(mode) { this.tscheck=convertStringToBoolean(mode); };


/**
 *     @desc: set function called when mouse is over tree node
 *     @param: func - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event: onMouseIn
 *     @depricated: use grid.attachEvent("onMouseIn",func); instead
 *     @eventdesc: Event raised immideatly after mouse started moving over item
 *     @eventparam:  ID of item
 */
dhtmlXTreeObject.prototype.setOnMouseInHandler=function(func){
    this.ehlt=true;
    this.attachEvent("onMouseIn",func);
};

/**
 *     @desc: set function called when mouse is out of tree node
 *     @param: func - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event: onMouseOut
 *     @depricated: use grid.attachEvent("onMouseOut",func); instead
 *     @eventdesc: Event raised immideatly after mouse moved out of item
 *     @eventparam:  ID of clicked item
 */
dhtmlXTreeObject.prototype.setOnMouseOutHandler=function(func){
    this.ehlt=true;
    this.attachEvent("onMouseOut",func);
};





//#__pro_feature:01112006{
/**
 *     @desc: enable drag without removing (copy instead of move)
 *     @beforeInit: 1
 *     @param: mode - 1 - on, 0 - off;
 *     @type: public
 *     @edition:Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableMercyDrag=function(mode){ this.dpcpy=convertStringToBoolean(mode); };
//#}



/**
 *     @desc: enable tree images
 *     @beforeInit: 1
 *     @param: mode - 1 - on, 0 - off;
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableTreeImages=function(mode) { this.timgen=convertStringToBoolean(mode); };



/**
 *     @desc: enable mode with fixed tables (looks better, but has no horisontal scrollbar)
 *     @beforeInit: 1
 *     @param: mode - 1 - on, 0 - off;
 *     @type: private
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableFixedMode=function(mode) { this.hfMode=convertStringToBoolean(mode); };

/**
 *     @desc: show/hide checkboxes (all checkboxes in tree)
 *     @type: public
 *     @param: mode - true/false
 *     @param: hidden - if set to true, checkboxes not rendered but can be shown by showItemCheckbox
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableCheckBoxes=function(mode, hidden){ this.checkBoxOff=convertStringToBoolean(mode); this.cBROf=(!(this.checkBoxOff||convertStringToBoolean(hidden)));
};
/**
 *     @desc: set default images for nodes (must be called before XML loading)
 *     @type: public
 *     @param: a0 - image for node without children;
 *     @param: a1 - image for closed node;
 *     @param: a2 - image for opened node
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.setStdImages=function(image1,image2,image3){
    this.imageArray[0]=image1; this.imageArray[1]=image2; this.imageArray[2]=image3;};

/**
 *     @desc: enable/disable tree lines (parent-child threads)
 *     @type: public
 *     @param: mode - enable/disable tree lines
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.enableTreeLines=function(mode){
    this.treeLinesOn=convertStringToBoolean(mode);
}

/**
 *     @desc: set images used for parent-child threads drawing (lines, plus, minus)
 *     @type: public
 *     @param: arrayName - name of array: plus, minus
 *     @param: image1 - line crossed image
 *     @param: image2 - image with top line
 *     @param: image3 - image with bottom line
 *     @param: image4 - image without line
 *     @param: image5 - single root image
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.setImageArrays=function(arrayName,image1,image2,image3,image4,image5){
    switch(arrayName){
        case "plus": this.plusArray[0]=image1; this.plusArray[1]=image2; this.plusArray[2]=image3; this.plusArray[3]=image4; this.plusArray[4]=image5; break;
        case "minus": this.minusArray[0]=image1; this.minusArray[1]=image2; this.minusArray[2]=image3; this.minusArray[3]=image4;  this.minusArray[4]=image5; break;
    }
};

/**
 *     @desc: expand node
 *     @param: itemId - id of node
 *     @type: public
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.openItem=function(itemId){
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    else return this._openItem(temp);
};

/**
 *     @desc: expand node
 *     @param: item - tree node object
 *     @type: private
 *     @editing: pro
 *     @topic: 4
 */
dhtmlXTreeObject.prototype._openItem=function(item){
    var state=this._getOpenState(item);
    if ((state<0)||(((this.XMLsource)&&(!item.XMLload)))){
        if    (!this.callEvent("onOpenStart",[item.id,state])) return 0;
        this._HideShow(item,2);
        if    (this.checkEvent("onOpenEnd")){
            if (this.onXLE==this._epnFHe) this._epnFHe(this,item.id,true);
            if (!this.xmlstate || !this.XMLsource)
                this.callEvent("onOpenEnd",[item.id,this._getOpenState(item)]);
            else{
                this._oie_onXLE.push(this.onXLE);
                this.onXLE=this._epnFHe;
            }
        }
    } else if (this._srnd) this._HideShow(item,2);
    if (item.parentObject && !this._skip_open_parent) this._openItem(item.parentObject);
};

/**
 *     @desc: collapse node
 *     @param: itemId - id of node
 *     @type: public
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.closeItem=function(itemId){
    if (this.rootId==itemId) return 0;
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    if (temp.closeble)
        this._HideShow(temp,1);
};


























/**
 *     @desc: get node level (position in hierarchy)
 *     @param: itemId - id of node
 *     @type: public
 *     @return: node level (0 if no such item in hierarchy - probably super root)
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.getLevel=function(itemId){
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    return this._getNodeLevel(temp,0);
};



/**
 *     @desc: prevent node from closing
 *     @param: itemId - id of node
 *     @param: flag -  if 0 - node can't be closed, else node can be closed
 *     @type: public
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.setItemCloseable=function(itemId,flag)
{
    flag=convertStringToBoolean(flag);
    if ((itemId)&&(itemId.span))
        var temp=itemId;
    else
        var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    temp.closeble=flag;
};

/**
 *     @desc: recursive function used for node level calculation
 *     @param: itemObject - pointer to node object
 *     @param: count - counter of levels
 *     @type: private
 *     @topic: 4
 */
dhtmlXTreeObject.prototype._getNodeLevel=function(itemObject,count){
    if (itemObject.parentObject) return this._getNodeLevel(itemObject.parentObject,count+1);
    return(count);
};

/**
 *     @desc: return number of children
 *     @param: itemId - id of node
 *     @type: public
 *     @return: number of child items for loaded branches; true - for not loaded branches
 *     @topic: 4
 */
dhtmlXTreeObject.prototype.hasChildren=function(itemId){
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    else
    {
        if ( (this.XMLsource)&&(!temp.XMLload) ) return true;
        else
            return temp.childsCount;
    };
};


/**
 *     @desc: get number of leafs (nodes without children)
 *     @param: itemNode -  node object
 *     @type: private
 *     @edition: Professional
 *     @topic: 4
 */
dhtmlXTreeObject.prototype._getLeafCount=function(itemNode){
    var a=0;
    for (var b=0; b<itemNode.childsCount; b++)
        if (itemNode.childNodes[b].childsCount==0) a++;
    return a;
}


/**
 *     @desc: set new node text (HTML allowed)
 *     @param: itemId - id of node
 *     @param: newLabel - node text
 *     @param: newTooltip - (optional)tooltip for the node
 *     @type: public
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.setItemText=function(itemId,newLabel,newTooltip)
{
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    temp.label=newLabel;
    temp.span.innerHTML=newLabel;
//#__pro_feature:01112006{
//#child_calc:01112006{
    if (this.childCalc) this._fixChildCountLabel(temp);
//#}
//#}
    temp.span.parentNode.parentNode.title=newTooltip||"";
};

/**
 *     @desc: get item's tooltip
 *     @param: itemId - id of node
 *     @type: public
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.getItemTooltip=function(itemId){
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return "";
    return (temp.span.parentNode.parentNode._dhx_title||temp.span.parentNode.parentNode.title||"");
};

/**
 *     @desc: refresh tree branch from xml (XML with child nodes rerequested from server)
 *     @param: itemId - id of node, if not defined tree super root used.
 *     @type: public
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.refreshItem=function(itemId){
    if (!itemId) itemId=this.rootId;
    var temp=this._globalIdStorageFind(itemId);
    this.deleteChildItems(itemId);
    this._loadDynXML(itemId);
};

/**
 *     @desc: set item images
 *     @param: itemId - id of node
 *     @param: image1 - node without children icon
 *     @param: image2 - closed node icon
 *     @param: image3 - open node icon
 *     @type: public
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.setItemImage2=function(itemId, image1,image2,image3){
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    temp.images[1]=image2;
    temp.images[2]=image3;
    temp.images[0]=image1;
    this._correctPlus(temp);
};
/**
 *     @desc: set item icons (mostly usefull for childless nodes)
 *     @param: itemId - id of node
 *     @param: image1 - node without children icon or closed node icon (if image2 specified)
 *     @param: image2 - open node icon (optional)
 *     @type: public
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.setItemImage=function(itemId,image1,image2)
{
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    if (image2)
    {
        temp.images[1]=image1;
        temp.images[2]=image2;
    }
    else temp.images[0]=image1;
    this._correctPlus(temp);
};


/**
 *     @desc: Returns the list of all subitems Ids from the next level of tree, separated by commas.
 *     @param: itemId - id of node
 *     @type: public
 *     @return: list of all subitems from the next level of tree, separated by commas.
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.getSubItems =function(itemId)
{
    var temp=this._globalIdStorageFind(itemId,0,1);
    if (!temp) return 0;
//#__pro_feature:01112006{
//#smart_parsing:01112006{
    if(temp.unParsed)
        return (this._getSubItemsXML(temp.unParsed));
//#}
//#}
    var z="";
    for (i=0; i<temp.childsCount; i++){
        if (!z) z=temp.childNodes[i].id;
        else z+=this.dlmtr+temp.childNodes[i].id;

    }

    return z;
};




/**
 *     @desc: Returns the list of all sub items from all next levels of tree, separated by commas.
 *     @param: itemId - id of node
 *     @edition: Professional
 *     @type: private
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._getAllScraggyItems =function(node)
{
    var z="";
    for (var i=0; i<node.childsCount; i++)
    {
        if ((node.childNodes[i].unParsed)||(node.childNodes[i].childsCount>0))
        {
            if (node.childNodes[i].unParsed)
                var zb=this._getAllScraggyItemsXML(node.childNodes[i].unParsed,1);
            else
                var zb=this._getAllScraggyItems(node.childNodes[i])

            if (zb)
                if (z) z+=this.dlmtr+zb;
                else z=zb;
        }
        else
        if (!z) z=node.childNodes[i].id;
        else z+=this.dlmtr+node.childNodes[i].id;
    }
    return z;
};





/**
 *     @desc: Returns the list of all children items from all next levels of tree, separated by commas.
 *     @param: itemId - id of node
 *     @type: private
 *     @edition: Professional
 *     @topic: 6
 */

dhtmlXTreeObject.prototype._getAllFatItems =function(node)
{
    var z="";
    for (var i=0; i<node.childsCount; i++)
    {
        if ((node.childNodes[i].unParsed)||(node.childNodes[i].childsCount>0))
        {
            if (!z) z=node.childNodes[i].id;
            else z+=this.dlmtr+node.childNodes[i].id;

            if (node.childNodes[i].unParsed)
                var zb=this._getAllFatItemsXML(node.childNodes[i].unParsed,1);
            else
                var zb=this._getAllFatItems(node.childNodes[i])

            if (zb) z+=this.dlmtr+zb;
        }
    }
    return z;
};


/**
 *     @desc: Returns the list of all children items from all next levels of tree, separated by commas.
 *     @param: itemId - id of node
 *     @type: private
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._getAllSubItems =function(itemId,z,node)
{
    if (node) temp=node;
    else {
        var temp=this._globalIdStorageFind(itemId);
    };
    if (!temp) return 0;

    z="";
    for (var i=0; i<temp.childsCount; i++)
    {
        if (!z) z=temp.childNodes[i].id;
        else z+=this.dlmtr+temp.childNodes[i].id;
        var zb=this._getAllSubItems(0,z,temp.childNodes[i])

        if (zb) z+=this.dlmtr+zb;
    }

//#__pro_feature:01112006{
//#smart_parsing:01112006{
    if (temp.unParsed)
        z=this._getAllSubItemsXML(itemId,z,temp.unParsed);
//#}
//#}
    return z;
};





/**
 *     @desc: select node ( and optionaly fire onselect event)
 *     @type: public
 *     @param: itemId - node id
 *     @param: mode - If true, script function for selected node will be called.
 *     @param: preserve - preserve earlier selected nodes
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.selectItem=function(itemId,mode,preserve){
    mode=convertStringToBoolean(mode);
    var temp=this._globalIdStorageFind(itemId);
    if ((!temp)||(!temp.parentObject)) return 0;

    if (this.XMLloadingWarning)
        temp.parentObject.openMe=1;
    else
        this._openItem(temp.parentObject);

    //temp.onRowSelect(0,temp.htmlNode.childNodes[0].childNodes[0].childNodes[3],mode);
    var ze=null;
    if (preserve)  {
        ze=new Object; ze.ctrlKey=true;
        if (temp.i_sel) ze.skipUnSel=true;
    }
    if (mode)
        this.onRowSelect(ze,temp.htmlNode.childNodes[0].childNodes[0].childNodes[3],false);
    else
        this.onRowSelect(ze,temp.htmlNode.childNodes[0].childNodes[0].childNodes[3],true);
};

/**
 *     @desc: retun selected node text
 *     @type: public
 *     @return: text of selected node (or list of all selected nodes text if more than one selected)
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.getSelectedItemText=function()
{
    var str=new Array();
    for (var i=0; i<this._selected.length; i++) str[i]=this._selected[i].span.innerHTML;
    return (str.join(this.dlmtr));
};




/**
 *     @desc: correct childNode list after node deleting
 *     @type: private
 *     @param: Count - childNodes collection length
 *     @param: Nodes - childNodes collection
 *     @topic: 4
 */
dhtmlXTreeObject.prototype._compressChildList=function(Count,Nodes)
{
    Count--;
    for (var i=0; i<Count; i++)
    {
        if (Nodes[i]==0) { Nodes[i]=Nodes[i+1]; Nodes[i+1]=0;}
    };
};
/**
 *     @desc: delete node
 *     @type: private
 *     @param: itemId - target node id
 *     @param: htmlObject - target node object
 *     @param: skip - node unregistration mode (optional, used by private methods)
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._deleteNode=function(itemId,htmlObject,skip){
    if ((!htmlObject)||(!htmlObject.parentObject)) return 0;
    var tempos=0; var tempos2=0;
    if (htmlObject.tr.nextSibling)  tempos=htmlObject.tr.nextSibling.nodem;
    if (htmlObject.tr.previousSibling)  tempos2=htmlObject.tr.previousSibling.nodem;

    var sN=htmlObject.parentObject;
    var Count=sN.childsCount;
    var Nodes=sN.childNodes;
    for (var i=0; i<Count; i++)
    {
        if (Nodes[i].id==itemId) {
            if (!skip) sN.htmlNode.childNodes[0].removeChild(Nodes[i].tr);
            Nodes[i]=0;
            break;
        }
    }
    this._compressChildList(Count,Nodes);
    if (!skip) {
        sN.childsCount--;
    }

    if (tempos) {
        this._correctPlus(tempos);
        this._correctLine(tempos);
    }
    if (tempos2) {
        this._correctPlus(tempos2);
        this._correctLine(tempos2);
    }
    if (this.tscheck) this._correctCheckStates(sN);

    if (!skip) {
        this._globalIdStorageRecSub(htmlObject);
    }
};
/**
 *     @desc: set state of node's checkbox
 *     @type: public
 *     @param: itemId - target node id
 *     @param: state - checkbox state (0/1/"unsure")
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.setCheck=function(itemId,state){
    var sNode=this._globalIdStorageFind(itemId,0,1);
    if (!sNode) return;

    if (state==="unsure")
        this._setCheck(sNode,state);
    else
    {
        state=convertStringToBoolean(state);
        if ((this.tscheck)&&(this.smcheck)) this._setSubChecked(state,sNode);
        else this._setCheck(sNode,state);
    }
    if (this.smcheck)
        this._correctCheckStates(sNode.parentObject);
};

dhtmlXTreeObject.prototype._setCheck=function(sNode,state){
    if (!sNode) return;
    if (((sNode.parentObject._r_logic)||(this._frbtr))&&(state))
        if (this._frbtrs){
            if (this._frbtrL)   this.setCheck(this._frbtrL.id,0);
            this._frbtrL=sNode;
        } else
            for (var i=0; i<sNode.parentObject.childsCount; i++)
                this._setCheck(sNode.parentObject.childNodes[i],0);

    var z=sNode.htmlNode.childNodes[0].childNodes[0].childNodes[1].childNodes[0];

    if (state=="unsure") sNode.checkstate=2;
    else if (state) sNode.checkstate=1; else sNode.checkstate=0;
    if (sNode.dscheck) sNode.checkstate=sNode.dscheck;
    this._setSrc(z,this.imPath+((sNode.parentObject._r_logic||this._frbtr)?this.radioArray:this.checkArray)[sNode.checkstate]);
};

/**
 *     @desc: change state of node's checkbox and all children checkboxes
 *     @type: public
 *     @param: itemId - target node id
 *     @param: state - checkbox state
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.setSubChecked=function(itemId,state){
    var sNode=this._globalIdStorageFind(itemId);
    this._setSubChecked(state,sNode);
    this._correctCheckStates(sNode.parentObject);
}



/**
 *     @desc: change state of node's checkbox and all childnodes checkboxes
 *     @type: private
 *     @param: itemId - target node id
 *     @param: state - checkbox state
 *     @param: sNode - target node object (optional, used by private methods)
 *     @topic: 5
 */
dhtmlXTreeObject.prototype._setSubChecked=function(state,sNode){
    state=convertStringToBoolean(state);
    if (!sNode) return;
    if (((sNode.parentObject._r_logic)||(this._frbtr))&&(state))
        for (var i=0; i<sNode.parentObject.childsCount; i++)
            this._setSubChecked(0,sNode.parentObject.childNodes[i]);

//#__pro_feature:01112006{
//#smart_parsing:01112006{
    if (sNode.unParsed)
        this._setSubCheckedXML(state,sNode.unParsed)
//#}
//#}
    if (sNode._r_logic||this._frbtr)
        this._setSubChecked(state,sNode.childNodes[0]);
    else
        for (var i=0; i<sNode.childsCount; i++)
        {
            this._setSubChecked(state,sNode.childNodes[i]);
        };
    var z=sNode.htmlNode.childNodes[0].childNodes[0].childNodes[1].childNodes[0];

    if (state) sNode.checkstate=1;
    else    sNode.checkstate=0;
    if (sNode.dscheck)  sNode.checkstate=sNode.dscheck;



    this._setSrc(z,this.imPath+((sNode.parentObject._r_logic||this._frbtr)?this.radioArray:this.checkArray)[sNode.checkstate]);
};

/**
 *     @desc: get state of nodes's checkbox
 *     @type: public
 *     @param: itemId - target node id
 *     @return: node state (0 - unchecked,1 - checked, 2 - third state)
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.isItemChecked=function(itemId){
    var sNode=this._globalIdStorageFind(itemId);
    if (!sNode) return;
    return   sNode.checkstate;
};







/**
 *     @desc: delete all children of node
 *     @type: public
 *     @param: itemId - node id
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.deleteChildItems=function(itemId)
{
    var sNode=this._globalIdStorageFind(itemId);
    if (!sNode) return;
    var j=sNode.childsCount;
    for (var i=0; i<j; i++)
    {
        this._deleteNode(sNode.childNodes[0].id,sNode.childNodes[0]);
    };
};

/**
 *     @desc: delete node
 *     @type: public
 *     @param: itemId - node id
 *     @param: selectParent - If true parent of deleted item get selection, else no selected items leaving in tree.
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.deleteItem=function(itemId,selectParent){
    if ((!this._onrdlh)||(this._onrdlh(itemId))){
        var z=this._deleteItem(itemId,selectParent);
//#__pro_feature:01112006{
//#child_calc:01112006{
        if (z)
            this._fixChildCountLabel(z);
//#}
//#}
    }

    //nb:solves standard doctype prb in IE
    this.allTree.childNodes[0].border = "1";
    this.allTree.childNodes[0].border = "0";
}
/**
 *     @desc: delete node
 *     @type: private
 *     @param: id - node id
 *     @param: selectParent - If true parent of deleted item get selection, else no selected items leaving in tree.
 *     @param: skip - unregistering mode (optional, used by private methods)
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._deleteItem=function(itemId,selectParent,skip){
    selectParent=convertStringToBoolean(selectParent);
    var sNode=this._globalIdStorageFind(itemId);
    if (!sNode) return;
    var pid=this.getParentId(itemId);

    var zTemp=sNode.parentObject;
    this._deleteNode(itemId,sNode,skip);
    this._correctPlus(zTemp);
    this._correctLine(zTemp);

    if  ((selectParent)&&(pid!=this.rootId)) this.selectItem(pid,1);
    return    zTemp;
};

/**
 *     @desc: uregister all child nodes of target node
 *     @type: private
 *     @param: itemObject - node object
 *     @topic: 3
 */
dhtmlXTreeObject.prototype._globalIdStorageRecSub=function(itemObject){
    for(var i=0; i<itemObject.childsCount; i++)
    {
        this._globalIdStorageRecSub(itemObject.childNodes[i]);
        this._globalIdStorageSub(itemObject.childNodes[i].id);
    };
    this._globalIdStorageSub(itemObject.id);

    /*anti memory leaking*/
    var z=itemObject;
//		var par=z.span.parentNode.parentNode.childNodes;
//		par[0].parentObject=null;
//		par[1].childNodes[0].parentObject=null;
//		par[2].childNodes[0].parentObject=null;
//		par[2].childNodes[0].treeNod=null;
//		par[2].parentObject=null;
//		par[3].parentObject=null;
    z.span=null;
    z.tr.nodem=null;
    z.tr=null;
    z.htmlNode=null;
};

/**
 *     @desc: create new node next to specified
 *     @type: public
 *     @param: itemId - node id
 *     @param: newItemId - new node id
 *     @param: itemText - new node text
 *     @param: itemActionHandler - function fired on node select event (optional)
 *     @param: image1 - image for node without children; (optional)
 *     @param: image2 - image for closed node; (optional)
 *     @param: image3 - image for opened node (optional)
 *     @param: optionStr - options string (optional)
 *     @param: children - node children flag (for dynamical trees) (optional)
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.insertNewNext=function(itemId,newItemId,itemText,itemActionHandler,image1,image2,image3,optionStr,children){
    var sNode=this._globalIdStorageFind(itemId);
    if ((!sNode)||(!sNode.parentObject)) return (0);

    var nodez=this._attachChildNode(0,newItemId,itemText,itemActionHandler,image1,image2,image3,optionStr,children,sNode);
//#__pro_feature:01112006{
//#child_calc:01112006{
    if ((!this.XMLloadingWarning)&&(this.childCalc))  this._fixChildCountLabel(sNode.parentObject);
//#}
//#}
    return nodez;
};



/**
 *     @desc: retun node id by index
 *     @type: public
 *     @param: itemId - parent node id
 *     @param: index - index of node, 0 based
 *     @return: node id
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.getItemIdByIndex=function(itemId,index){
    var z=this._globalIdStorageFind(itemId);
    if ((!z)||(index>=z.childsCount)) return null;
    return z.childNodes[index].id;
};

/**
 *     @desc: retun child node id by index
 *     @type: public
 *     @param: itemId - parent node id
 *     @param: index - index of child node
 *     @return: node id
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.getChildItemIdByIndex=function(itemId,index){
    var z=this._globalIdStorageFind(itemId);
    if ((!z)||(index>=z.childsCount)) return null;
    return z.childNodes[index].id;
};





/**
 *     @desc: set function called when drag-and-drop event occured
 *     @param: aFunc - event handling function
 *     @type: deprecated
 *     @topic: 0,7
 *     @event:    onDrag
 *     @depricated: use grid.attachEvent("onDrag",func); instead
 *     @eventdesc: Event occured after item was dragged and droped on another item, but before item moving processed.
 Event also raised while programmatic moving nodes.
 *     @eventparam:  ID of source item
 *     @eventparam:  ID of target item
 *     @eventparam:  if node droped as sibling then contain id of item before whitch source node will be inserted
 *     @eventparam:  source Tree object
 *     @eventparam:  target Tree object
 *     @eventreturn:  true - confirm drag-and-drop; false - deny drag-and-drop;
 */
dhtmlXTreeObject.prototype.setDragHandler=function(func){ this.attachEvent("onDrag",func); };

/**
 *     @desc: clear selection from node
 *     @param: htmlNode - pointer to node object
 *     @type: private
 *     @topic: 1
 */
dhtmlXTreeObject.prototype._clearMove=function(){
    if (this._lastMark){
        this._lastMark.className=this._lastMark.className.replace(/dragAndDropRow/g,"");
        this._lastMark=null;
    }
//#__pro_feature:01112006{
//#complex_move:01112006{
    this.selectionBar.style.display="none";
//#}
//#}
    this.allTree.className=this.allTree.className.replace(" selectionBox","");
};

/**
 *     @desc: enable/disable drag-and-drop
 *     @type: public
 *     @param: mode - enabled/disabled [ can be true/false/temporary_disabled - last value mean that tree can be D-n-D can be switched to true later ]
 *     @param: rmode - enabled/disabled drag and drop on super root
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableDragAndDrop=function(mode,rmode){
    if  (mode=="temporary_disabled"){
        this.dADTempOff=false;
        mode=true;                  }
    else
        this.dADTempOff=true;

    this.dragAndDropOff=convertStringToBoolean(mode);
    if (this.dragAndDropOff) this.dragger.addDragLanding(this.allTree,this);
    if (arguments.length>1)
        this._ddronr=(!convertStringToBoolean(rmode));
};

/**
 *     @desc: set selection on node
 *     @param: node - pointer to node object
 *     @type: private
 *     @topic: 1
 */
dhtmlXTreeObject.prototype._setMove=function(htmlNode,x,y){
    if (htmlNode.parentObject.span) {
        //window.status=x;
        var a1=getAbsoluteTop(htmlNode);
        var a2=getAbsoluteTop(this.allTree)-this.allTree.scrollTop;

        this.dadmodec=this.dadmode;//this.dadmode;
        this.dadmodefix=0;
//#__pro_feature:01112006{
//#complex_move:01112006{
        if (this.dadmode==2)
        {

            var z=y-a1+(document.body.scrollTop||document.documentElement.scrollTop)-2-htmlNode.offsetHeight/2;
            if ((Math.abs(z)-htmlNode.offsetHeight/6)>0)
            {
                this.dadmodec=1;
                //sibbling zone
                if (z<0)
                    this.dadmodefix=0-htmlNode.offsetHeight;
            }
            else this.dadmodec=0;

        }
        if (this.dadmodec==0)
        {
//#}
//#} 

            var zN=htmlNode.parentObject.span;
            zN.className+=" dragAndDropRow";
            this._lastMark=zN;
//#__pro_feature:01112006{
//#complex_move:01112006{
        }
        else{
            this._clearMove();
            this.selectionBar.style.top=(a1-a2+((parseInt(htmlNode.parentObject.span.parentNode.previousSibling.childNodes[0].style.height)||18)-1)+this.dadmodefix)+"px";
            this.selectionBar.style.left="5px";
            if (this.allTree.offsetWidth>20)
                this.selectionBar.style.width=(this.allTree.offsetWidth-(_isFF?30:25))+"px";
            this.selectionBar.style.display="";
        }
//#}
//#}
        this._autoScroll(null,a1,a2);

    }
};

dhtmlXTreeObject.prototype._autoScroll=function(node,a1,a2){
    if (this.autoScroll)
    {
        if (node){
            a1=getAbsoluteTop(node);
            a2=getAbsoluteTop(this.allTree);
        }
        //scroll down
        if ( (a1-a2-parseInt(this.allTree.scrollTop))>(parseInt(this.allTree.offsetHeight)-50) )
            this.allTree.scrollTop=parseInt(this.allTree.scrollTop)+20;
        //scroll top
        if ( (a1-a2)<(parseInt(this.allTree.scrollTop)+30) )
            this.allTree.scrollTop=parseInt(this.allTree.scrollTop)-20;
    }
}

/**
 *     @desc: create html element for dragging
 *     @type: private
 *     @param: htmlObject - html node object
 *     @topic: 1
 */
dhtmlXTreeObject.prototype._createDragNode=function(htmlObject,e){
    if (!this.dADTempOff) return null;

    var obj=htmlObject.parentObject;
    if (!this.callEvent("onBeforeDrag",[obj.id, e])) return null;
    if (!obj.i_sel){

        this._selectItem(obj,e);
    }
//#__pro_feature:01112006{
//#multiselect:01112006{
    this._checkMSelectionLogic();
//#}
//#}
    var dragSpan=document.createElement('div');

    var text=new Array();
    if (this._itim_dg)
        for (var i=0; i<this._selected.length; i++)
            text[i]="<table cellspacing='0' cellpadding='0'><tr><td><img width='18px' height='18px' src='"+this._getSrc(this._selected[i].span.parentNode.previousSibling.childNodes[0])+"'></td><td>"+this._selected[i].span.innerHTML+"</td></tr></table>";
    else
        text=this.getSelectedItemText().split(this.dlmtr);

    dragSpan.innerHTML=text.join("");
    dragSpan.style.position="absolute";
    dragSpan.className="dragSpanDiv";
    this._dragged=(new Array()).concat(this._selected);
    return dragSpan;
}



/**
 *     @desc: focus item in tree
 *     @type: private
 *     @param: item - node object
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._focusNode=function(item){
    var z=getAbsoluteTop(item.htmlNode)-getAbsoluteTop(this.allTree);
    if ((z>(this.allTree.offsetHeight-30)) || (z<0))
        this.allTree.scrollTop=z+this.allTree.scrollTop;
};













///DragAndDrop

dhtmlXTreeObject.prototype._preventNsDrag=function(e){
    if ((e)&&(e.preventDefault)) { e.preventDefault(); return false; }
    return false;
}

dhtmlXTreeObject.prototype._drag=function(sourceHtmlObject,dhtmlObject,targetHtmlObject){
    if (this._autoOpenTimer) clearTimeout(this._autoOpenTimer);

    if (!targetHtmlObject.parentObject){
        targetHtmlObject=this.htmlNode.htmlNode.childNodes[0].childNodes[0].childNodes[1].childNodes[0];
        this.dadmodec=0;
    }

    this._clearMove();
    var z=sourceHtmlObject.parentObject.treeNod;
    if ((z)&&(z._clearMove))   z._clearMove("");

    if ((!this.dragMove)||(this.dragMove()))
    {
        if ((!z)||(!z._clearMove)||(!z._dragged)) var col=new Array(sourceHtmlObject.parentObject);
        else var col=z._dragged;
        var trg=targetHtmlObject.parentObject;

        for (var i=0; i<col.length; i++){
            var newID=this._moveNode(col[i],trg);
            if ((this.dadmodec)&&(newID!==false)) trg=this._globalIdStorageFind(newID,true,true);
            if ((newID)&&(!this._sADnD)) this.selectItem(newID,0,1);
        }

    }
    if (z) z._dragged=new Array();


}

dhtmlXTreeObject.prototype._dragIn=function(htmlObject,shtmlObject,x,y){

    if (!this.dADTempOff) return 0;
    var fobj=shtmlObject.parentObject;
    var tobj=htmlObject.parentObject;
    if ((!tobj)&&(this._ddronr)) return;
    if (!this.callEvent("onDragIn",[fobj.id,tobj?tobj.id:null,fobj.treeNod,this])){
        if (tobj) this._autoScroll(htmlObject);
        return 0;
    }


    if (!tobj)
        this.allTree.className+=" selectionBox";
    else
    {
        if (fobj.childNodes==null){
            this._setMove(htmlObject,x,y);
            return htmlObject;
        }

        var stree=fobj.treeNod;
        for (var i=0; i<stree._dragged.length; i++)
            if (this._checkPNodes(tobj,stree._dragged[i])){
                this._autoScroll(htmlObject);
                return 0;
            }
//#__pro_feature:01112006{
//#complex_move:01112006{	 
        this.selectionBar.parentNode.removeChild(this.selectionBar);
        tobj.span.parentNode.appendChild(this.selectionBar);
//#}
//#}
        this._setMove(htmlObject,x,y);
        if (this._getOpenState(tobj)<=0){
            this._autoOpenId=tobj.id;
            this._autoOpenTimer=window.setTimeout(new callerFunction(this._autoOpenItem,this),1000);
        }
    }

    return htmlObject;

}
dhtmlXTreeObject.prototype._autoOpenItem=function(e,treeObject){
    treeObject.openItem(treeObject._autoOpenId);
};
dhtmlXTreeObject.prototype._dragOut=function(htmlObject){
    this._clearMove();
    if (this._autoOpenTimer) clearTimeout(this._autoOpenTimer);
}


//#__pro_feature:01112006{

/**
 *     @desc: return next node
 *     @type: private
 *     @param: item - node object
 *     @param: mode - inner flag
 *     @return: next node or -1
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._getNextNode=function(item,mode){
    if ((!mode)&&(item.childsCount)) return item.childNodes[0];
    if (item==this.htmlNode)
        return -1;
    if ((item.tr)&&(item.tr.nextSibling)&&(item.tr.nextSibling.nodem))
        return item.tr.nextSibling.nodem;

    return this._getNextNode(item.parentObject,true);
};

/**
 *     @desc: return last child of item (include all sub-child collections)
 *     @type: private
 *     @param: item - node object
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._lastChild=function(item){
    if (item.childsCount)
        return this._lastChild(item.childNodes[item.childsCount-1]);
    else return item;
};

/**
 *     @desc: return previous node
 *     @type: private
 *     @param: item - node object
 *     @param: mode - inner flag
 *     @return: previous node or -1
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._getPrevNode=function(node,mode){
    if ((node.tr)&&(node.tr.previousSibling)&&(node.tr.previousSibling.nodem))
        return this._lastChild(node.tr.previousSibling.nodem);

    if (node.parentObject)
        return node.parentObject;
    else return -1;
};



//#find_item:01112006{

/**
 *     @desc: find tree item by text, select and focus it
 *     @type: public
 *     @param: searchStr - search text
 *     @param: direction - 0: top -> bottom; 1: bottom -> top
 *     @param: top - 1: start searching from top
 *     @return: node id
 *     @edition: Professional
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.findItem=function(searchStr,direction,top){
    var z=this._findNodeByLabel(searchStr,direction,(top?this.htmlNode:null));
    if (z){
        this.selectItem(z.id,true);
        this._focusNode(z);
        return z.id;
    }
    else return null;
}

/**
 *     @desc: find tree item by text
 *     @type: public
 *     @param: searchStr - search text
 *     @param: direction - 0: top -> bottom; 1: bottom -> top
 *     @param: top - 1: start searching from top
 *     @return: node id
 *     @edition: Professional
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.findItemIdByLabel=function(searchStr,direction,top){
    var z=this._findNodeByLabel(searchStr,direction,(top?this.htmlNode:null));
    if (z)
        return z.id
    else return null;
}

//#smart_parsing:01112006{
/**
 *     @desc: find tree item by text in unParsed XML
 *     @type: private
 *     @param: node - start xml node
 *     @param: field - name of xml attribute
 *     @param: cvalue - search text
 *     @return: true/false
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.findStrInXML=function(node,field,cvalue){
    if (!node.childNodes && node.item) return this.findStrInJSON(node,field,cvalue);
    for (var i=0; i<node.childNodes.length; i++)
    {
        if (node.childNodes[i].nodeType==1)
        {

            var z=node.childNodes[i].getAttribute(field);
            if (!z && node.childNodes[i].tagName=="itemtext")  z=node.childNodes[i].firstChild.data;
            if ((z)&&(z.toLowerCase().search(cvalue)!=-1))
                return true;
            if (this.findStrInXML(node.childNodes[i],field,cvalue)) return true;
        }
    }
    return false;
}
dhtmlXTreeObject.prototype.findStrInJSON=function(node,field,cvalue){
    for (var i=0; i<node.item.length; i++)
    {
        var z=node.item[i].text;
        if ((z)&&(z.toLowerCase().search(cvalue)!=-1))
            return true;
        if (node.item[i].item && this.findStrInJSON(node.item[i],field,cvalue)) return true;
    }
    return false;
}
//#}

/**
 *     @desc: find tree item by text
 *     @type: private
 *     @param: searchStr - search text
 *     @param: direction - 0: top -> bottom; 1: bottom -> top
 *     @param: fromNode - node from which search begin
 *     @return: node id
 *     @topic: 2
 */
dhtmlXTreeObject.prototype._findNodeByLabel=function(searchStr,direction,fromNode){
    //trim
    var searchStr=searchStr.replace(new RegExp("^( )+"),"").replace(new RegExp("( )+$"),"");
    searchStr =  new RegExp(searchStr.replace(/([\?\*\+\\\[\]\(\)]{1})/gi,"\\$1").replace(/ /gi,".*"),"gi");

    //get start node
    if (!fromNode)
    {
        fromNode=this._selected[0];
        if (!fromNode) fromNode=this.htmlNode;
    }

    var startNode=fromNode;

    //first step
    if (!direction){
        if ((fromNode.unParsed)&&(this.findStrInXML(fromNode.unParsed.d,"text",searchStr)))
            this.reParse(fromNode);
        fromNode=this._getNextNode(startNode);
        if (fromNode==-1) fromNode=this.htmlNode.childNodes[0];
    }
    else
    {
        var z2=this._getPrevNode(startNode);
        if (z2==-1) z2=this._lastChild(this.htmlNode);
        if ((z2.unParsed)&&(this.findStrInXML(z2.unParsed.d,"text",searchStr)))
        {   this.reParse(z2); fromNode=this._getPrevNode(startNode); }
        else fromNode=z2;
        if (fromNode==-1) fromNode=this._lastChild(this.htmlNode);
    }



    while ((fromNode)&&(fromNode!=startNode)){
        if ((fromNode.label)&&(fromNode.label.search(searchStr)!=-1))
            return (fromNode);

        if (!direction){
            if (fromNode==-1) { if (startNode==this.htmlNode) break; fromNode=this.htmlNode.childNodes[0]; }
            if ((fromNode.unParsed)&&(this.findStrInXML(fromNode.unParsed.d,"text",searchStr)))
                this.reParse(fromNode);
            fromNode=this._getNextNode(fromNode);
            if (fromNode==-1) fromNode=this.htmlNode;
        }
        else
        {
            var z2=this._getPrevNode(fromNode);
            if (z2==-1) z2=this._lastChild(this.htmlNode);
            if ((z2.unParsed)&&(this.findStrInXML(z2.unParsed.d,"text",searchStr)))
            {   this.reParse(z2); fromNode=this._getPrevNode(fromNode); }
            else fromNode=z2;
            if (fromNode==-1) fromNode=this._lastChild(this.htmlNode);
        }
    }
    return null;
};

//#}
//#}


//#complex_move:01112006{

/**
 *     @desc: move item (inside of tree)
 *     @type:  public
 *     @param: itemId - item Id
 *     @param: mode - moving mode (left,up,down,item_child,item_sibling,item_sibling_next,up_strict,down_strict)
 *     @param: targetId - target Node in item_child and item_sibling mode
 *     @param: targetTree - used for moving between trees (optional)
 *     @return: node id
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.moveItem=function(itemId,mode,targetId,targetTree)
{
    var sNode=this._globalIdStorageFind(itemId);
    if (!sNode) return (0);

    switch(mode){
        case "right": alert('Not supported yet');
            break;
        case "item_child":
            var tNode=(targetTree||this)._globalIdStorageFind(targetId);
            if (!tNode) return (0);
            (targetTree||this)._moveNodeTo(sNode,tNode,0);
            break;
        case "item_sibling":
            var tNode=(targetTree||this)._globalIdStorageFind(targetId);
            if (!tNode) return (0);
            (targetTree||this)._moveNodeTo(sNode,tNode.parentObject,tNode);
            break;
        case "item_sibling_next":
            var tNode=(targetTree||this)._globalIdStorageFind(targetId);
            if (!tNode) return (0);
            if ((tNode.tr)&&(tNode.tr.nextSibling)&&(tNode.tr.nextSibling.nodem))
                (targetTree||this)._moveNodeTo(sNode,tNode.parentObject,tNode.tr.nextSibling.nodem);
            else
                (targetTree||this)._moveNodeTo(sNode,tNode.parentObject);
            break;
        case "left": if (sNode.parentObject.parentObject)
            this._moveNodeTo(sNode,sNode.parentObject.parentObject,sNode.parentObject);
            break;
        case "up": var z=this._getPrevNode(sNode);
            if ((z==-1)||(!z.parentObject)) return;
            this._moveNodeTo(sNode,z.parentObject,z);
            break;
        case "up_strict": var z=this._getIndex(sNode);
            if (z!=0)
                this._moveNodeTo(sNode,sNode.parentObject,sNode.parentObject.childNodes[z-1]);
            break;
        case "down_strict": var z=this._getIndex(sNode);
            var count=sNode.parentObject.childsCount-2;
            if (z==count)
                this._moveNodeTo(sNode,sNode.parentObject);
            else if (z<count)
                this._moveNodeTo(sNode,sNode.parentObject,sNode.parentObject.childNodes[z+2]);
            break;
        case "down": var z=this._getNextNode(this._lastChild(sNode));
            if ((z==-1)||(!z.parentObject)) return;
            if (z.parentObject==sNode.parentObject)
                var z=this._getNextNode(z);
            if (z==-1){
                this._moveNodeTo(sNode,sNode.parentObject);
            }
            else
            {
                if ((z==-1)||(!z.parentObject)) return;
                this._moveNodeTo(sNode,z.parentObject,z);
            }
            break;
    }
    if (_isIE && _isIE<8){
        this.allTree.childNodes[0].border = "1";
        this.allTree.childNodes[0].border = "0";
    }
}

//#__pro_feature:01112006{

/**
 *     @desc: set Drag-And-Drop behavior (child - drop as chils, sibling - drop as sibling, complex - complex drop behaviour )
 *     @type: public
 *     @edition: Professional
 *     @param: mode - behavior name (child,sibling,complex)
 *     @param: select - select droped node after drag-n-drop, true by default
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.setDragBehavior=function(mode,select){
    this._sADnD=(!convertStringToBoolean(select));
    switch (mode) {
        case "child": this.dadmode=0; break;
        case "sibling": this.dadmode=1; break;
        case "complex": this.dadmode=2; break;
    }    };




//#}
//#}







/**
 *     @desc: load xml for tree branch
 *     @param: id - id of parent node
 *     @param: src - path to xml, optional
 *     @type: private
 *     @topic: 1
 */
dhtmlXTreeObject.prototype._loadDynXML=function(id,src) {
    src=src||this.XMLsource;
    var sn=(new Date()).valueOf();
    this._ld_id=id;
//#__pro_feature:01112006{
    if (this.xmlalb=="function"){
        if (src) src(this._escape(id));
    }
    else
    if (this.xmlalb=="name")
        this.loadXML(src+this._escape(id));
    else
    if (this.xmlalb=="xmlname")
        this.loadXML(src+this._escape(id)+".xml?uid="+sn);
    else
//#}
        this.loadXML(src+getUrlSymbol(src)+"uid="+sn+"&id="+this._escape(id));
};


//#__pro_feature:01112006{
//#multiselect:01112006{
/**
 *     @desc: enable multiselection
 *     @beforeInit: 1
 *     @param: mode - 1 - on, 0 - off;
 *     @param: strict - 1 - on, 0 - off; in strict mode only items on the same level can be selected
 *     @type: public
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableMultiselection=function(mode,strict) {
    this._amsel=convertStringToBoolean(mode);
    this._amselS=convertStringToBoolean(strict);
};

/**
 *     @desc: check logic of selection
 *     @type: private
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._checkMSelectionLogic=function() {
    var usl=new Array();
    for (var i=0; i<this._selected.length; i++)
        for (var j=0; j<this._selected.length; j++)
            if ((i!=j)&&(this._checkPNodes(this._selected[j],this._selected[i])))
                usl[usl.length]=this._selected[j];

    for (var i=0; i<usl.length; i++)
        this._unselectItem(usl[i]);

};
//#}
//#}




/**
 *     @desc: check possibility of drag-and-drop
 *     @type: private
 *     @param: itemId - draged node id
 *     @param: htmlObject - droped node object
 *     @param: shtmlObject - sourse node object
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._checkPNodes=function(item1,item2){
    if (this._dcheckf) return false;
    if (item2==item1) return 1
    if (item1.parentObject) return this._checkPNodes(item1.parentObject,item2); else return 0;
};
dhtmlXTreeObject.prototype.disableDropCheck = function(mode){
    this._dcheckf = convertStringToBoolean(mode);
};


//#__pro_feature:01112006{
//#distributed_load:01112006{

/**
 *     @desc: enable distributed parsing of big tree (items loaded portion by portion with some timeouts)
 *     @type: public
 *     @edition: Professional
 *     @param: mode - true/false
 *     @param: count - critical count to start distibuting (optional)
 *     @param: delay - delay between distributed calls, ms (optional)
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.enableDistributedParsing=function(mode,count,delay){
    this._edsbps=convertStringToBoolean(mode);
    this._edsbpsA=new Array();
    this._edsbpsC=count||10;
    this._edsbpsD=delay||250;
}
/**
 *     @desc: get current state of distributed parsing
 *     @type: public
 *     @edition: Professional
 *     @returns: true - still parsing; false - parsing finished
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.getDistributedParsingState=function(){
    return (!((!this._edsbpsA)||(!this._edsbpsA.length)));
}
/**
 *     @desc: get current parsing state of item
 *     @type: public
 *     @edition: Professional
 *     @returns: 1 - item already parsed; 0 - item not parsed yet; -1 - item in parsing process
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.getItemParsingState=function(itemId){
    var z=this._globalIdStorageFind(itemId,true,true)
    if (!z) return 0;
    if (this._edsbpsA)
        for (var i=0; i<this._edsbpsA.length; i++)
            if (this._edsbpsA[i][2]==itemId) return -1;

    return 1;
}

dhtmlXTreeObject.prototype._distributedStart=function(node,start,parentId,level,start2){
    if (!this._edsbpsA)
        this._edsbpsA=new Array();
    this._edsbpsA[this._edsbpsA.length]=[node,start,parentId,level,start2];
}

dhtmlXTreeObject.prototype._distributedStep=function(pId){
    var self=this;
    if ((!this._edsbpsA)||(!this._edsbpsA.length)) {
        self.XMLloadingWarning=0;
        return;
    }
    var z=this._edsbpsA[0];
    this.parsedArray=new Array();
    this._parse(z[0],z[2],z[3],z[1]);
    var zkx=this._globalIdStorageFind(z[2]);
    this._redrawFrom(this,zkx,z[4],this._getOpenState(zkx));
    var chArr=this.setCheckList.split(this.dlmtr);
    for (var n=0; n<chArr.length; n++)
        if (chArr[n]) this.setCheck(chArr[n],1);

    this._edsbpsA=(new Array()).concat(this._edsbpsA.slice(1));


    if ((!this._edsbpsA.length)){
        window.setTimeout( function(){ if (self.onXLE) self.onXLE(self,pId); self.callEvent("onXLE",[self,pId]); },1);
        self.xmlstate=0;
    }
}

//#}
//#}




//#__pro_feature:01112006{

/**
 *     @desc: replace images with text signs
 *     @type: public
 *     @param: mode - true/false
 *     @edition: Professional
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.enableTextSigns=function(mode){
    this._txtimg=convertStringToBoolean(mode);
}

//#}

/**
 *   @desc:  prevent caching in IE  by adding random value to URL string
 *   @param: mode - enable/disable random value ( disabled by default )
 *   @type: public
 *   @topic: 0
 */
dhtmlXTreeObject.prototype.preventIECaching=function(mode){
    this.no_cashe = convertStringToBoolean(mode);
    this.XMLLoader.rSeed=this.no_cashe;
}
dhtmlXTreeObject.prototype.preventIECashing=dhtmlXTreeObject.prototype.preventIECaching;





/**
 *     @desc: disable checkbox
 *     @param: itemId - Id of tree item
 *     @param: mode - 1 - on, 0 - off;
 *     @type: public
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.disableCheckbox=function(itemId,mode) {
    if (typeof(itemId)!="object")
        var sNode=this._globalIdStorageFind(itemId,0,1);
    else
        var sNode=itemId;
    if (!sNode) return;
    sNode.dscheck=convertStringToBoolean(mode)?(((sNode.checkstate||0)%3)+3):((sNode.checkstate>2)?(sNode.checkstate-3):sNode.checkstate);
    this._setCheck(sNode);
    if (sNode.dscheck<3) sNode.dscheck=false;
};

//#__pro_feature:01112006{


/**
 *     @desc: refresh specified tree branch (get XML from server, add new nodes, remove not used nodes)
 *     @param: itemId -  top node in branch
 *     @param: source - server side script , optional
 *     @type: public
 *     @edition: Professional
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.smartRefreshBranch=function(itemId,source){
    this._branchUpdate=1;
    this.smartRefreshItem(itemId,source);
}

/**
 *     @desc: refresh specified tree item (get XML from server, add new nodes, remove not used nodes)
 *     @param: itemId -  top node in branch
 *     @param: source - server side script , optional
 *     @type: public
 *     @edition: Professional
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.smartRefreshItem=function(itemId,source){
    var sNode=this._globalIdStorageFind(itemId);
    for (var i=0; i<sNode.childsCount; i++)
        sNode.childNodes[i]._dmark=true;

    this.waitUpdateXML=true;
    if (source && source.exists)
        this._parse(source,itemId);
    else
        this._loadDynXML(itemId,source);
};


/**
 *     @desc: refresh specified tree nodes (get XML from server and updat only nodes included in itemIdList)
 *     @param: itemIdList - list of node identificators
 *     @param: source - server side script
 *     @type: public
 *     @edition: Professional
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.refreshItems=function(itemIdList,source){
    var z=itemIdList.toString().split(this.dlmtr);
    this.waitUpdateXML=new Array();
    for (var i=0; i<z.length; i++)
        this.waitUpdateXML[z[i]]=true;
    this.loadXML((source||this.XMLsource)+getUrlSymbol(source||this.XMLsource)+"ids="+this._escape(itemIdList));
};


/**
 *     @desc: update item properties
 *     @param: itemId - list of node identificators
 *     @param: name - list of node identificators, optional
 *     @param: im0 - list of node identificators, optional
 *     @param: im1 - list of node identificators, optional
 *     @param: im2 - list of node identificators, optional
 *     @param: achecked - list of node identificators, optional
 *     @param: child - child attribute for dynamic loading
 *     @type: public
 *     @edition: Professional
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.updateItem=function(itemId,name,im0,im1,im2,achecked,child){
    var sNode=this._globalIdStorageFind(itemId);
    sNode.userData=new cObject();
    if (name) sNode.label=name;
    sNode.images=new Array(im0||this.imageArray[0],im1||this.imageArray[1],im2||this.imageArray[2]);
    this.setItemText(itemId,name);
    if (achecked) this._setCheck(sNode,true);
    if(child=="1") sNode.XMLload = 0;
    this._correctPlus(sNode);
    sNode._dmark=false;
    return sNode;
};

/**
 *     @desc: set function called after drag-and-drap event occured
 *     @param: func - event handling function
 *     @type: deprecated
 *     @edition: Professional
 *     @topic: 0,7
 *     @event:  onDrop
 *     @depricated: use grid.attachEvent("onDrop",func); instead
 *     @eventdesc:  Event raised after drag-and-drop processed. Event also raised while programmatic moving nodes.
 *     @eventparam:  ID of source item (ID after inserting in tree, my be not equal to initial ID)
 *     @eventparam:  ID of target item
 *     @eventparam:  if node droped as sibling then contain id of item before whitch source node will be inserted
 *     @eventparam:  source Tree object
 *     @eventparam:  target Tree object
 */
dhtmlXTreeObject.prototype.setDropHandler=function(func){  this.attachEvent("onDrop",func);  };

/**
 *     @desc: set function called before xml loading/parsing started
 *     @param: func - event handling function
 *     @type: deprecated
 *     @edition: Professional
 *     @topic: 0,7
 *     @event:  onXLS
 *     @depricated: use grid.attachEvent("onXLS",func); instead
 *     @eventdesc: event fired simultaneously with starting XML parsing
 *     @eventparam: tree object
 *     @eventparam: item id, for which xml loaded
 */
dhtmlXTreeObject.prototype.setOnLoadingStart=function(func){    this.attachEvent("onXLS",func);  };
/**
 *     @desc: set function called after xml loading/parsing ended
 *     @param: func - event handling function
 *     @type: deprecated
 *     @edition: Professional
 *     @topic: 0,7
 *     @event:  onXLE
 *     @depricated: use grid.attachEvent("onXLE",func); instead
 *     @eventdesc: event fired simultaneously with ending XML parsing, new items already available in tree
 *     @eventparam: tree object
 *     @eventparam: last parsed parent id
 */
dhtmlXTreeObject.prototype.setOnLoadingEnd=function(func){  this.attachEvent("onXLE",func); };



/**
 *     @desc: define which script be called on dynamic loading
 *     @param: mode - id for some_script?id=item_id ;  name for  some_scriptitem_id, xmlname for  some_scriptitem_id.xml ; function for calling user defined handler
 *     @type: public
 *     @edition: Professional
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.setXMLAutoLoadingBehaviour=function(mode) {
    this.xmlalb=mode;
};


/**
 *     @desc: enable smart checkboxes ,true by default (auto checking children and parents for 3-state checkboxes)
 *     @param: mode - 1 - on, 0 - off;
 *     @type: public
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableSmartCheckboxes=function(mode) { this.smcheck=convertStringToBoolean(mode); };

/**
 *     @desc: return current state of XML loading
 *     @type: public
 *     @edition: Professional
 *     @return: current state, true - xml loading now
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.getXMLState=function(){ return (this.xmlstate==1); };

/**
 *     @desc: set top offset for item
 *     @type: public
 *     @param: itemId - id of item
 *     @param: value - value of top offset in px
 *     @edition: Professional
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.setItemTopOffset=function(itemId,value){
    if (typeof(itemId)=="string")
        var node=this._globalIdStorageFind(itemId);
    else
        var node=itemId;


    var z=node.span.parentNode.parentNode;
    node.span.style.paddingBottom="1px";

    for (var i=0; i<z.childNodes.length; i++){
        if (i!=0){

            if (_isIE){
                z.childNodes[i].style.height="18px";
                z.childNodes[i].style.paddingTop=parseInt(value)+"px";
            }else
                z.childNodes[i].style.height=18+parseInt(value)+"px";
        }
        else{
            var w=z.childNodes[i].firstChild;
            if (z.childNodes[i].firstChild.tagName!='DIV'){
                w=document.createElement("DIV");
                z.childNodes[i].insertBefore(w,z.childNodes[i].firstChild);
            }
            w.style.height=parseInt(value)+"px";
            if ((node.parentObject.id!=this.rootId || node.parentObject.childNodes[0]!=node) && this.treeLinesOn)
                w.style.backgroundImage="url("+this.imPath+this.lineArray[5]+")";
            w.innerHTML="&nbsp;";
            w.style.overflow='hidden';
            if (parseInt(value)==0)
                z.childNodes[i].removeChild(w);
        }
        if (!_isIE)
            z.childNodes[i].style.verticalAlign="bottom";
        if (_isIE){
            this.allTree.childNodes[0].border = "1";
            this.allTree.childNodes[0].border = "0";
        }
    }

}

/**
 *     @desc: set size of icons
 *     @type:  public
 *     @param: newWidth - new icon width
 *     @param: newHeight - new icon height
 *     @param: itemId - item Id, if skipped set default value for all new icons, optional
 *     @edition: Professional
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.setIconSize=function(newWidth,newHeight,itemId)
{
    if (itemId){
        if ((itemId)&&(itemId.span))
            var sNode=itemId;
        else
            var sNode=this._globalIdStorageFind(itemId);

        if (!sNode) return (0);
        var img=sNode.span.parentNode.previousSibling.childNodes[0];
        if (newWidth) {
            img.style.width=newWidth;
            if (window._KHTMLrv) img.parentNode.style.width=newWidth;
        }
        if (newHeight) {
            img.style.height=newHeight;
            if (window._KHTMLrv) img.parentNode.style.height=newHeight;
        }
    }
    else{
        this.def_img_x=newWidth;
        this.def_img_y=newHeight;
    }
}

/**
 *     @desc: get url of item image
 *     @type: public
 *     @param: itemId - id of item
 *     @param: imageInd - index of image ( 0 - leaf, 1 - closed folder, 2 - opened folder)
 *     @param: value - value of top offset
 *     @edition: Professional
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.getItemImage=function(itemId,imageInd,fullPath){
    var node=this._globalIdStorageFind(itemId);
    if (!node) return "";
    var img=node.images[imageInd||0];
    if (fullPath) img=this.iconURL+img;
    return img;
}

/**
 *     @desc: replace checkboxes with radio buttons
 *     @type: public
 *     @param: mode - true/false
 *     @param: itemId - node for which replacement called (optional)
 *     @edition: Professional
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.enableRadioButtons=function(itemId,mode){
    if (arguments.length==1){
        this._frbtr=convertStringToBoolean(itemId);
        this.checkBoxOff=this.checkBoxOff||this._frbtr;
        return;
    }


    var node=this._globalIdStorageFind(itemId);
    if (!node) return "";
    mode=convertStringToBoolean(mode);
    if ((mode)&&(!node._r_logic)){
        node._r_logic=true;
        for (var i=0; i<node.childsCount; i++)
            this._setCheck(node.childNodes[i],node.childNodes[i].checkstate);
    }

    if ((!mode)&&(node._r_logic)){
        node._r_logic=false;
        for (var i=0; i<node.childsCount; i++)
            this._setCheck(node.childNodes[i],node.childNodes[i].checkstate);
    }
}
/**
 *     @desc: replace checkboxes with radio buttons
 *     @type: public
 *     @param: mode - true/false
 *     @param: itemId - node for which replacement called (optional)
 *     @edition: Professional
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.enableSingleRadioMode=function(mode){
    this._frbtrs=convertStringToBoolean(mode);
}


/**
 *     @desc: configure if parent node will be expanded immideatly after child item added
 *     @type: public
 *     @param: mode - true/false
 *     @edition: Professional
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.openOnItemAdded=function(mode){
    this._hAdI=!convertStringToBoolean(mode);
}
dhtmlXTreeObject.prototype.openOnItemAdding=function(mode){
    this._hAdI=!convertStringToBoolean(mode);
}

/**
 *     @desc: enable multi line items
 *     @beforeInit: 1
 *     @param: width - text width, if equls zero then use single lines items;
 *     @type: public
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableMultiLineItems=function(width) { if (width===true) this.mlitems="100%"; else this.mlitems=width; }

/**
 *     @desc: enable auto tooltips (node text as tooltip)
 *     @beforeInit: 1
 *     @param: mode - 1 - on, 0 - off;
 *     @type: public
 *     @edition:Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableAutoTooltips=function(mode) { this.ettip=convertStringToBoolean(mode); };


/**
 *     @desc: unselect item in tree
 *     @type: public
 *     @param: itemId - used in multi selection tree (optional)
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.clearSelection=function(itemId){
    if (itemId)
        this._unselectItem(this._globalIdStorageFind(itemId));
    else
        this._unselectItems();
}

/**
 *     @desc: show/hide (+/-) icon (works only for individual items, not for entire tree )
 *     @type: public
 *     @param: itemId - id of selected item
 *     @param: state - show state : 0/1
 *     @edition: Professional
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.showItemSign=function(itemId,state){
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;

    var z=temp.span.parentNode.previousSibling.previousSibling.previousSibling;
    if (!convertStringToBoolean(state)){
        this._openItem(temp)
        temp.closeble=false;
        temp.wsign=true;
    }
    else
    {
        temp.closeble=true;
        temp.wsign=false;
    }
    this._correctPlus(temp);
}
/**
 *     @desc: show/hide checkbox for tree item (works only for individual items, not for entire tree )
 *     @type: public
 *     @param: itemId - id of selected item, optional, set null to change states of all items
 *     @param: state - checkbox show state : 0/1
 *     @edition: Professional
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.showItemCheckbox=function(itemId,state){
    if (!itemId)
        for (var a in this._idpull)
            this.showItemCheckbox(this._idpull[a],state);

    if (typeof(itemId)!="object")
        itemId=this._globalIdStorageFind(itemId,0,0);

    if (!itemId) return 0;
    itemId.nocheckbox=!convertStringToBoolean(state);
    var t=itemId.span.parentNode.previousSibling.previousSibling.childNodes[0];
    t.style.display=(!itemId.nocheckbox)?"":"none";
    if (window._KHTMLrv) t.parentNode.style.display=(!itemId.nocheckbox)?"":"none";
}

/**
 *     @desc: set list separator ("," by default)
 *     @type: public
 *     @param: separator - char or string to use for separating items in lists
 *     @edition: Professional
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.setListDelimeter=function(separator){
    this.dlmtr=separator;
}

//#}


/**
 *     @desc: set escaping mode (used for escaping ID in requests)
 *     @param: mode - escaping mode ("utf8" for UTF escaping)
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.setEscapingMode=function(mode){
    this.utfesc=mode;
}


/**
 *     @desc: enable item highlighting (item text highlited on mouseover)
 *     @beforeInit: 1
 *     @param: mode - 1 - on, 0 - off;
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableHighlighting=function(mode) { this.ehlt=true; this.ehlta=convertStringToBoolean(mode); };

/**
 *     @desc: called on mouse out
 *     @type: private
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._itemMouseOut=function(){
    var that=this.childNodes[3].parentObject;
    var tree=that.treeNod;
    tree.callEvent("onMouseOut",[that.id]);
    if (that.id==tree._l_onMSI) tree._l_onMSI=null;
    if (!tree.ehlta) return;
    that.span.className=that.span.className.replace("_lor","");
}
/**
 *     @desc: called on mouse in
 *     @type: private
 *     @topic: 0
 */
dhtmlXTreeObject.prototype._itemMouseIn=function(){
    var that=this.childNodes[3].parentObject;
    var tree=that.treeNod;

    if (tree._l_onMSI!=that.id) tree.callEvent("onMouseIn",[that.id]);
    tree._l_onMSI=that.id;
    if (!tree.ehlta) return;
    that.span.className=that.span.className.replace("_lor","");
    that.span.className=that.span.className.replace(/((standart|selected)TreeRow)/,"$1_lor");
}

/**
 *     @desc: enable active images (clickable and dragable). By default only text part of the node is active
 *     @beforeInit: 1
 *     @param: mode - 1 - on, 0 - off;
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableActiveImages=function(mode){this._aimgs=convertStringToBoolean(mode); };

/**
 *     @desc: focus item in tree (scroll to it if necessary)
 *     @type: public
 *     @param: itemId - item Id
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.focusItem=function(itemId){
    var sNode=this._globalIdStorageFind(itemId);
    if (!sNode) return (0);
    this._focusNode(sNode);
};


/**
 *     @desc: Returns the list of all children from all next levels of tree, separated by default delimiter.
 *     @param: itemId - id of node
 *     @type: public
 *     @return: list of all children items from all next levels of tree, separated by default delimiter
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.getAllSubItems =function(itemId){
    return this._getAllSubItems(itemId);
}

/**
 *     @desc: Returns the list of all items which doesn't have child nodes.
 *     @type: public
 *     @return: list of all items which doesn't have child nodes.
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.getAllChildless =function(){
    return this._getAllScraggyItems(this.htmlNode);
}
dhtmlXTreeObject.prototype.getAllLeafs=dhtmlXTreeObject.prototype.getAllChildless;


/**
 *     @desc: Returns the list of all children from all next levels of tree, separated by default delimiter.
 *     @param: itemId - id of node
 *     @edition: Professional
 *     @type: private
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._getAllScraggyItems =function(node)
{
    var z="";
    for (var i=0; i<node.childsCount; i++)
    {
        if ((node.childNodes[i].unParsed)||(node.childNodes[i].childsCount>0))
        {
            if (node.childNodes[i].unParsed)
                var zb=this._getAllScraggyItemsXML(node.childNodes[i].unParsed,1);
            else
                var zb=this._getAllScraggyItems(node.childNodes[i])

            if (zb)
                if (z) z+=this.dlmtr+zb;
                else z=zb;
        }
        else
        if (!z) z=node.childNodes[i].id;
        else z+=this.dlmtr+node.childNodes[i].id;
    }
    return z;
};





/**
 *     @desc: Returns the list of all children from all next levels of tree, separated by default delimiter.
 *     @param: itemId - id of node
 *     @type: private
 *     @edition: Professional
 *     @topic: 6
 */
dhtmlXTreeObject.prototype._getAllFatItems =function(node)
{
    var z="";
    for (var i=0; i<node.childsCount; i++)
    {
        if ((node.childNodes[i].unParsed)||(node.childNodes[i].childsCount>0))
        {
            if (!z) z=node.childNodes[i].id;
            else z+=this.dlmtr+node.childNodes[i].id;

            if (node.childNodes[i].unParsed)
                var zb=this._getAllFatItemsXML(node.childNodes[i].unParsed,1);
            else
                var zb=this._getAllFatItems(node.childNodes[i])

            if (zb) z+=this.dlmtr+zb;
        }
    }
    return z;
};

/**
 *     @desc: Returns the list of all items which have child nodes, separated by default delimiter.
 *     @type: public
 *     @return: list of all items which has child nodes, separated by default delimiter.
 *     @topic: 6
 */
dhtmlXTreeObject.prototype.getAllItemsWithKids =function(){
    return this._getAllFatItems(this.htmlNode);
}
dhtmlXTreeObject.prototype.getAllFatItems=dhtmlXTreeObject.prototype.getAllItemsWithKids;



/**
 *     @desc: return list of identificators of nodes with checked checkboxes, separated by default delimiter
 *     @type: public
 *     @return: list of ID of items with checked checkboxes, separated by default delimiter
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.getAllChecked=function(){
    return this._getAllChecked("","",1);
}
/**
 *     @desc: return list of identificators of nodes with unchecked checkboxes, separated by default delimiter
 *     @type: public
 *     @return: list of ID of items with unchecked checkboxes, separated by default delimiter
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.getAllUnchecked=function(itemId){
    if (itemId)
        itemId=this._globalIdStorageFind(itemId);
    return this._getAllChecked(itemId,"",0);
}


/**
 *     @desc: return list of identificators of nodes with third state checkboxes, separated by default delimiter
 *     @type: public
 *     @return: list of ID of items with third state checkboxes, separated by default delimiter
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.getAllPartiallyChecked=function(){
    return this._getAllChecked("","",2);
}


/**
 *     @desc: return list of identificators of nodes with checked and third state checkboxes, separated by default delimiter
 *     @type: public
 *     @return: list of ID of items with checked and third state checkboxes, separated by default delimiter
 *     @topic: 5
 */
dhtmlXTreeObject.prototype.getAllCheckedBranches=function(){
    var temp = [this._getAllChecked("","",1)];
    var second = this._getAllChecked("","",2);
    if (second) temp.push(second);
    return temp.join(this.dlmtr);
}

/**
 *     @desc: return list of identificators of nodes with checked checkboxes
 *     @type: private
 *     @param: node - node object (optional, used by private methods)
 *     @param: list - initial identificators list (optional, used by private methods)
 *     @topic: 5
 */
dhtmlXTreeObject.prototype._getAllChecked=function(htmlNode,list,mode){
    if (!htmlNode) htmlNode=this.htmlNode;

    if (htmlNode.checkstate==mode)
        if (!htmlNode.nocheckbox)  { if (list) list+=this.dlmtr+htmlNode.id; else list=htmlNode.id;  }
    var j=htmlNode.childsCount;
    for (var i=0; i<j; i++)
    {
        list=this._getAllChecked(htmlNode.childNodes[i],list,mode);
    };
//#__pro_feature:01112006{
//#smart_parsing:01112006{
    if  (htmlNode.unParsed)
        list=this._getAllCheckedXML(htmlNode.unParsed,list,mode);
//#}
//#}

    if (list) return list; else return "";
};

/**
 *     @desc: set individual item style
 *     @type: public
 *     @param: itemId - node id
 *     @param: styleString - valid CSS string
 *     @param: resetCss - reset current style : 0/1
 *     @topic: 2
 */
dhtmlXTreeObject.prototype.setItemStyle=function(itemId,style_string,resetCss){
    var resetCss= resetCss|| false;
    var temp=this._globalIdStorageFind(itemId);
    if (!temp) return 0;
    if (!temp.span.style.cssText)
        temp.span.setAttribute("style",temp.span.getAttribute("style")+"; "+style_string);
    else
        temp.span.style.cssText = resetCss? style_string : temp.span.style.cssText+";"+style_string;
}

/**
 *     @desc: enable draging item image with item text
 *     @type: public
 *     @param: mode - true/false
 *     @topic: 1
 */
dhtmlXTreeObject.prototype.enableImageDrag=function(mode){
    this._itim_dg=convertStringToBoolean(mode);
}

/**
 *     @desc: set function called when tree item draged over another item
 *     @param: func - event handling function
 *     @type: depricated
 *     @edition: Professional
 *     @topic: 4
 *     @event: onDragIn
 *     @depricated: use grid.attachEvent("onDragIn",func); instead
 *     @eventdesc: Event raised when item draged other other dropable target
 *     @eventparam:  ID draged item
 *     @eventparam:  ID potencial drop landing
 *     @eventparam:  source object
 *     @eventparam:  target object
 *     @eventreturn: true - allow drop; false - deny drop;
 */
dhtmlXTreeObject.prototype.setOnDragIn=function(func){
    this.attachEvent("onDragIn",func);
};

/**
 *     @desc: enable/disable auto scrolling while drag-and-drop
 *     @type: public
 *     @param: mode - enabled/disabled
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.enableDragAndDropScrolling=function(mode){ this.autoScroll=convertStringToBoolean(mode); };


dhtmlXTreeObject.prototype.setSkin=function(name){
    var tmp = this.parentObject.className.replace(/dhxtree_[^ ]*/gi,"");
    this.parentObject.className= tmp+" dhxtree_"+name;
};

//tree
(function(){

    dhtmlx.extend_api("dhtmlXTreeObject",{
        _init:function(obj){
            return [obj.parent,(obj.width||"100%"),(obj.height||"100%"),(obj.root_id||0)];
        },
        auto_save_selection:"enableAutoSavingSelected",
        auto_tooltip:"enableAutoTooltips",
        checkbox:"enableCheckBoxes",
        checkbox_3_state:"enableThreeStateCheckboxes",
        checkbox_smart:"enableSmartCheckboxes",
        context_menu:"enableContextMenu",
        distributed_parsing:"enableDistributedParsing",
        drag:"enableDragAndDrop",
        drag_copy:"enableMercyDrag",
        drag_image:"enableImageDrag",
        drag_scroll:"enableDragAndDropScrolling",
        editor:"enableItemEditor",
        hover:"enableHighlighting",
        images:"enableTreeImages",
        image_fix:"enableIEImageFix",
        image_path:"setImagePath",
        lines:"enableTreeLines",
        loading_item:"enableLoadingItem",
        multiline:"enableMultiLineItems",
        multiselect:"enableMultiselection",
        navigation:"enableKeyboardNavigation",
        radio:"enableRadioButtons",
        radio_single:"enableSingleRadioMode",
        rtl:"enableRTL",
        search:"enableKeySearch",
        smart_parsing:"enableSmartXMLParsing",
        smart_rendering:"enableSmartRendering",
        text_icons:"enableTextSigns",
        xml:"loadXML",
        skin:"setSkin"
    },{});

})();

dhtmlXTreeObject.prototype._dp_init=function(dp){
    dp.attachEvent("insertCallback", function(upd, id, parent) {
        var data = this._loader.doXPath(".//item",upd);
        var text = data[0].getAttribute('text');
        this.obj.insertNewItem(parent, id, text, 0, 0, 0, 0, "CHILD");
    });

    dp.attachEvent("updateCallback", function(upd, id, parent) {
        var data = this._loader.doXPath(".//item",upd);
        var text = data[0].getAttribute('text');
        this.obj.setItemText(id, text);
        if (this.obj.getParentId(id) != parent) {
            this.obj.moveItem(id, 'item_child', parent);
        }
        this.setUpdated(id, true, 'updated');
    });

    dp.attachEvent("deleteCallback", function(upd, id, parent) {
        this.obj.setUserData(id, this.action_param, "true_deleted");
        this.obj.deleteItem(id, false);
    });

    dp._methods=["setItemStyle","","changeItemId","deleteItem"];
    this.attachEvent("onEdit",function(state,id){
        if (state==3)
            dp.setUpdated(id,true)
        return true;
    });
    this.attachEvent("onDrop",function(id,id_2,id_3,tree_1,tree_2){
        if (tree_1==tree_2)
            dp.setUpdated(id,true);
    });
    this._onrdlh=function(rowId){
        var z=dp.getState(rowId);
        if (z=="inserted") {  dp.set_invalid(rowId,false); dp.setUpdated(rowId,false);	return true; }
        if (z=="true_deleted")  { dp.setUpdated(rowId,false); return true; }

        dp.setUpdated(rowId,true,"deleted")
        return false;
    };
    this._onradh=function(rowId){
        dp.setUpdated(rowId,true,"inserted")
    };
    dp._getRowData=function(rowId){
        var data = {};
        var z=this.obj._globalIdStorageFind(rowId);
        var z2=z.parentObject;

        var i=0;
        for (i=0; i<z2.childsCount; i++)
            if (z2.childNodes[i]==z) break;

        data["tr_id"] = z.id;
        data["tr_pid"] = z2.id;
        data["tr_order"] = i;
        data["tr_text"] = z.span.innerHTML;

        z2=(z._userdatalist||"").split(",");
        for (i=0; i<z2.length; i++)
            data[z2[i]]=z.userData["t_"+z2[i]];

        return data;
    };

};
function jsonPointer(data,parent){
    this.d=data;
    this.dp=parent;
}
jsonPointer.prototype={
    text:function(){ var afff=function(n){ var p=[]; for(var i=0; i<n.length; i++) p.push("{"+sfff(n[i])+"}"); return p.join(","); }; var sfff=function(n){ var p=[]; for (var a in n) if (typeof(n[a])=="object"){ if (a.length) p.push('"'+a+'":['+afff(n[a])+"]");  else p.push('"'+a+'":{'+sfff(n[a])+"}"); }else p.push('"'+a+'":"'+n[a]+'"'); return p.join(","); }; return "{"+sfff(this.d)+"}"; },
    get:function(name){return this.d[name]; },
    exists:function(){return !!this.d },
    content:function(){return this.d.content; },
    each:function(name,f,t){  var a=this.d[name]; var c=new jsonPointer(); if (a) for (var i=0; i<a.length; i++) { c.d=a[i]; f.apply(t,[c,i]); } },
    get_all:function(){ return this.d; },
    sub:function(name){ return new jsonPointer(this.d[name],this.d) },
    sub_exists:function(name){ return !!this.d[name]; },
    each_x:function(name,rule,f,t,i){  var a=this.d[name]; var c=new jsonPointer(0,this.d); if (a) for (i=i||0; i<a.length; i++) if (a[i][rule]) { c.d=a[i]; if(f.apply(t,[c,i])==-1) return; } },
    up:function(name){ return new jsonPointer(this.dp,this.d);  },
    set:function(name,val){ this.d[name]=val;  },
    clone:function(name){ return new jsonPointer(this.d,this.dp); },
    through:function(name,rule,v,f,t){  var a=this.d[name]; if (a.length) for (var i=0; i<a.length; i++) { if (a[i][rule]!=null && a[i][rule]!="" &&  (!v || a[i][rule]==v )) {
        var c=new jsonPointer(a[i],this.d);  f.apply(t,[c,i]); }  var w=this.d; this.d=a[i];
        if (this.sub_exists(name)) this.through(name,rule,v,f,t); this.d=w;   } }
}

/**
 *     @desc: load tree from js array file|stream
 *     @type: public
 *     @param: file - link to JSArray file
 *     @param: afterCall - function which will be called after xml loading
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.loadJSArrayFile=function(file,afterCall){
    if (!this.parsCount) this.callEvent("onXLS",[this,this._ld_id]); this._ld_id=null; this.xmlstate=1;
    var that=this;

    this.XMLLoader=new dtmlXMLLoaderObject(function(){
        eval("var z="+arguments[4].xmlDoc.responseText);
        that.loadJSArray(z);
    },this,true,this.no_cashe);
    if (afterCall) this.XMLLoader.waitCall=afterCall;
    this.XMLLoader.loadXML(file);
};

/**
 *     @desc: load tree from csv file|stream
 *     @type: public
 *     @param: file - link to CSV file
 *     @param: afterCall - function which will be called after xml loading
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.loadCSV=function(file,afterCall){
    if (!this.parsCount) this.callEvent("onXLS",[this,this._ld_id]); this._ld_id=null; this.xmlstate=1;
    var that=this;
    this.XMLLoader=new dtmlXMLLoaderObject(function(){
        that.loadCSVString(arguments[4].xmlDoc.responseText);
    },this,true,this.no_cashe);
    if (afterCall) this.XMLLoader.waitCall=afterCall;
    this.XMLLoader.loadXML(file);
};

/**
 *     @desc: load tree from js array object
 *     @type: public
 *     @param: ar - js array
 *     @param: afterCall - function which will be called after xml loading
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.loadJSArray=function(ar,afterCall){
    //array id,parentid,text
    var z=[];
    for (var i=0; i<ar.length; i++){
        if (!z[ar[i][1]]) z[ar[i][1]]=[];
        z[ar[i][1]].push({id:ar[i][0],text:ar[i][2]});
    }

    var top={id: this.rootId};
    var f=function(top,f){
        if (z[top.id]){
            top.item=z[top.id];
            for (var j=0; j<top.item.length; j++)
                f(top.item[j],f);
        }
    }
    f(top,f);
    this.loadJSONObject(top,afterCall);
}


/**
 *     @desc: load tree from csv string
 *     @type: public
 *     @param: csv - csv string
 *     @param: afterCall - function which will be called after xml loading
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.loadCSVString=function(csv,afterCall){
    //array id,parentid,text
    var z=[];
    var ar=csv.split("\n");
    for (var i=0; i<ar.length; i++){
        var t=ar[i].split(",");
        if (!z[t[1]]) z[t[1]]=[];
        z[t[1]].push({id:t[0],text:t[2]});
    }

    var top={id: this.rootId};
    var f=function(top,f){
        if (z[top.id]){
            top.item=z[top.id];
            for (var j=0; j<top.item.length; j++)
                f(top.item[j],f);
        }
    }
    f(top,f);
    this.loadJSONObject(top,afterCall);
}


/**
 *     @desc: load tree from json object
 *     @type: public
 *     @param: json - json object
 *     @param: afterCall - function which will be called after xml loading
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.loadJSONObject=function(json,afterCall){
    if (!this.parsCount) this.callEvent("onXLS",[this,null]);this.xmlstate=1;
    var p=new jsonPointer(json);
    this._parse(p);
    this._p= p;
    if (afterCall) afterCall();
};


/**
 *     @desc: load tree from json file
 *     @type: public
 *     @param: file - link to JSON file
 *     @param: afterCall - function which will be called after xml loading
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.loadJSON=function(file,afterCall){
    if (!this.parsCount) this.callEvent("onXLS",[this,this._ld_id]); this._ld_id=null; this.xmlstate=1;
    var that=this;

    this.XMLLoader=new dtmlXMLLoaderObject(function(){
        try {
            eval("var t="+arguments[4].xmlDoc.responseText);
        } catch(e){
            dhtmlxError.throwError("LoadXML", "Incorrect JSON", [
                (arguments[4].xmlDoc),
                this
            ]);
            return;
        }
        var p=new jsonPointer(t);
        that._parse(p);
        that._p=p;
    },this,true,this.no_cashe);

    if (afterCall) this.XMLLoader.waitCall=afterCall;
    this.XMLLoader.loadXML(file);
};


/**
 *     @desc: return tree as json string
 *     @type: public
 *     @topic: 0
 */
dhtmlXTreeObject.prototype.serializeTreeToJSON=function(){
    var out=['{"id":"'+this.rootId+'", "item":['];
    var p=[];
    for (var i=0; i<this.htmlNode.childsCount; i++)
        p.push(this._serializeItemJSON(this.htmlNode.childNodes[i]));
    out.push(p.join(","));
    out.push("]}");
    return out.join("");
};
dhtmlXTreeObject.prototype._serializeItemJSON=function(itemNode){
    var out=[];
    if (itemNode.unParsed)
        return (itemNode.unParsed.text());

    if (this._selected.length)
        var lid=this._selected[0].id;
    else lid="";
    var text=itemNode.span.innerHTML;

    text=text.replace(/\"/g, "\\\"", text);

    if (!this._xfullXML)
        out.push('{ "id":"'+itemNode.id+'", '+(this._getOpenState(itemNode)==1?' "open":"1", ':'')+(lid==itemNode.id?' "select":"1",':'')+' "text":"'+text+'"'+( ((this.XMLsource)&&(itemNode.XMLload==0))?', "child":"1" ':''));
    else
        out.push('{ "id":"'+itemNode.id+'", '+(this._getOpenState(itemNode)==1?' "open":"1", ':'')+(lid==itemNode.id?' "select":"1",':'')+' "text":"'+text+'", "im0":"'+itemNode.images[0]+'", "im1":"'+itemNode.images[1]+'", "im2":"'+itemNode.images[2]+'" '+(itemNode.acolor?(', "aCol":"'+itemNode.acolor+'" '):'')+(itemNode.scolor?(', "sCol":"'+itemNode.scolor+'" '):'')+(itemNode.checkstate==1?', "checked":"1" ':(itemNode.checkstate==2?', "checked":"-1"':''))+(itemNode.closeable?', "closeable":"1" ':'')+( ((this.XMLsource)&&(itemNode.XMLload==0))?', "child":"1" ':''));

    if ((this._xuserData)&&(itemNode._userdatalist))
    {
        out.push(', "userdata":[');
        var names=itemNode._userdatalist.split(",");
        var p=[];
        for  (var i=0; i<names.length; i++)
            p.push('{ "name":"'+names[i]+'" , "content":"'+itemNode.userData["t_"+names[i]]+'" }');
        out.push(p.join(",")); out.push("]");
    }

    if (itemNode.childsCount){
        out.push(', "item":[');
        var p=[];
        for (var i=0; i<itemNode.childsCount; i++)
            p.push(this._serializeItemJSON(itemNode.childNodes[i]));
        out.push(p.join(","));
        out.push("]\n");
    }

    out.push("}\n")
    return out.join("");
}

/*
 Product Name: dhtmlxTree
 Version: 4.0.3
 Edition: Standard
 License: content of this file is covered by GPL. Usage outside GPL terms is prohibited. To obtain Commercial or Enterprise license contact sales@dhtmlx.com
 Copyright UAB Dinamenta http://www.dhtmlx.com
 */

function dhtmlXTreeFromHTML(obj){
    if (typeof(obj)!="object")
        obj=document.getElementById(obj);

    var n=obj;
    var id=n.id;
    var cont="";

    for (var j=0; j<obj.childNodes.length; j++)
        if (obj.childNodes[j].nodeType=="1"){
            if (obj.childNodes[j].tagName=="XMP"){
                var cHead=obj.childNodes[j];
                for (var m=0; m<cHead.childNodes.length; m++)
                    cont+=cHead.childNodes[m].data;

            }
            else if (obj.childNodes[j].tagName.toLowerCase()=="ul")
                cont=dhx_li2trees(obj.childNodes[j],new Array(),0);
            break;
        }
    obj.innerHTML="";


    var t=new dhtmlXTreeObject(obj,"100%","100%",0);
    var z_all=new Array();
    for ( b in t )
        z_all[b.toLowerCase()]=b;

    var atr=obj.attributes;
    for (var a=0; a<atr.length; a++)
        if ((atr[a].name.indexOf("set")==0)||(atr[a].name.indexOf("enable")==0)){
            var an=atr[a].name;
            if (!t[an])
                an=z_all[atr[a].name];
            t[an].apply(t,atr[a].value.split(","));
        }

    if (typeof(cont)=="object"){
        t.XMLloadingWarning=1;
        for (var i=0; i<cont.length; i++){
            var n=t.insertNewItem(cont[i][0],cont[i][3],cont[i][1]);
            if (cont[i][2]) t._setCheck(n,cont[i][2]);
        }
        t.XMLloadingWarning=0;
        t.lastLoadedXMLId=0;
        t._redrawFrom(t);
    }
    else
        t.loadXMLString("<tree id='0'>"+cont+"</tree>");
    window[id]=t;

    var oninit = obj.getAttribute("oninit");
    if (oninit) eval(oninit);
    return t;
}

function dhx_init_trees(){
    var z=document.getElementsByTagName("div");
    for (var i=0; i<z.length; i++)
        if (z[i].className=="dhtmlxTree")
            dhtmlXTreeFromHTML(z[i])
}

function dhx_li2trees(tag,data,ind){
    for (var i=0; i<tag.childNodes.length; i++){
        var z=tag.childNodes[i];
        if ((z.nodeType==1)&&(z.tagName.toLowerCase()=="li")){
            var c=""; var ul=null;
            var check=z.getAttribute("checked");
            for (var j=0; j<z.childNodes.length; j++){
                var zc=z.childNodes[j];
                if (zc.nodeType==3) c+=zc.data;
                else if (zc.tagName.toLowerCase()!="ul")  c+=dhx_outer_html(zc);
                else ul=zc;
            }

            data[data.length]=[ind,c,check,(z.id||(data.length+1))];
            if (ul)
                data=dhx_li2trees(ul,data,(z.id||data.length));
        }
    }
    return data;
}

function dhx_outer_html(node){
    if (node.outerHTML) return node.outerHTML;
    var temp=document.createElement("DIV");
    temp.appendChild(node.cloneNode(true));
    temp=temp.innerHTML;
    return temp;
}

if (window.addEventListener) window.addEventListener("load",dhx_init_trees,false);
else    if (window.attachEvent) window.attachEvent("onload",dhx_init_trees);
//(c)dhtmlx ltd. www.dhtmlx.com

/*
 This software is allowed to use under GPL or you need to obtain Commercial or Enterise License
 to use it in non-GPL project. Please contact sales@dhtmlx.com for details
 */
scheduler.attachEvent("onTemplatesReady",function(){var c=new dhtmlDragAndDropObject,f=c.stopDrag,d;c.stopDrag=function(b){d=b||event;return f.apply(this,arguments)};c.addDragLanding(scheduler._els.dhx_cal_data[0],{_drag:function(b,c,f,h){if(!scheduler.checkEvent("onBeforeExternalDragIn")||scheduler.callEvent("onBeforeExternalDragIn",[b,c,f,h,d])){var i=scheduler.attachEvent("onEventCreated",function(a){if(!scheduler.callEvent("onExternalDragIn",[a,b,d]))this._drag_mode=this._drag_id=null,this.deleteEvent(a)}),
    g=scheduler.getActionData(d),a={start_date:new Date(g.date)};if(scheduler.matrix&&scheduler.matrix[scheduler._mode]){var e=scheduler.matrix[scheduler._mode];a[e.y_property]=g.section;var j=scheduler._locate_cell_timeline(d);a.start_date=e._trace_x[j.x];a.end_date=scheduler.date.add(a.start_date,e.x_step,e.x_unit)}if(scheduler._props&&scheduler._props[scheduler._mode])a[scheduler._props[scheduler._mode].map_to]=g.section;scheduler.addEventNow(a);scheduler.detachEvent(i)}},_dragIn:function(b){return b},
    _dragOut:function(){return this}})});