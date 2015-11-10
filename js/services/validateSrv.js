app.factory('validateSrv', function () {
    return {

        httpRegex: RegExp("^(http|https)://"),
        validateTel : function(tel, pristine){
            
            if(pristine) {
              return true;
            }
            else if(tel && tel.match(/^[+-.() \d]+$/)){
                return true;
            }
              return false;
          },

    /*    validateEmail : function(email,pristine){
            if(pristine) {
              return true;
            }
            else if(email && email.match("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,4}$")){
               // console.log("match", email.match("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"));
                console.log("match", email.match("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,4}$"));
                return true;
            }
              return false;
        }
    */
        validateEmail: function(str,pristine){
            var index_at;
                //console.log(pristine)
            if(pristine) {
                return true;
            }
            if(str){//if empty field is pristine
                index_at= str.indexOf('@');
                if( index_at === -1){
                    return false;
                }

                var name= str.substr(0,index_at);
                /* should test name for other invalids*/

                var domain=str.substr(index_at+1);
                /* should check for extra "@" and any other checks that would invalidate an address of which there are likely many*/
                if( domain.indexOf('@') !=-1){
                    return false;
                }
                /* dot can't be first character of domain*/
                var poinPoz = domain.indexOf('.') >0;
                return poinPoz;
            }
        },

        isPassword: function(field, pristine, formSubmitted){
            if((pristine && formSubmitted) ||(!pristine && field.length < 6) ){
                return false;
            }
            return false;
        },

        isEmail : function(str){
            if(str){//if empty field is pristine
                index_at= str.indexOf('@');
                if( index_at === -1){
                    return false;
                }

                var name= str.substr(0,index_at);
                /* should test name for other invalids*/

                var domain=str.substr(index_at+1);
                /* should check for extra "@" and any other checks that would invalidate an address of which there are likely many*/
                if( domain.indexOf('@') !=-1){
                    return false;
                }
                /* dot can't be first character of domain*/
                var poinPoz = domain.indexOf('.') >0;
                return poinPoz;
            }
            return false;
        },


        isValidField: function(input, type, pristine, isSubmitted){
            var reg,
                me = this;
            if(pristine && isSubmitted){
                return false;
            }
            if(pristine && input){
                //continue
            }
            else if(pristine){
                return true;
            }
             switch (type) {
                 case "number":
                     reg = RegExp("^[0-9]+$");
                     break;

                 case "email":
                     reg = RegExp(/[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}/);
                    break;
                 case "word":
                     reg = RegExp("^[a-zA-Z _]");
                     break;
                 case "password":
                    // reg = RegExp("^[a-zA-Z _]");//in case of regex changes
                    // break;
                     return (input && input.length > 5)?true:false;
                 default:
                     console.warn("something else");
                     return false;
             }


            return reg.test(input);
        },

        getValidationCls: function(input, type, pristine, isSubmitted,confirmPswd, optional,invalid){//last one is optional
            var reg,
                me = this;
            if(pristine && isSubmitted){
                return "invalidItem";
            }
            if(pristine && invalid){
                return "invalidItem";
            }

            if(pristine && input){
                //continue
            }
            else if(pristine){
                return "validItem";
            }


            if(optional && input == ""){
                return "validItem";
            }
            switch (type) {
                case "number":
                    reg = RegExp("^[0-9,.]+$");
                    break;
                case "phone":
                    reg = RegExp(/^[+-.() \d]+$/);
                    break;

                case "email":
                    reg = RegExp(/[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}/);
                    break;
                case "word":
                    reg = RegExp("^[a-zA-Z ]+$");
                    break;
                case "w":
                    reg = RegExp(/\w/);
                    break;
                case "agree":
                    return (input)? "validItem":"invalidItem";
                case "password":
                    return (input && input.length > 5)? "validItem":"invalidItem";
                case "cpassword":
                    return (input && input == confirmPswd)? "validItem":"invalidItem";
                default:
                    console.warn("something else");
                    return "invalidItem";
            }

            var temp = reg.test(input)? "validItem":"invalidItem";
            //console.log(temp);
            return temp;
        },

        validHttp: function(input){
            return this.httpRegex.test(input);
        }
    }
})