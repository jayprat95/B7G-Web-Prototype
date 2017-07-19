// VARIABLE DECLARATIONS  ---------------------------------------------

var osc, fft, dataset, table, monthPlaying, localHigh, localLow, localMagHigh, localMagLow;

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var loc = 0;
var data = [];

var highmap = 70;
var lowmap = 50;
var highMagmap = 80;
var lowMagmap = 60;

var durationLeng = 100;
var toneDuration = 1000;

var timerange = "oneyear";
var currentGraph = 1;

var buttonDown = false;

var textToSpeech = new p5.Speech();
textToSpeech.interrupt = true;
textToSpeech.onEnd = resetDetails;

var detailsPlaying = false;
var dragging = false;
var dataReceived = false;

var rate = 1.5;

var canvasHeight = 500;

var prevLoc = -1;
var newLoc = false;

var keyLength = 0;

var lastMonth = [];
var lastThreeMonths = [];
var lastSixMonths = [];
var lastOneYear = [];
var lastFiveYears = [];
var skips = [];
var newmonths = [];

// API STUFF ---------------------------------------------

//TODO: move API key out of repository 
var quandlQ = "https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?api_key=iz12PA5nC-YLyESare9X&qopts.columns=open,high,low,close,volume,date";
var ticker = "AAPL";
var tickerCompany = "Apple";
var fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
var toDate = new Date();
var addtl = "&ticker=" + ticker + "&date.gte=" + toJSONLocal(fromDate) + "&date.lte=" + toJSONLocal(toDate);

var query = quandlQ + addtl;

// TIMBRE SOUNDS ---------------------------------------------

var piano = new Wad({
    source: 'square',
    env: {
        attack: 0,
        decay: 0,
        sustain: .1,
        hold: 0,
        release: 0
    },
    filter: {
        type: 'lowpass',
        frequency: 600,
        q: 7,
        env: {
            attack: .07,
            frequency: 1600
        }
    }
})

var bass = new Wad({
    source: 'triangle',
    env: {
        attack: 0,
        decay: 0,
        sustain: .1,
        hold: 0,
        release: 0
    },
})


//DOM LISTENERS ---------------------------------------------

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

    $("#graphView").mousedown(function() {

        var on = "Turn On Study";
        var off = "Turn Off Study"

        if ($(this).attr("value") == on) {
            $(this).attr("aria-label", off);
            $(this).attr("value", off);
            currentGraph = 2;
            $("#currentGraph").text("Closing Values");
        } else if ($(this).attr("value") == off) {
            $(this).attr("aria-label", on);
            $(this).attr("value", on);
            currentGraph = 1;
            $("#currentGraph").text("Closing Values with Study");
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

//DAY OBJECT ---------------------------------------------

class Day {

    constructor(dateStr, open, high, low, close, volume, date, sma50, magnitude, overOrUnder, crossed, newmonth) {
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
        this.crossed = crossed;
        this.newmonth = newmonth;
    }
}

//GET DATA ---------------------------------------------

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
    skips = [];
    newmonths = [];
    lastFiveYears = [];
    var fromDate = new Date();
    fromDate.setFullYear(new Date().getFullYear() - 5);


    var unprocessedData = thedata['datatable']['data'];

    //find the right date 
    var index = 0;
    for (var i = 0; i < unprocessedData.length; i++) {
        var currDate = new Date(unprocessedData[i][5]);
        if (currDate > fromDate) {
            index = i;
            break;
        }
    }

    thedata['datatable']['data'].forEach(function(element, i) {
        var d = new Date(element[5]);
        d.setDate(d.getDate() + 1);

        //base case make it 0
        var sma50 = 0;
        if (i >= index) {
            if (i >= 50) {
                for (var j = (i - 50); j < i; j++) {
                    //fix this 
                    sma50 += thedata['datatable']['data'][j][3];
                }
                sma50 = sma50 / 50;
            }
        }

        var magnitude = Math.abs(sma50 - element[3]);
        magnitude = parseFloat((magnitude).toFixed(5));

        //if it intersects then it's 0
        var direction = 0;
        var prevdirection = 0;
        var crossing = false;
        var newmonth = false;

        if ((sma50 - element[3]) > 0) {
            direction = 1;
        } else if ((sma50 - element[3]) < 0) {
            direction = -1;
        }
        sma50 = parseFloat((sma50).toFixed(4));

        if (i > 0) {
            if ((sma50 - thedata['datatable']['data'][i - 1][3]) > 0) {
                prevdirection = 1;
            } else if ((sma50 - thedata['datatable']['data'][i - 1][3]) < 0) {
                prevdirection = -1;
            }

            var currentDate = new Date(thedata['datatable']['data'][i][5]);
            var previousDate = new Date(thedata['datatable']['data'][i - 1][5]);

            if ((currentDate.getMonth() != previousDate.getMonth())) {
                newmonth = true;
            } 

        }

        if (prevdirection != direction) {
            crossing = true;
        }


        if (sma50 != 0) {
            var newDate = "" + months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
            var today = new Day(newDate, element[0], element[1], element[2], element[3], element[4], d, sma50, magnitude, direction, crossing, newmonth);
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

    for (var i = 0; i < lastFiveYears.length - 1; i++) {

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

        if (item.crossed) {
            skips.push(item);
        }

        if (item.newmonth) {
            newmonths.push(item);
        }
    }

    data = setData();

    if (data != undefined && data[0] != undefined) {
        setTickerDetails();
    } else {
        setTimeout(function() { setTickerDetails(); }, 100);
    }

}

//P5 DEFAULT FUNCTIONS ---------------------------------------------

function preload() {
    table = loadTable("assets/tickers.csv", "csv", "header");
    getData();
    earcon = loadSound('assets/earcon.mp3');
}

function setup() {

    $('#submit').attr('disabled', true);
    $("#tickerName").text("Company: " + tickerCompany);
    $("#oneyear").addClass('buttonSelected');
    $("#currentGraph").text("Closing Values with Study");


    var canvas = createCanvas(windowWidth, canvasHeight);
    canvas.parent('canvas-container');

    osc = new p5.TriOsc();
    osc.start();
    osc.amp(0);

    textToSpeech.setRate(rate);
    playRate();
}

function draw() {

    console.log(currentGraph);
    background(255);

    if (currentGraph == 1) {
        drawVisGraphB();
    }

    if (currentGraph == 2) {
        drawVisGraphA();
    }

    if (buttonDown) {
        checkLeftRight();
        playValue();
        changeRate();
        checkBegEnd();
        skipToCrossing();
        skipToMonths();
    }

    if (data[loc]) {
        $("#curr-date").text("Date: " + data[loc]['dateStr']);
        $("#curr-price").text("Closing Price: " + data[loc]['close']);
        $("#curr-sma").text("SMA50: " + data[loc]['sma50']);
    }

    prevLoc = loc;
}

// CHECK INPUTS ---------------------------------------------

function keyPressed() {
    buttonDown = true;
}

function keyReleased() {

    buttonDown = false;
    //TODO check what this variable does 
    keyLength = 0;
}

function mousePressed() {
    playOnClick();
}

function mouseDragged() {
    playOnClick();
}

function isInside() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        return true;
    } else {
        return false;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, canvasHeight);
}

//PLAY SOMETHING ---------------------------------------------

function playNote(note, duration) {
    osc.freq(midiToFreq(note));
    osc.amp(1);
    osc.setType('triangle');
    osc.fade(1, 0.1);

    if (duration) {
        setTimeout(function() {
            osc.fade(0, 0.2);
        }, duration - 50);
    }
}

function playMag(note, abovebelow) {

    if (abovebelow == 1) {
        piano.play({ pitch: note });
    } else if (abovebelow == -1) {
        bass.play({ pitch: note });
    }
}

function playValue() {

    if (key == ' ') {

        //TODO check this logic for double spacebar 
        if (detailsPlaying == true) {

            stopSpeech();
            detailsPlaying = false;
            buttonDown = false;

        } else if (detailsPlaying == false) {

            detailsPlaying = true;
            buttonDown = false;
            textToSpeech.speak(data[loc].dateStr + " , Closing price: " + data[loc].close + " , SMA value: " + data[loc].sma50);
        }
    }
}

function playPoint(n) {
    if (currentGraph == 1) {
        playMag(n, data[loc].overOrUnder);
    } else if (currentGraph == 2) {
        playNote(map(data[loc].close, localLow, localHigh, lowmap, highmap), durationLeng);
    }
}

function playRate() {
    textToSpeech.setRate(rate);
}

function playOnClick() {
    if (isInside()) {
        loc = Math.floor(map(mouseX, 0, width, 0, data.length - 1));
        var note = midiToFreq(map(data[loc].magnitude, localMagLow, localMagHigh, lowMagmap, highMagmap));
        playPoint(note);
    }
}

function playMonth() {

    var currentDate = new Date(data[loc].date);

    if (data[loc].newmonth && newLoc != loc) {

        if (currentDate.getMonth() == 0) {
            textToSpeech.speak(currentDate.getFullYear() + " " + months[currentDate.getMonth()]);
        } else {
            textToSpeech.speak(months[currentDate.getMonth()]);
        }
    }
    
}

// CHANGE COMPANY ---------------------------------------------

function changeTicker() {
    ticker = $(".tickerfield").val().toUpperCase();
    var row = table.findRow(ticker, "Symbol");
    try {
        tickerCompany = row.getString("Description");

        $("#tickerName").text("Company: " + tickerCompany + ", ");
        $(".tickerfield").val("");
        dataReceived = false;

        getData();
        $("#submit").blur();
        $('#submit').attr('disabled', true);
    } catch (err) {
        textToSpeech.speak(ticker + "is not a valid ticker name");
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

// CHANGE VOICE SPEED ---------------------------------------------

function changeRate() {

    if (key == '=' && rate < 1.9) {
        rate += 0.2;

        playRate();

        buttonDown = false;
    }

    if (key == '-' && rate > 0.3) {
        rate -= 0.2;

        playRate();

        buttonDown = false;
    }
}

// DATE SETTERS  ---------------------------------------------

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


// RESET ---------------------------------------------

function resetDetails() {
    detailsPlaying = false;
    monthPlaying = false;
}

function stopSpeech() {
    textToSpeech.stop();
}

// NAVIGATION ---------------------------------------------

function checkLeftRight() {

    var note = midiToFreq(map(data[loc].magnitude, localMagLow, localMagHigh, lowMagmap, highMagmap));

    if (key == 'g' && loc > 0) {

        if (detailsPlaying) {
            stopSpeech();
        }

        if (keyLength == 0 || keyLength > 10) {
            loc--;

            if (loc < data.length - 1) {
                if (data[loc].crossed) {
                    earcon.setVolume(1);
                    earcon.play();
                }
            }

            playPoint(note);

        }

        keyLength++;
        playMonth();
        if (loc == 0) {
            textToSpeech.speak("Beginning");
        }


    } else if (key == 'h' && loc < data.length - 1) {


        if (detailsPlaying) {
            stopSpeech();
        }


        if (keyLength == 0 || keyLength > 10) {
            loc++;

            if (loc > 0) {
                if (data[loc].crossed) {
                    earcon.setVolume(1);
                    earcon.play();
                }
            }

            playPoint(note);
        }

        keyLength++;

        playMonth();
        if (loc == data.length - 1) {
            textToSpeech.speak("End");
        }

    }

}

function setToBeg(time) {

    if (loc > time.length) {
        loc = 0;
        textToSpeech.speak("Beginning");
    }

}

function checkBegEnd() {

    if (key == '.') {

        if (detailsPlaying) {
            stopSpeech();
        }

        loc = data.length - 1;
        playNote(map(data[loc].close, localLow, localHigh, lowmap, highmap), durationLeng);

        textToSpeech.speak("End" + " "  + data[loc].dateStr);
        
    } else if (key == ',') {

        if (detailsPlaying) {
            stopSpeech();
        }

        loc = 0;
        playNote(map(data[loc].close, localLow, localHigh, lowmap, highmap), durationLeng);

        textToSpeech.speak("Beginning" + " "  + data[loc].dateStr);
    }
}

function skipToCrossing() {

    if (key == '\'') {
        //forward

        if (detailsPlaying) {
            stopSpeech();
        }

        for(i = 0; i < skips.length; i++ ) {
            if(skips[i].date > data[loc].date) {
                if(skips[i].date <= data[data.length-1].date) {
                    for(j in data) {
                        if(data[j].date == skips[i].date) {
                            if(keyLength == 0 || keyLength > 10) {
                               loc = j;
                            }
                            keyLength++;
                            
                        }
                    }
                }
                break;
            }
        }
        earcon.play();

    } else if (key == ';') {
        //backward

        if (detailsPlaying) {
            stopSpeech();
        }

        for(i = skips.length - 1; i > -1; i-- ) {
            if(skips[i].date < data[loc].date) {
                if(skips[i].date >= data[0].date) {
                    for(j in data) {
                        if(data[j].date == skips[i].date) {
                            if(keyLength == 0 || keyLength > 10) {
                               loc = j;
                            }
                            keyLength++;
                        }
                    }
                }
                break;
            }
        }
        earcon.play();
    }
}

function skipToMonths() {

    if (key == ']') {
        //forward
        if (detailsPlaying) {
            stopSpeech();
        }

        for(i = 0; i < newmonths.length; i++ ) {
            if(newmonths[i].date > data[loc].date) {
                if(newmonths[i].date <= data[data.length-1].date) {
                    for(j in data) {
                        if(data[j].date == newmonths[i].date) {
                            if(keyLength == 0 || keyLength > 10) {
                               loc = j;
                            }
                            keyLength++; 
                        }
                    }
                }
                break;
            }
        }
        playMonth();

    } else if (key == '[') {
        //backward
        if (detailsPlaying) {
            stopSpeech();
        }

        for(i = newmonths.length - 1; i > -1; i-- ) {
            if(newmonths[i].date < data[loc].date) {
                if(newmonths[i].date >= data[0].date) {
                    for(j in data) {
                        if(data[j].date == newmonths[i].date) {
                            if(keyLength == 0 || keyLength > 10) {
                               loc = j;
                            }
                            keyLength++;
                        }
                    }
                }
                break;
            }
        }
        playMonth();
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

//DRAW GRAPHS ---------------------------------------------

function drawVisGraphA() {

    var padding = 100;

    var newLow = window.height - padding;
    var newHigh = 0 + padding;

    if (data != undefined && data[0] != undefined) {

        var lastY = map(data[0].close, localLow, localHigh, newLow, newHigh);

        for (var i in data) {

            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length - 1, 0, width);

                var lastxPos = map(i - 1, 0, data.length - 1, 0, width);

                stroke(0);
                strokeWeight(1);

                line(lastxPos, lastY, xPos, map(data[i].close, localLow, localHigh, newLow, newHigh));
            }

            lastY = map(data[i].close, localLow, localHigh, newLow, newHigh);
        }

        stroke(255, 0, 0);
        strokeWeight(1);
        var curMapped = map(loc, 0, data.length - 1, 0, width);
        line(curMapped, 0, curMapped, canvasHeight);
        fill(255, 0, 0);
        ellipse(curMapped, map(data[loc].close, localLow, localHigh, newLow, newHigh), 5, 5);
    }
}

function drawVisGraphB() {

    strokeWeight(1);

    var padding = 100;

    var newLow = window.height - padding;
    var newHigh = 0 + padding;

    if (data != undefined && data[0] != undefined) {

        var lastY = map(data[0].close, localLow, localHigh, newLow, newHigh);
        var lastS = map(data[0].sma50, localLow, localHigh, newLow, newHigh);

        for (var i in data) {

            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length - 1, 0, width);

                var lastxPos = map(i - 1, 0, data.length - 1, 0, width);

                if (data[i].overOrUnder == 1) {
                    strokeWeight(0.5);
                    fill(216, 25, 75);
                    stroke(216, 25, 75);
                    quad(lastxPos, lastS, lastxPos, lastY, xPos, map(data[i].close, localLow, localHigh, newLow, newHigh), xPos, map(data[i].sma50, localLow, localHigh, newLow, newHigh));

                } else if (data[i].overOrUnder == -1) {
                    strokeWeight(0.5);
                    fill(60, 173, 23);
                    stroke(60, 173, 23);
                    quad(lastxPos, lastS, lastxPos, lastY, xPos, map(data[i].close, localLow, localHigh, newLow, newHigh), xPos, map(data[i].sma50, localLow, localHigh, newLow, newHigh));
                }

                if (data[i].sma50 != 0 || data[i - 1].sma50 != 0) {
                    strokeWeight(1);
                    stroke(0, 67, 234);
                    line(lastxPos, lastS, xPos, map(data[i].sma50, localLow, localHigh, newLow, newHigh));
                }

                stroke(1);
                line(lastxPos, lastY, xPos, map(data[i].close, localLow, localHigh, newLow, newHigh));

            }

            lastY = map(data[i].close, localLow, localHigh, newLow, newHigh);
            lastS = map(data[i].sma50, localLow, localHigh, newLow, newHigh);

        }

        for (var i in data) {
            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length - 1, 0, width);

                var lastxPos = map(i - 1, 0, data.length - 1, 0, width);

                if (data[i].crossed) {
                    fill(247, 166, 20);
                    noStroke();
                    ellipse(xPos, map(data[i].sma50, localLow, localHigh, newLow, newHigh), 4, 4);
                }
            }
        }

        stroke(255, 0, 0);
        var curMapped = map(loc, 0, data.length - 1, 0, width);
        line(curMapped, 0, curMapped, canvasHeight);
        fill(255, 0, 0);
        strokeWeight(2);
        stroke(0);
        line(curMapped, map(data[loc].close, localLow, localHigh, newLow, newHigh), curMapped, map(data[loc].sma50, localLow, localHigh, newLow, newHigh));

    }

}