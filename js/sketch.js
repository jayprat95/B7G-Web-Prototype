var osc, fft;

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November","December"];

var loc = 0;
var datasize = 0;

var dataset;
var close;

var highclose;
var lowclose;

var highmap = 70;
var lowmap = 50;

var durationLeng = 100;

var toneDuration = 1000;

var holdDownDelay = 0;

var index = 0;

var timerange = "oneyear";

var osc;

var buttonDown = false;

var textToSpeech = new p5.Speech();

var detailsPlaying = false;

var rate = 1.5;

var canvasHeight = 500;

var controlPress = false;
var plusPress = false;
var minusPress = false;
var quandlQ = "https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?api_key=iz12PA5nC-YLyESare9X&qopts.columns=open,high,low,close,volume,date";
var ticker = "AAPL";
var fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
var toDate = new Date();
var addtl = "&ticker=" + ticker + "&date.gte=" + toJSONLocal(fromDate) + "&date.lte=" + toJSONLocal(toDate);

var query = quandlQ + addtl;
// var query = "https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?api_key=iz12PA5nC-YLyESare9X&qopts.columns=open,high,low,close,volume&ticker=AAPL&date.gte=2016-07-10&date.lte=2017-01-13"; 


var data = [];

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

class Day {

    constructor(date, open, high, low, close, volume, sethigh, setlow) {
        this.date = date;
        this.open = open;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.sethigh = sethigh;
        this.setlow = setlow;
    }
}

function getData() {

    var dataset; 

    if(timerange == "onemonth"){
        dataset = getMonths(1);
    } else if(timerange == "threemonths"){
        dataset = getMonths(3);
    } else if(timerange == "sixmonths"){
        dataset = getMonths(6);
    } else if(timerange == "oneyear"){
        dataset = getYears(1);
    } else if(timerange == "fiveyears"){
        dataset = getYears(5);
    }

    return dataset;
}

//TO DO

function getMonths(numMonths) {
    var newdata = [];
    // var fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - numMonths));
    // var toDate = new Date();
    // var addtl = "&ticker=" + ticker + "&date.gte=" + toJSONLocal(fromDate) + "&date.lte=" + toJSONLocal(toDate);
    // var query = quandlQ + addtl;

    // $.getJSON(query, function(json) {
    //     var sethigh = -1;
    //     var setlow = Number.MAX_SAFE_INTEGER;

    //     json['datatable']['data'].forEach(function(element) {
    //         if (element[1] > sethigh) {
    //             sethigh = element[1];
    //         }

    //         if (element[2] < setlow) {
    //             setlow = element[2];
    //         }
    //     });

    //     json['datatable']['data'].forEach(function(element) {

    //         var d = new Date(element[5]);

    //         var newDate = ""+months[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();

    //         var today = new Day(newDate, element[0], element[1], element[2], element[3], element[4], sethigh, setlow);
    //         newdata.push(today);

    //     });
    // });
    return newdata;
}


function getYears(numYears) {
    var newdata = [];
    var fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - numYears));
    var toDate = new Date();
    var addtl = "&ticker=" + ticker + "&date.gte=" + toJSONLocal(fromDate) + "&date.lte=" + toJSONLocal(toDate);
    var query = quandlQ + addtl;

    $.getJSON(query, function(json) {
        var sethigh = -1;
        var setlow = Number.MAX_SAFE_INTEGER;

        json['datatable']['data'].forEach(function(element) {
            if (element[1] > sethigh) {
                sethigh = element[1];
            }

            if (element[2] < setlow) {
                setlow = element[2];
            }
        });

        json['datatable']['data'].forEach(function(element) {

            var d = new Date(element[5]);

            var newDate = ""+months[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();

            var today = new Day(newDate, element[0], element[1], element[2], element[3], element[4], sethigh, setlow);
            newdata.push(today);

        });
    });
    return newdata;
}



function setup() {


    $("#tickerName").text(ticker);

    //old code kept just in case 
    // $.getJSON('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=MSFT&outputsize=full&apikey=CXSGLM08JIC4DD17', function(jd) {
    //     Object.keys(jd['Time Series (Daily)']).forEach(function(elem) {
    //         var d1 = new Date(elem);
    //         d1.setTime(d1.getTime() + d1.getTimezoneOffset() * 60 * 1000);
    //         elem = d1;
    //     });

    //     console.log(jd['Time Series (Daily)']);
    // });

    data = getData();

    console.log(data);

    createCanvas(windowWidth, canvasHeight);

    osc = new p5.TriOsc();
    osc.start();
    osc.amp(0);

    textToSpeech.setRate(rate);
    textToSpeech.onEnd = resetDetails;

}


function playNote(note, duration) {
    osc.freq(midiToFreq(note));
    osc.fade(0.5, 0.2);

    if (duration) {
        setTimeout(function() {
            osc.fade(0, 0.2);
        }, duration - 50);
    }
}

function draw() {

    background(255);

    drawVis();

    if (buttonDown) {
        checkLeftRight();
        playValue();
        changeRate();
        checkBegEnd();
    }

    //TO DO

    // $(".tickerfield").on('keyup', function (e) {
    //     if (e.keyCode == 13) {
    //         console.log($(".tickerfield").val());
    //         ticker = $(".tickerfield").val();
    //         $("#tickerName").text(ticker);
    //         $(".tickerfield").val("");
    //     }
    // });

}

function changeTicker() {
    console.log($(".tickerfield").val());
    ticker = $(".tickerfield").val().toUpperCase();
    $("#tickerName").text(ticker);
    $(".tickerfield").val("");
    data = getData();
}

function playValue() {

    if (key == ' ') {

        if (detailsPlaying == true) {
            stopSpeech();
            detailsPlaying = false;
            console.log("true");
            buttonDown = false;

        } else if (detailsPlaying == false) {

            textToSpeech.speak(data[loc].date);

            //TO DO
            //WHY ISNT THIS WORKING???

            if(data[loc].open > data[loc].close){
                textToSpeech.speak("Downward Trend"); 
                textToSpeech.speak("High: " + data[loc].high); 
                textToSpeech.speak("Open: " + data[loc].open); 
                textToSpeech.speak("Close: " + data[loc].close); 
                textToSpeech.speak("Low: " + data[loc].low); 
            } else if(data[loc].close > data[loc].open){
                textToSpeech.speak("Upward Trend"); 
                textToSpeech.speak("Low: " + data[loc].low);
                textToSpeech.speak("Open: " + data[loc].open); 
                textToSpeech.speak("Close: " + data[loc].close); 
                textToSpeech.speak("High: " + data[loc].high); 
            } else {
                textToSpeech.speak("Neutral Trend");
                textToSpeech.speak("High: " + data[loc].high); 
                textToSpeech.speak("Open: " + data[loc].open); 
                textToSpeech.speak("Low: " + data[loc].low);  
            }
            
            console.log("false");
            detailsPlaying = true;
            buttonDown = false;
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
        textToSpeech.setRate(rate);
        buttonDown = false;
        console.log(rate);
    }

    if (key == '-' && rate > 0.3) {
        rate -= 0.2;
        textToSpeech.setRate(rate);
        buttonDown = false;
        console.log(rate);
    }
}



function keyPressed() {

    buttonDown = true;

}

function keyReleased() {

    buttonDown = false;

}


function checkLeftRight() {

    if (key == 'g' && loc > 0) {

        stopSpeech();

        loc--;

        playNote(map(data[loc].close, data[loc].setlow, data[loc].sethigh, lowmap, highmap), durationLeng);


    } else if (key == 'h' && loc < data.length - 1) {

        stopSpeech();

        loc++;

        playNote(map(data[loc].close, data[loc].setlow, data[loc].sethigh, lowmap, highmap), durationLeng);

    }
}

function checkBegEnd() {

    if (key == '.') {

        stopSpeech();

        loc = datasize - 1;

        playNote(map(data[loc].close, data[loc].setlow, data[loc].sethigh, lowmap, highmap), durationLeng);


    } else if (key == ',') {

        stopSpeech();

        loc = 0;

        playNote(map(data[loc].close, data[loc].setlow, data[loc].sethigh, lowmap, highmap), durationLeng);

    }
}


function drawVis() {


    var padding = 100;

    var newLow = window.height - padding;
    var newHigh = 0 + padding; 


    if (data != undefined && data[0] != undefined) {

        var lastY = map(data[0].close, data[0].setlow, data[0].sethigh, newLow, newHigh);
        // var lastUB = dataset.getRow(0).arr[5] * multiplier + shift;
        // var lastLB = dataset.getRow(0).arr[6] * multiplier + shift;

        for (var i in data) {


            if (i != 0 && i != data.length) {

                var xPos = map(i, 0, data.length, 0, width);

                var lastxPos = map(i - 1, 0, data.length, 0, width);

                stroke(0);

                line(lastxPos, lastY, xPos, map(data[i].close, data[i].setlow, data[i].sethigh, newLow, newHigh));



                // stroke(216, 11, 207);
                // line(lastxPos, lastUB, xPos, dataset.getRow(i).arr[5] * multiplier + shift);

                // stroke(47, 229, 37);
                // line(lastxPos, lastLB, xPos, dataset.getRow(i).arr[6] * multiplier + shift);

            }

            lastY = map(data[i].close, data[0].setlow, data[0].sethigh, newLow, newHigh);
            // lastUB = dataset.getRow(i).arr[5] * multiplier + shift;
            // lastLB = dataset.getRow(i).arr[6] * multiplier + shift;

        }

        stroke(255, 0, 0);
        var curMapped = map(loc, 0, data.length, 0, window.width);
        line(curMapped, 0, curMapped, canvasHeight);
        fill(255, 0, 0);
        ellipse(curMapped, map(data[i].close, data[i].setlow, data[i].sethigh, newLow, newHigh));
    }

}

function windowResized() { 
    resizeCanvas(windowWidth, canvasHeight); 
}

// function playOpen() {
//     playNote(map(data[loc].open, data[loc].setlow, data[loc].sethigh, lowmap, highmap), toneDuration);
// }

// function playClose() {
//     playNote(map(data[loc].close, data[loc].setlow, data[loc].sethigh, lowmap, highmap), toneDuration);
// }

// function playHigh() {
//     playNote(map(data[loc].high, data[loc].setlow, data[loc].sethigh, lowmap, highmap), toneDuration);
// }

// function playLow() {
//     playNote(map(data[loc].low, data[loc].setlow, data[loc].sethigh, lowmap, highmap), toneDuration);
// }       
