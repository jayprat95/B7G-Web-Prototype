// VARIABLE DECLARATIONS  ---------------------------------------------

var osc, fft, dataset, table, monthPlaying, localHigh, localLow, localMagHigh, localMagLow, absLow, absHigh, localSMAHigh, localSMALow;

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var monthsAbbv = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

var loc = 0;
var data = [];

var highmap = 70;
var lowmap = 50;
var highMagmap = 80;
var lowMagmap = 60;

var xshift = 75;
var ystart = 10;
var yshift = 75;

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

var canvasHeight = 400;
var graphHeight = canvasHeight - yshift - ystart;
var rightpadding = 73;

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

var newLow = graphHeight;
var newHigh = ystart;
var mappedLow;
var mappedHigh;

var fontsize = 11;

// COLORS ---------------------------------------------

var darkblue;
var white;
var borderblue;
var lightblue;
var gradhigh;
var gradlow;
var transWhite;
var aboveColor;
var belowColor;
var dotColor;

// API STUFF ---------------------------------------------

//TODO: move API key out of repository 
var quandlQ = "https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?api_key=" + config.API_KEY + "&qopts.columns=open,high,low,close,volume,date";
var ticker = "AAPL";
var tickerCompany = "Apple";
var fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
var toDate = new Date();
var addtl = "&ticker=" + ticker + "&date.gte=" + toJSONLocal(fromDate) + "&date.lte=" + toJSONLocal(toDate);

var query = quandlQ + addtl;

// TIMBRE SOUNDS ---------------------------------------------

var piano = new Wad({
    source: 'sine',
    env: { attack: 0.05, decay: 0.005, sustain: 1, hold: .01, release: 0.005 },
    filter: { type: 'lowpass', frequency: 600, q: 7, env: { attack: .07,frequency: 1600 }
    }
});

var bass = new Wad({
    source: 'triangle',
    env: { attack: 0.05, decay: 0.02, sustain: 1, hold: .01, release: 0.02 },
});




var pianoLong = new Wad({
    source: 'square',
    env: { attack: 0.05, decay: 0.0, sustain: 1, hold: 4, release: 0.0 },
    filter: { type: 'lowpass', frequency: 600, q: 7, env: { attack: .07,frequency: 1600 }
    }
});

var bassLong = new Wad({
    source: 'triangle',
    env: { attack: 0.05, decay: 0.0, sustain: 1, hold: 4, release: 0.0},
});


//DOM LISTENERS ---------------------------------------------

$(document).ready(function() {

    showModal($('#modal'));

    $('#input').keydown(function(e) {
    if (e.keyCode == 13) {
        changeTicker(); 
    }
});


    $("#onemonth").mousedown(function() {
        timerange = "onemonth";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
        $("#onemonth").attr('aria-label', 'Change to One Month, Selected');
    });

    $("#threemonths").mousedown(function() {
        timerange = "threemonths";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
        $("#threemonths").attr('aria-label', 'Change to Three Months, Selected');
    });

    $("#sixmonths").mousedown(function() {
        timerange = "sixmonths";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
        $("#sixmonths").attr('aria-label', 'Change to Six Months, Selected');
    });

    $("#oneyear").mousedown(function() {
        timerange = "oneyear";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
        $("#oneyear").attr('aria-label', 'Change to One Year, Selected');
    });

    $("#fiveyears").mousedown(function() {
        timerange = "fiveyears";
        data = setData();
        deselectAll();
        $(this).addClass('buttonSelected');
        $("#fiveyears").attr('aria-label', 'Change to Five Years, Selected');
    });

    $('#input').keyup(function() {

        if ($(this).val().length != 0) {
            $('#submit').attr('disabled', false);
        } else {
            $('#submit').attr('disabled', true);
        }

    });

    $("#graphView").mousedown(function() {

        //TODO change variables 
        var on = "Turn Off Indicator";
        var off = "Turn On Indicator"

        if ($(this).attr("value") == on) {
            $(this).attr("aria-label", off);
            $(this).attr("value", off);
            currentGraph = 2;
            $("#tickerName").text("Company: " + tickerCompany + ", (Closing Values)");
            $('#checkbox').attr('checked', false);
        } else if ($(this).attr("value") == off) {
            $(this).attr("aria-label", on);
            $(this).attr("value", on);
            currentGraph = 1;
            $("#tickerName").text("Company: " + tickerCompany + ", (Closing Values with 50 Day Simple Moving Average)");
            $('#checkbox').attr('checked', true);
        }

    });

    $(".switch").mousedown(function() {
        console.log("clicked");

        //TODO change variables 
        var on = "Turn Off Indicator";
        var off = "Turn On Indicator"

        if ($("#graphView").attr("value") == on) {
            $("#graphView").attr("aria-label", off);
            $("#graphView").attr("value", off);
            currentGraph = 2;
            $("#tickerName").text("Company: " + tickerCompany + ", (Closing Values)");
        } else if ($("#graphView").attr("value") == off) {
            $("#graphView").attr("aria-label", on);
            $("#graphView").attr("value", on);
            currentGraph = 1;
            $("#tickerName").text("Company: " + tickerCompany + ", (Closing Values with Indicator)");
        }

    });
});

function deselectAll() {
    $("#onemonth").removeClass('buttonSelected');
    $("#threemonths").removeClass('buttonSelected');
    $("#sixmonths").removeClass('buttonSelected');
    $("#oneyear").removeClass('buttonSelected');
    $("#fiveyears").removeClass('buttonSelected');

    $("#onemonth").attr('aria-label', 'Change to One Month');
    $("#threemonths").attr('aria-label', 'Change to Three Months');
    $("#sixmonths").attr('aria-label', 'Change to Six Months');
    $("#oneyear").attr('aria-label', 'Change to One Year');
    $("#fiveyears").attr('aria-label', 'Change to Five Years');

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

    var highslows = getHighLow(dataset);
    localHigh = highslows[0];
    localLow = highslows[1];
    localMagHigh = highslows[2];
    localMagLow = highslows[3];
    localSMAHigh = highslows[4];
    localSMALow = highslows[5];

    if( localHigh > localSMAHigh) {
        absHigh = localHigh;
    } else {
        absHigh = localSMAHigh;
    }

    if( localLow < localSMALow) {
        absLow = localLow;
    } else {
        absLow = localSMALow;
    }

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
            currentDate.setDate(currentDate.getDate() + 1);
            var previousDate = new Date(thedata['datatable']['data'][i - 1][5]);
            previousDate.setDate(previousDate.getDate() + 1);


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


    //
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

    darkblue = color(40, 59, 74);
    white = color(255);
    borderblue = color(93,116,132);
    lightblue = color(67,146,241);
    gradhigh = color(73,99,117);
    gradlow = color(26,41,51);
    transWhite = color(255,0.5);
    lineColor = color(12,26,35);
    aboveColor = color(214, 227, 119);
    belowColor = color(229,75,75);
    dotColor = color(21, 102, 177);

    $('#submit').attr('disabled', true);
    $("#tickerName").text("Company: " + tickerCompany + ", (Closing Values with 50 Day Simple Moving Average)");
    $("#oneyear").addClass('buttonSelected');

    var canvas = createCanvas(windowWidth - rightpadding, canvasHeight);
    canvas.parent('canvas-container');
    $('#canvas-container').height(canvasHeight);

    osc = new p5.TriOsc();
    osc.start();
    osc.amp(0);

    textToSpeech.setRate(rate);
    playRate();
}

function draw() {

    background(darkblue);

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
    keyLength = 0;
}

function mousePressed() {
    playOnClick();
    setTickerDetails();
}

function mouseDragged() {
    playOnClick();
}

function isInside() {
    if (mouseX > xshift && mouseX < width && mouseY > 0 && mouseY < height) {
        return true;
    } else {
        return false;
    }
}

function windowResized() {
    resizeCanvas(windowWidth - rightpadding, canvasHeight);
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

function playMag(note, abovebelow, long) {

    if(long) {
        if (abovebelow == 1) {
            piano.play({ pitch: note });
        } else if (abovebelow == -1) {
            bass.play({ pitch: note });
        }
    } else {
        if (abovebelow == 1) {
            piano.play({ pitch: note });
        } else if (abovebelow == -1) {
            bass.play({ pitch: note });
        }
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

            //play value 
            var note = midiToFreq(map(data[loc].magnitude, localMagLow, localMagHigh, lowMagmap, highMagmap));
            playPoint(note, true); 
            //calculate items at this time 
            var percentChange = ((data[loc].close - data[loc].sma50)/data[loc].sma50); 
            percentChange *= 100; 
            percentChange = parseFloat((percentChange).toFixed(4));

            textToSpeech.speak(data[loc].dateStr + " , percent change: " + percentChange + " , Closing price: " + data[loc].close + " , Fifty Day Simple Moving Average: " + data[loc].sma50);
        }
    }
}

function playPoint(n, l) {
    if (currentGraph == 1) {
        playMag(n, data[loc].overOrUnder, l);
    } else if (currentGraph == 2) {
        playNote(map(data[loc].close, localLow, localHigh, lowmap, highmap), durationLeng);
    }
}

function playRate() {
    textToSpeech.setRate(rate);
}

function playOnClick() {
    if (isInside()) {
        if(detailsPlaying) {
            stopSpeech(); 
            detailsPlaying = false; 
        }
        loc = Math.floor(map(mouseX, xshift, width, 0, data.length - 1));
        var note = midiToFreq(map(data[loc].magnitude, localMagLow, localMagHigh, lowMagmap, highMagmap));
        playPoint(note, false);
    }
}

function playMonth() {

    var currentDate = new Date(data[loc].date);

    if (data[loc].newmonth && prevLoc != newLoc) {
        monthPlaying = true;
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

        if(currentGraph == 2) {
            $("#tickerName").text("Company: " + tickerCompany + ", (Closing Values)");
        } else {
            $("#tickerName").text("Company: " + tickerCompany + ", (Closing Values with 50 Day Simple Moving Average)");
        }

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
        rangeString = "Last Month";
    } else if (timerange == "threemonths") {
        rangeString = "Last Three Months";
    } else if (timerange == "sixmonths") {
        rangeString = "Last Six Months";
    } else if (timerange == "oneyear") {
        rangeString = "Last Year";
    } else if (timerange == "fiveyears") {
        rangeString = "Last Five Years";
    }

    var pt = (data[data.length - 1].close - data[data.length - 1].open).toFixed(4);
    var pcnt = (pt / data[data.length - 1].open * 100).toFixed(4);

    var minusSign = "\u2212";

    if (pt < 0) {
        pt = minusSign + (pt * -1);
    }

    if (pcnt < 0) {
        pcnt = minusSign + (pcnt * -1);
    }

    $("#current-price").text("Most Recent Price: " + data[data.length - 1].close);
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
    // detailsPlaying = false;
    monthPlaying = false;
}

function stopSpeech() {
    textToSpeech.stop();
}

// NAVIGATION ---------------------------------------------

function checkLeftRight() {

    var note = midiToFreq(map(data[loc].magnitude, localMagLow, localMagHigh, lowMagmap, highMagmap));

    if(loc == 0 && (key == 'g' || key == 'G')) {
        textToSpeech.speak("Beginning");
    }
    else if((key == 'h' || key == 'H') && loc == data.length - 1) {
        textToSpeech.speak("End");
    }



    if ((key == 'g' || key == 'G') && loc > 0 && $("#input").is(":focus") == false ) {

        if (detailsPlaying) {
            stopSpeech();
            detailsPlaying = false; 
        }

        if (keyLength == 0 || keyLength > 10) {
            loc--;
            note = midiToFreq(map(data[loc].magnitude, localMagLow, localMagHigh, lowMagmap, highMagmap));

            if (loc < data.length - 1) {
                if (data[loc].crossed) {
                    if(currentGraph == 1) {
                        earcon.setVolume(1);
                        earcon.play();                        
                    }
                }
            }

            playPoint(note, false);

        }

        keyLength++;
        playMonth();
        if (loc == 0) {
            textToSpeech.speak("Beginning");
        }


    } else if ((key == 'h' || key == 'H') && loc < data.length - 1 && $("#input").is(":focus") == false) {


        if (detailsPlaying) {
            stopSpeech();
            detailsPlaying = false; 
        }


        if (keyLength == 0 || keyLength > 10) {
            loc++;
            note = midiToFreq(map(data[loc].magnitude, localMagLow, localMagHigh, lowMagmap, highMagmap));

            if (loc > 0) {
                if (data[loc].crossed) {
                    if(currentGraph == 1) {
                        earcon.setVolume(1);
                        earcon.play();                        
                    }
                }
            }

            playPoint(note, false);
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

    if (key == 'p') {
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

    } else if (key == 'o') {
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

    var smalow = myArray[0].sma50;
    var smahigh = myArray[0].sma50;

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

        if (myArray[i].sma50 > smahigh) {
            smahigh = myArray[i].sma50;
        } else if (myArray[i].sma50 < smalow) {
            smalow = myArray[i].sma50;
        }
    }
    highlow.push(high);
    highlow.push(low);
    highlow.push(maghigh);
    highlow.push(maglow);
    highlow.push(smahigh);
    highlow.push(smalow);

    return highlow;

}

//DRAW GRAPHS ---------------------------------------------


function drawAxis() {

    var xaxispos = xshift - 2;
    var yaxispos = canvasHeight - yshift + 2;

    mappedLow = map(localLow, absLow, absHigh, newLow, newHigh);
    mappedHigh = map(localHigh, absLow, absHigh, newLow, newHigh);

    strokeWeight(2);
    stroke(darkblue);
    line(xaxispos, 0, width, 0);
    line(width, yaxispos, width, 0);

    stroke(borderblue);
    line(xaxispos, yaxispos, xaxispos, 0);
    line(xaxispos, yaxispos, width, yaxispos);

    drawYAxis(yaxispos);

    for (var i in data) {
        if (i != 0 && i != data.length) {
            var xAxis = map(i, 0, data.length - 1, 0, width - xshift) + xshift;
            drawXAxis(i, xAxis);
        }
    }
}

function drawYAxis(yaxis) {
    var range = (absHigh-absLow)/100;
    var units = 1;

    if(range >= 0 && range <= 0.1){
        units = 2;
    } else if(range > 0.1 && range <= 0.5){
        units = 5;
    } else if(range > 0.5 && range <= 1){
        units = 10;
    } else if(range > 1 && range <= 2.5){
        units = 25;
    } else if(range > 2.5 && range <= 5){
        units = 50;
    } else if(range > 5 && range <= 10){
        units = 100;
    } else if(range > 10 && range <= 50){
        units = 250;
    } else if(range > 50 && range <= 100){
        units = 500;
    } else {
        units = 1000;
    }

    var initialTick = getInitalTick(absLow, units);

    for( i = initialTick; i < absHigh; i += units) {
        //console.log(absHigh);
        strokeWeight(1);
        stroke(255);
        var yPos = map(i, absLow, absHigh, newLow, newHigh);
        line(xshift-6, yPos, xshift+1, yPos);
        textAlign(RIGHT);
        fill(255);
        textFont("Rubik");
        textSize(fontsize);
        text(i, xshift - 15, yPos + 4);
    }
}

function getInitalTick(num, units) {

    var newnum = Math.ceil( num );

    while ( newnum % units != 0) {
        newnum++;
    } 

    return newnum;
}

function drawXAxis(i, xPos){
    //factor in page width and data range

    if(timerange == "onemonth") {
        strokeWeight(0.5);
        stroke(255, 50);
        dottedLine(xPos, newHigh, newLow, 2.5, 6);

        strokeWeight(1);
        stroke(255);
        line(xPos, graphHeight+8, xPos, graphHeight+15);

    }

    if(data[i].newmonth) {
        strokeWeight(0.5);
        stroke(255, 50);
        dottedLine(xPos, newHigh, newLow, 2.5, 6);

        strokeWeight(1);
        stroke(255);
        line(xPos, graphHeight+8, xPos, graphHeight+15);

        textAlign(CENTER);
        fill(255);
        textFont("Rubik");
        textSize(fontsize);
        if(timerange == "fiveyears") {
            if(data[i].date.getMonth() == 0 || data[i].date.getMonth() == 6) {
                text(monthsAbbv[data[i].date.getMonth()], xPos, graphHeight+40);
            }
            if(data[i].date.getMonth() == 0) {
                text(data[i].date.getFullYear(), xPos, graphHeight+60);
            }
        } else if(timerange == "oneyear") {
            if(data[i].date.getMonth() == 0 || data[i].date.getMonth() == 2 || data[i].date.getMonth() == 4 || data[i].date.getMonth() == 6 || data[i].date.getMonth() == 8 || data[i].date.getMonth() == 10) {
                text(monthsAbbv[data[i].date.getMonth()], xPos, graphHeight+40);
            }
            if(data[i].date.getMonth() == 0) {
                text(data[i].date.getFullYear(), xPos, graphHeight+60);
            }
        } else {
            text(monthsAbbv[data[i].date.getMonth()], xPos, graphHeight+40);
            if(data[i].date.getMonth() == 0) {
                text(data[i].date.getFullYear(), xPos, graphHeight+60);
            }
        }
    }
}

function drawVisGraphA() {

    setGradient(xshift, ystart, width, graphHeight, gradhigh, gradlow, "Y_AXIS");

    if (data != undefined && data[0] != undefined) {

        var lastY = map(data[0].close, absLow, absHigh, newLow, newHigh);
        
        beginShape();
        vertex(xshift- 2, 0);
        vertex(xshift- 2, lastY);

        for (var i in data) {

            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length - 1, 0, width - xshift) + xshift;

                var lastxPos = map(i - 1, 0, data.length - 1, 0, width - xshift) + xshift;

                stroke(0);
                strokeWeight(1);

                line(lastxPos, lastY, xPos, map(data[i].close, absLow, absHigh, newLow, newHigh));
                vertex(xPos, map(data[i].close, absLow, absHigh, newLow, newHigh));
            }

            lastY = map(data[i].close, absLow, absHigh, newLow, newHigh);
        }

        noStroke();
        vertex(width, 0);
        fill(darkblue);
        stroke(white);
        strokeWeight(1);
        endShape(CLOSE);

        drawAxis();

        stroke(lineColor);
        strokeWeight(2);
        var curMapped = map(loc, 0, data.length - 1, xshift, width);
        line(curMapped, 0, curMapped, canvasHeight - yshift);
        fill(white);
        stroke(0);
        strokeWeight(2.5);
        ellipse(curMapped, map(data[loc].close, absLow, absHigh, newLow, newHigh), 8, 8);

        drawTriangle(curMapped);
    }

}

function drawVisGraphB() {

    // strokeWeight(1);   

    // stroke(0,255,0);
    // line(0, newLow, width, newLow);
    // line(0, newHigh, width, newHigh);

    // stroke(0,255,255);
    // line(0, mappedLow, width, mappedLow);
    // line(0, mappedHigh, width, mappedHigh);

    setGradient(xshift, ystart, width, graphHeight, gradhigh, gradlow, "Y_AXIS");

    if (data != undefined && data[0] != undefined) {

        var lastY = map(data[0].close, absLow, absHigh, newLow, newHigh);
        var lastS = map(data[0].sma50, absLow, absHigh, newLow, newHigh);

        beginShape();
        vertex(xshift - 2, 0);
        vertex(xshift - 2, lastY);

        for (var i in data) {

            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length - 1, 0, width - xshift) + xshift;

                var lastxPos = map(i - 1, 0, data.length - 1, 0, width - xshift) + xshift;

                if (data[i].overOrUnder == 1) {
                    strokeWeight(0.5);
                    stroke(216, 25, 75);

                } else if (data[i].overOrUnder == -1) {
                    strokeWeight(0.5);
                    stroke(60, 173, 23);
                }

                stroke(lightblue);
                line(lastxPos, lastY, xPos, map(data[i].close, absLow, absHigh, newLow, newHigh));
                vertex(xPos, map(data[i].close, absLow, absHigh, newLow, newHigh));

            }

            lastY = map(data[i].close, absLow, absHigh, newLow, newHigh);
            lastS = map(data[i].sma50, absLow, absHigh, newLow, newHigh);

        }

        noStroke();
        vertex(width, 0);
        fill(darkblue);
        stroke(white);
        strokeWeight(1);
        endShape(CLOSE);

        lastY = map(data[0].close, absLow, absHigh, newLow, newHigh);
        lastS = map(data[0].sma50, absLow, absHigh, newLow, newHigh);

        for (var i in data) {
            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length - 1, 0, width - xshift) + xshift;
                var lastxPos = map(i - 1, 0, data.length - 1, 0, width - xshift) + xshift;

                if (data[i].sma50 != 0 || data[i - 1].sma50 != 0) {
                    strokeWeight(2);
                    stroke(lightblue);
                    line(lastxPos, lastS, xPos, map(data[i].sma50, absLow, absHigh, newLow, newHigh));
                }

            }

            lastY = map(data[i].close, absLow, absHigh, newLow, newHigh);
            lastS = map(data[i].sma50, absLow, absHigh, newLow, newHigh);
        }

        drawAxis();

        stroke(lineColor);
        strokeWeight(2);
        var curMapped = map(loc, 0, data.length - 1, 0, width - xshift) + xshift;
        line(curMapped, 0, curMapped, canvasHeight - yshift);
        if(data[loc].overOrUnder == -1) {
            stroke(aboveColor);
        } else {
            stroke(belowColor);
        }
        
        line(curMapped, map(data[loc].close, absLow, absHigh, newLow, newHigh), curMapped, map(data[loc].sma50, absLow, absHigh, newLow, newHigh));

        drawTriangle(curMapped);
    }

}

function setGradient(x, y, w, h, c1, c2, axis) {

  noFill();

  if (axis == "Y_AXIS") {  // Top to bottom gradient
    for (var i = y; i <= y+h; i++) {
      var inter = map(i, y, y+h, 0, 1);
      var c = lerpColor(c1, c2, inter);
      stroke(c);
      line(x, i, x+w, i);
    }
  }  
  else if (axis == "X_AXIS") {  // Left to right gradient
    for (var i = x; i <= x+w; i++) {
      var inter = map(i, x, x+w, 0, 1);
      var c = lerpColor(c1, c2, inter);
      stroke(c);
      line(i, y, i, y+h);
    }
  }
}

function dottedLine(x, ylownum, yhighnum, segLeng, spaceLeng) {
    for(i = ylownum; i+segLeng < yhighnum; i+=segLeng+spaceLeng) {
        line(x, i, x, i+segLeng);
    }
}

function drawTriangle(loc) {
    fill(borderblue);
    noStroke();
    triangle(loc-10, canvasHeight, loc, canvasHeight-12, loc+10,canvasHeight);

    fill(darkblue);
    rect(xshift-10, canvasHeight-15, 10, 20);
    rect(width-2, canvasHeight-15, 10, 20);
}