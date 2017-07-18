var osc, fft;

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var loc = 0;
var datasize = 0;

var dataset;
var close;

var highclose;
var lowclose;

var highmap = 70;
var lowmap = 50;

var sethigh = -1;
var setlow = Number.MAX_SAFE_INTEGER;

var durationLeng = 100;

var toneDuration = 1000;

var holdDownDelay = 0;

var index = 0;

var table;

var timerange = "oneyear";

var monthPlaying;

var stopTime = 0;

var osc;

var currentGraph = 1;

var buttonDown = false;

var textToSpeech = new p5.Speech();
textToSpeech.onEnd = resetDetails; 

var detailsPlaying = false;

var rate = 1.5;

var canvasHeight = 500;

var prevLoc = -1;

var newLoc = false;

var dragging = false;

var dataReceived = false;

var keyLength = 0;

var lastMonth = [];
var lastThreeMonths = [];
var lastSixMonths = [];
var lastOneYear = [];
var lastFiveYears = [];

var localHigh;
var localLow;
var localMagHigh;
var localMagLow;

var controlPress = false;
var plusPress = false;
var minusPress = false;

//TODO: move API key out of repository 
var quandlQ = "https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?api_key=iz12PA5nC-YLyESare9X&qopts.columns=open,high,low,close,volume,date";
var ticker = "AAPL";
var tickerCompany = "Apple";
var fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
var toDate = new Date();
var addtl = "&ticker=" + ticker + "&date.gte=" + toJSONLocal(fromDate) + "&date.lte=" + toJSONLocal(toDate);

var query = quandlQ + addtl;



var data = [];


//functions that are required to run pre-startup 
$(document).ready(function() {

    $("#onemonth").mousedown(function() {
        timerange = "onemonth";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
    });

    $("#threemonths").mousedown(function() {
        timerange = "threemonths";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
    });

    $("#sixmonths").mousedown(function() {
        timerange = "sixmonths";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
    });

    $("#oneyear").mousedown(function() {
        timerange = "oneyear";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
    });

    $("#fiveyears").mousedown(function() {
        timerange = "fiveyears";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
    });

    $('#input').keyup(function() {

        if ($(this).val().length != 0) {
            $('#submit').attr('disabled', false);
        } else {
            $('#submit').attr('disabled', true);
        }

    });

    $("#graphView").mousedown(function(){

        var on = "Turn On Study";
        var off = "Turn Off Study"

        if($( this ).attr( "value" ) ==  on){
            $(this).attr("aria-label",off);
            $(this).attr("value",off);
            currentGraph = 2;
        } else if($( this ).attr( "value" ) ==  off){
            $(this).attr("aria-label",on);
            $(this).attr("value",on);
            currentGraph = 1;
        }
      
    });
});

function deselectAll() {
    $("#onemonth").removeClass('buttonSelected');
    $("#threemonths").removeClass('buttonSelected');
    $("#sixmonths").removeClass('buttonSelected');
    $("#oneyear").removeClass('buttonSelected');
    $("#fiveyears").removeClass('buttonSelected');
}


//functions to get date string from application 
function toLocal(date) {
    var local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toJSON();
}

function toJSONLocal(date) {
    var local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
}

//day class to get ohlc 
class Day {


    constructor(dateStr, open, high, low, close, volume, date, sma50, magnitude, overOrUnder) {
        this.dateStr = dateStr;
        this.date = date;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.sma50 = sma50; 
        this.magnitude = magnitude; 
        this.overOrUnder = overOrUnder; 
    }
}

function setToBeg(time){

    if(loc > time.length) {
        loc = 0;
        textToSpeech.speak("Beginning");
    }
    
}

function setData() {


    var dataset;
    //TODO: add notification so users know that the location changed
    if (timerange == "onemonth") {
        dataset = lastMonth;
        setToBeg(lastMonth);
    } else if (timerange == "threemonths") {
        dataset = lastThreeMonths;
        setToBeg(lastThreeMonths);
    } else if (timerange == "sixmonths") {
        dataset = lastSixMonths;
        setToBeg(lastSixMonths);
    } else if (timerange == "oneyear") {
        dataset = lastOneYear;
        setToBeg(lastOneYear);
    } else if (timerange == "fiveyears") {
        dataset = lastFiveYears;
        setToBeg(lastFiveYears);
    }

    localHigh = getHighLow(dataset)[0];
    localLow = getHighLow(dataset)[1];
    localMagHigh = getHighLow(dataset)[2];
    localMagLow = getHighLow(dataset)[3];

    return dataset;
}


function getData() {
    var fromDate = new Date();
    fromDate.setFullYear(new Date().getFullYear() - 5);
    //get earlier dates for moving averages 
    fromDate.setDate(fromDate.getDate() - 200);
    var toDate = new Date();
    var addtl = "&ticker=" + ticker + "&date.gte=" + toJSONLocal(fromDate) + "&date.lte=" + toJSONLocal(toDate);
    var query = quandlQ + addtl;

    $.getJSON(query).done(function(d) {
        afterData(d);
    })
}

function afterData(thedata) {

    lastFiveYears = [];
    sethigh = -1;
    setlow = Number.MAX_SAFE_INTEGER;
    var fromDate = new Date();
    fromDate.setFullYear(new Date().getFullYear() - 5);


    var unprocessedData = thedata['datatable']['data']; 

    //find the right date 
    var index = 0; 
    for (var i = 0; i < unprocessedData.length; i++) {
        var currDate = new Date(unprocessedData[i][5]); 
        if(currDate > fromDate) {
            index = i; 
            break; 
        }
    }


    thedata['datatable']['data'].forEach(function(element) {

        if (element[1] > sethigh) {
            sethigh = element[1];
        }
        if (element[2] < setlow) {
            setlow = element[2];
        }
    }); 

    thedata['datatable']['data'].forEach(function(element, i) {
        var d = new Date(element[5]);
        d.setDate(d.getDate() + 1);

        //base case make it 0
        var sma50 = 0; 
        if(i >= index) {
            if(i >= 50) {
                for(var j = (i - 50); j < i; j++) {
                    //fix this 
                    sma50 += thedata['datatable']['data'][j][3]; 
                }
                sma50 = sma50/50; 
            }
        }
        
        var magnitude = Math.abs(sma50 - element[3]); 
        magnitude = parseFloat((magnitude).toFixed(5)); 

        //if it intersects then it's 0
        var direction = 0; 

        if((sma50 - element[3]) > 0) {
            direction = 1; 
        }
        else if((sma50 - element[3]) < 0) {
            direction = -1; 
        }
        sma50 = parseFloat((sma50).toFixed(4)); 

        

        if(sma50 != 0) {
            var newDate = "" + months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
            var today = new Day(newDate, element[0], element[1], element[2], element[3], element[4], d, sma50, magnitude, direction);
            lastFiveYears.push(today);            
        }
    });

    


    lastMonth = [];
    var lastMonthDate = new Date();
    lastMonthDate.setMonth(new Date().getMonth() - 1);

    lastThreeMonths = [];
    var lastThreeMonthsDate = new Date();
    lastThreeMonthsDate.setMonth(new Date().getMonth() - 3);

    lastSixMonths = [];
    var lastSixMonthsDate = new Date();
    lastSixMonthsDate.setMonth(new Date().getMonth() - 6);

    lastOneYear = [];
    var lastYearDate = new Date();
    lastYearDate.setFullYear(new Date().getFullYear() - 1);

    var i = lastFiveYears.length - 1;
    var end = i - 365;

    for (i; i >= end; i--) {

        var item = lastFiveYears[i];
        var thedate = new Date(item.date);


        if (thedate > lastMonthDate) {
            lastMonth.push(item);
        }
        if (thedate > lastThreeMonthsDate) {
            lastThreeMonths.push(item);
        }
        if (thedate > lastSixMonthsDate) {
            lastSixMonths.push(item);
        }
        if (thedate > lastYearDate) {
            lastOneYear.push(item);
        }
    }

    lastMonth.reverse();
    lastThreeMonths.reverse();
    lastSixMonths.reverse();
    lastOneYear.reverse();

    data = setData();

    if (data != undefined && data[0] != undefined) {
        setTickerDetails();
    } else {
        setTimeout(function() { setTickerDetails(); }, 100);
    }

    console.log(lastFiveYears); 
}

function updateRate() {
    textToSpeech.setRate(rate);
}

function preload() {
    table = loadTable("assets/tickers.csv", "csv", "header");
    getData();

}

function setup() {

    $('#submit').attr('disabled', true);
    $("#tickerName").text("Company: " + tickerCompany);
    $("#oneyear").addClass('buttonSelected');

    var graphName;

    if(currentGraph == 1 ) {
        graphName = "Closing price view";
    } else if (currentGraph == 2) {
        graphName = "Study view";
    }

    $("#currentGraph").text(graphName);

    createCanvas(windowWidth, canvasHeight);

    osc = new p5.TriOsc();
    osc.start();
    osc.amp(0);

    textToSpeech.setRate(rate);

    updateRate();

}


function playNote(note, duration) {
    osc.freq(midiToFreq(note));
    osc.amp(1);
    osc.fade(1, 0.1);

    if (duration) {
        setTimeout(function() {
            osc.fade(0, 0.2);
        }, duration - 50);
    }
}

function playMag(note, duration, abovebelow) {

    if(abovebelow == 1) {
        osc.amp(1);
        osc.setType('sawtooth');
    } else if(abovebelow == -1) {
        osc.amp(1);
        osc.setType('triangle');
    }
    
    console.log(note);

    osc.freq(midiToFreq(note));
    osc.fade(1, 0.1);

    if (duration) {
        setTimeout(function() {
            osc.fade(0, 0.2);
        }, duration - 50);
    }
}

function draw() {


    if(keyIsPressed === false) {
        stopTime = 1;
    } else {
        stopTime = 0;
    }


    background(255);

    if(currentGraph == 1) {
        drawVisGraphA();
        console.log("graph A");
    }

    if(currentGraph == 2) {
        drawVisGraphB();
        console.log("graph B");
    }
    

    if (buttonDown) {
        
        checkLeftRight();
        playValue();
        changeRate();
        checkBegEnd();
        checkMonth();
    }

    if (prevLoc != loc) {
        newLoc = true;
    } else {
        newLoc = false;
    }

    prevLoc = loc;

}

function isInside() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        return true;
    } else {
        return false;
    }
}

function mousePressed() {
    if (isInside()) {
        loc = Math.floor(map(mouseX, 0, width, 0, data.length - 1));

        playNote(map(data[loc].close, localLow, localHigh, lowmap, highmap), durationLeng);

    }
}

function mouseDragged() {
    if (isInside()) {
        loc = Math.floor(map(mouseX, 0, width, 0, data.length - 1));

        playNote(map(data[loc].close, localLow, localHigh, lowmap, highmap), durationLeng);

    }
}

function changeTicker() {
    ticker = $(".tickerfield").val().toUpperCase();
    var row = table.findRow(ticker, "Symbol");
    try {
        tickerCompany = row.getString("Description");

        $("#tickerName").text("Company: " + tickerCompany+", ");
        $(".tickerfield").val("");
        dataReceived = false;

        getData();
        $("#submit").blur();
        $('#submit').attr('disabled', true);
    } catch (err) {
        textToSpeech.speak(ticker + "is not a valid ticker name");
    }

}

function playValue() {

    if (key == ' ') {
 
        if (detailsPlaying == true) {
            stopSpeech();
            detailsPlaying = false;
            buttonDown = false;

        } else if (detailsPlaying == false) {   

            detailsPlaying = true;
            buttonDown = false;

            textToSpeech.speak(data[loc].date);

            var high = " High: " + data[loc].high;
            var open = " Open: " + data[loc].open;
            var close = " Close: " + data[loc].close;
            var low = " Low: " + data[loc].low;


            if (data[loc].open > data[loc].close) {

                textToSpeech.speak("Downward Trend, " + high + open + close + low);

            } else if (data[loc].close > data[loc].open) {

                textToSpeech.speak("Upward Trend, " + low + open + close + high);

            } else {

                textToSpeech.speak("Neutral Trend " + high + open + low);

            }


        }

    }

}

function resetDetails() {
    detailsPlaying = false;
    monthPlaying = false; 
    textToSpeech.stop(); 
}

function stopSpeech() {
    textToSpeech.stop();
}

function changeRate() {

    if (key == '=' && rate < 1.9) {
        rate += 0.2;

        updateRate();

        buttonDown = false;
    }

    if (key == '-' && rate > 0.3) {
        rate -= 0.2;

        updateRate();

        buttonDown = false;
    }
}

function setTickerDetails() {
    var rangeString;

    if (timerange == "onemonth") {
        rangeString = "One month prior to today";
    } else if (timerange == "threemonths") {
        rangeString = "Three months prior to today";
    } else if (timerange == "sixmonths") {
        rangeString = "Six months prior to today";
    } else if (timerange == "oneyear") {
        rangeString = "One year prior to today";
    } else if (timerange == "fiveyears") {
        rangeString = "Five years prior to today";
    }

    var pt = (data[data.length - 1].close - data[data.length - 1].open).toFixed(4);
    var pcnt = (pt / data[data.length - 1].open * 100).toFixed(4);

    //textToSpeech.speak("Changed to" + tickerCompany + ". Current price: " + data[data.length - 1].close + ". Percent Change. " + pcnt + " Point Change. " + pt + " Date Range " + rangeString + "");

    $("#current-price").text("Current Price: " + data[data.length - 1].close);
    $("#percent-change").text("Percent Change: " + pcnt);
    $("#point-change").text("Point Change: " + pt);
    $("#date-range").text("Date Range: " + rangeString);
}


function keyPressed() {

    buttonDown = true;

}

function keyReleased() {

    buttonDown = false;
    keyLength = 0;
}


function checkLeftRight() {

    if (key == 'g' && loc > 0) {

        if (detailsPlaying) {
            stopSpeech();
        }

        if(keyLength == 0 || keyLength > 10) {
            loc--;

            if(currentGraph == 1){
                playNote(map(data[loc].close, localLow, localHigh, lowmap, highmap), durationLeng);
            } else if (currentGraph == 2) {
                playMag(map(data[loc].magnitude, localMagLow, localMagHigh, lowmap, highmap), durationLeng, data[loc].overOrUnder);
            }
            
        }

        keyLength++;

        if (loc == 0) {
            textToSpeech.speak("Beginning");
        }

    } else if (key == 'h' && loc < data.length - 1) {

        if (detailsPlaying) {
            stopSpeech();
        }
        

        if(keyLength == 0 || keyLength > 10) {
            loc++;

            if(currentGraph == 1){
                playNote(map(data[loc].close, localLow, localHigh, lowmap, highmap), durationLeng);
            } else if (currentGraph == 2) {
                playMag(map(data[loc].magnitude, localMagLow, localMagHigh, lowmap, highmap), durationLeng, data[loc].overOrUnder);
            }
        }

        keyLength++;

        if (loc == data.length - 1) {
            textToSpeech.speak("End");
        }

    }

}

function checkMonth() {

    if (loc - 1 >= 0) {
        var currentDate = new Date(data[loc].date);
        var previousDate = new Date(data[loc - 1].date);

        if ((currentDate.getMonth() != previousDate.getMonth()) && !monthPlaying) {
            monthPlaying = true;
            if(currentDate.getMonth() == 0) {
                textToSpeech.speak(currentDate.getFullYear()+" "+months[currentDate.getMonth()]);
            } else {
                textToSpeech.speak(months[currentDate.getMonth()]);
            }    
        }
    }
}



function checkBegEnd() {

    if (key == '.') {

        if (detailsPlaying) {
            stopSpeech();
        }


        loc = data.length - 1;
        // textToSpeech.speak("End");

        if(stopTime == 0){
            playNote(map(data[loc].close, setlow, sethigh, lowmap, highmap), durationLeng);
        }
        


    } else if (key == ',') {

        if (detailsPlaying) {
            stopSpeech();
        }

        loc = 0;
        // textToSpeech.speak("Beginning");

        if(stopTime == 0){
            playNote(map(data[loc].close, setlow, sethigh, lowmap, highmap), durationLeng);
        }
    }
}

function getHighLow(myArray) {

    var highlow = [];

    var low = myArray[0].close;
    var high = myArray[0].close;

    var maglow = myArray[0].magnitude;
    var maghigh = myArray[0].magnitude;

    for (var i = 0; i < myArray.length; i++) {
        if (myArray[i].close > high) {
            high = myArray[i].close;
        } else if (myArray[i].close < low) {
            low = myArray[i].close;
        }

        if (myArray[i].magnitude > maghigh) {
            maghigh = myArray[i].magnitude;
        } else if (myArray[i].magnitude < maglow) {
            maglow = myArray[i].magnitude;
        }
    }
    highlow.push(high);
    highlow.push(low);
    highlow.push(maghigh);
    highlow.push(maglow);

    return highlow;

}


function drawVisGraphA() {


    var padding = 100;

    var newLow = window.height - padding;
    var newHigh = 0 + padding;


    if (data != undefined && data[0] != undefined) {

        var lastY = map(data[0].close, localLow,localHigh, newLow, newHigh);


        for (var i in data) {


            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length - 1, 0, width);

                var lastxPos = map(i - 1, 0, data.length - 1, 0, width);

                stroke(0);
                strokeWeight(1);

                line(lastxPos, lastY, xPos, map(data[i].close, localLow,localHigh, newLow, newHigh));
            }

            lastY = map(data[i].close, localLow,localHigh, newLow, newHigh);
        }

        stroke(255, 0, 0);
        strokeWeight(1);
        var curMapped = map(loc, 0, data.length - 1, 0, width);
        line(curMapped, 0, curMapped, canvasHeight);
        fill(255, 0, 0);
        ellipse(curMapped, map(data[loc].close, localLow,localHigh, newLow, newHigh), 5, 5);
    }

}

function drawVisGraphB() {


    strokeWeight(1);

    var padding = 100;

    var newLow = window.height - padding;
    var newHigh = 0 + padding;


    if (data != undefined && data[0] != undefined) {

        var lastY = map(data[0].close, localLow,localHigh, newLow, newHigh);
        var lastS = map(data[0].sma50, localLow,localHigh, newLow, newHigh);

        for (var i in data) {

            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length - 1, 0, width);

                var lastxPos = map(i - 1, 0, data.length - 1, 0, width);

                

                if(data[i].overOrUnder == 1) {
                    strokeWeight(0.5);
                    fill(216,25,75);
                    stroke(216,25,75);
                    quad(lastxPos, lastS, lastxPos, lastY, xPos, map(data[i].close, localLow,localHigh, newLow, newHigh), xPos, map(data[i].sma50, localLow,localHigh, newLow, newHigh));
                   
                } else if(data[i].overOrUnder == -1) {
                    strokeWeight(0.5);
                    fill(60,173,23);
                    stroke(60,173,23);
                    quad(lastxPos, lastS, lastxPos, lastY, xPos, map(data[i].close, localLow,localHigh, newLow, newHigh), xPos, map(data[i].sma50, localLow,localHigh, newLow, newHigh));
                }


                if(data[i].sma50 != 0 || data[i-1].sma50 != 0) {
                    strokeWeight(1);
                    stroke(0,67,234);
                    line(lastxPos, lastS, xPos, map(data[i].sma50, localLow,localHigh, newLow, newHigh));
                }

                stroke(1);
                line(lastxPos, lastY, xPos, map(data[i].close, localLow,localHigh, newLow, newHigh));
                
            }

            lastY = map(data[i].close, localLow,localHigh, newLow, newHigh);
            lastS = map(data[i].sma50, localLow,localHigh, newLow, newHigh);

        }

        stroke(255, 0, 0);
        var curMapped = map(loc, 0, data.length - 1, 0, width);
        line(curMapped, 0, curMapped, canvasHeight);
        fill(255, 0, 0);
        strokeWeight(2);
        stroke(0);
        line(curMapped, map(data[loc].close, localLow,localHigh, newLow, newHigh), curMapped, map(data[loc].sma50, localLow,localHigh, newLow, newHigh));

    }

}

function windowResized() {
    resizeCanvas(windowWidth, canvasHeight);
}