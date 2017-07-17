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

var buttonDown = false;

var textToSpeech = new p5.Speech();

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

    })
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

    constructor(dateStr, open, high, low, close, volume, date) {
        this.dateStr = dateStr;
        this.date = date;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
    }
}



function setData() {


    var dataset;
    //TODO: add notification so users know that the location changed
    if (timerange == "onemonth") {
        dataset = lastMonth;
        if (loc > lastMonth.length) {
            loc = 0;
        }
    } else if (timerange == "threemonths") {
        dataset = lastThreeMonths;
        if (loc > lastThreeMonths.length) {
            loc = 0;
        }
    } else if (timerange == "sixmonths") {
        dataset = lastSixMonths;
        if (loc > lastSixMonths.length) {
            loc = 0;
        }
    } else if (timerange == "oneyear") {
        dataset = lastOneYear;
        if (loc > lastOneYear.length) {
            loc = 0;
        }
    } else if (timerange == "fiveyears") {
        dataset = lastFiveYears;
        if (loc > lastFiveYears.length) {
            loc = 0;
        }
    }
    return dataset;
}


function getData() {
    var fromDate = new Date();
    fromDate.setFullYear(new Date().getFullYear() - 5);
    var toDate = new Date();
    var addtl = "&ticker=" + ticker + "&date.gte=" + toJSONLocal(fromDate) + "&date.lte=" + toJSONLocal(toDate);
    var query = quandlQ + addtl;

    $.getJSON(query).done(function(d) {
        afterData(d);
    })
}

function afterData(thedata) {

    lastFiveYears = [];

    thedata['datatable']['data'].forEach(function(element) {

        if (element[1] > sethigh) {
            sethigh = element[1];
        }
        if (element[2] < setlow) {
            setlow = element[2];
        }

        var d = new Date(element[5]);
        d.setDate(d.getDate() + 1);
        var newDate = "" + months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
        var today = new Day(newDate, element[0], element[1], element[2], element[3], element[4], d);
        lastFiveYears.push(today);
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

    data = setData();
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

    createCanvas(windowWidth, canvasHeight);

    osc = new p5.TriOsc();
    osc.start();
    osc.amp(0);

    textToSpeech.setRate(rate);
    textToSpeech.onEnd = resetDetails;

    updateRate();

}


function playNote(note, duration) {
    osc.freq(midiToFreq(note));
    //osc.amp(1);
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

    drawVis();

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
        playNote(map(data[loc].close, setlow, sethigh, lowmap, highmap), durationLeng);
    }
}

function mouseDragged() {
    if (isInside()) {
        loc = Math.floor(map(mouseX, 0, width, 0, data.length - 1));
        playNote(map(data[loc].close, setlow, sethigh, lowmap, highmap), durationLeng);
    }
}

function changeTicker() {
    ticker = $(".tickerfield").val().toUpperCase();
    var row = table.findRow(ticker, "Symbol");
    try {
        tickerCompany = row.getString("Description");

        $("#tickerName").text("Company: " + tickerCompany);
        $(".tickerfield").val("");
        dataReceived = false;

        getData();
        data = setData();

        if (data != undefined && data[0] != undefined) {
            playChangeSound();
        } else {
            setTimeout(function() { playChangeSound(); }, 100);
        }
        $("#submit").blur();
        $('#submit').attr('disabled', true);
    } catch (err) {
        textToSpeech.speak(ticker + "is not a valid ticker name");
    }

    if (data != undefined && data[0] != undefined) {
        playChangeSound();
    } else {
        setTimeout(function() { playChangeSound(); }, 100);
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
                textToSpeech.onEnd(function() { detailsPlaying = false; });

            }


        }

    }

}

function resetDetails() {

    detailsPlaying = false;

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

function playChangeSound() {
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

    var pt = data[data.length - 1].close - data[data.length - 1].open;
    var pcnt = pt / data[data.length - 1].open * 100;

    textToSpeech.speak("Changed to" + tickerCompany + ". Current price: " + data[data.length - 1].close + ". Percent Change. " + pcnt + " Point Change. " + pt + " Date Range " + rangeString + "");
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
            playNote(map(data[loc].close, setlow, sethigh, lowmap, highmap), durationLeng);
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
            playNote(map(data[loc].close, setlow, sethigh, lowmap, highmap), durationLeng);
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

        if (currentDate.getMonth() != previousDate.getMonth() && stopTime == 0) {
            monthPlaying = true;
            textToSpeech.speak(months[currentDate.getMonth()]);
            keyLength = 0;
        } 
    }

}


function checkBegEnd() {

    if (key == '.') {

        if (detailsPlaying) {
            stopSpeech();
        }


        loc = data.length - 1;

        if(stopTime == 0){
            playNote(map(data[loc].close, setlow, sethigh, lowmap, highmap), durationLeng);
        }
        


    } else if (key == ',') {

        if (detailsPlaying) {
            stopSpeech();
        }

        loc = 0;

        if(stopTime == 0){
            playNote(map(data[loc].close, setlow, sethigh, lowmap, highmap), durationLeng);
        }
    }
}


function drawVis() {


    var padding = 100;

    var newLow = window.height - padding;
    var newHigh = 0 + padding;


    if (data != undefined && data[0] != undefined) {

        var lastY = map(data[0].close, setlow, sethigh, newLow, newHigh);
        // var lastUB = dataset.getRow(0).arr[5] * multiplier + shift;
        // var lastLB = dataset.getRow(0).arr[6] * multiplier + shift;

        for (var i in data) {


            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length - 1, 0, width);

                var lastxPos = map(i - 1, 0, data.length - 1, 0, width);

                stroke(0);

                line(lastxPos, lastY, xPos, map(data[i].close, setlow, sethigh, newLow, newHigh));



                // stroke(216, 11, 207);
                // line(lastxPos, lastUB, xPos, dataset.getRow(i).arr[5] * multiplier + shift);

                // stroke(47, 229, 37);
                // line(lastxPos, lastLB, xPos, dataset.getRow(i).arr[6] * multiplier + shift);

            }

            lastY = map(data[i].close, setlow, sethigh, newLow, newHigh);
            // lastUB = dataset.getRow(i).arr[5] * multiplier + shift;
            // lastLB = dataset.getRow(i).arr[6] * multiplier + shift;

        }

        stroke(255, 0, 0);
        var curMapped = map(loc, 0, data.length - 1, 0, width);
        line(curMapped, 0, curMapped, canvasHeight);
        fill(255, 0, 0);
        ellipse(curMapped, map(data[loc].close, setlow, sethigh, newLow, newHigh), 5, 5);
    }

}

function windowResized() {
    resizeCanvas(windowWidth, canvasHeight);
}