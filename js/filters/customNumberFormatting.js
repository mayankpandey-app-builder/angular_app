app.filter("customNumber", function (numberFilter)
{
    function isNumeric(value)
    {
        return (!isNaN(parseFloat(value)) && isFinite(value));
    }

    return function (inputNumber, decimalDigits) {
        var decimalSeparator = ".",
            thousandsSeparator = ",";

        if(inputNumber) inputNumber = inputNumber.toString();

        if (isNumeric(inputNumber))
        {

            if(localStorage['numberFormattingUS'] === 'false'){
                decimalSeparator =  ",";
                thousandsSeparator = ".";
                decimalDigits = (typeof decimalDigits === "undefined" || !isNumeric(decimalDigits)) ? 2 : decimalDigits;
            }else{
                decimalSeparator =  ".";
                thousandsSeparator = ",";
                decimalDigits = (typeof decimalDigits === "undefined" || !isNumeric(decimalDigits)) ? 2 : decimalDigits;
            }

            if (decimalDigits < 0) decimalDigits = 0;

            var formattedNumber = numberFilter(inputNumber, decimalDigits);

            var numberParts = formattedNumber.split(".");


            numberParts[0] = numberParts[0].split(",").join(thousandsSeparator);

            var result =  numberParts[0];

            if (numberParts.length == 2)
            {
                result += decimalSeparator + numberParts[1];
            }

            return result;
        }
        else
        {
            return inputNumber;
        }
    };
});