var osc, fft;

var loc = 0;
var datasize = 0;

var dataset;
var close;

var highclose;
var lowclose;

var highmap = 70;
var lowmap = 50;

var durationLeng = 100;

var holdDownDelay = 0;

var index = 0;

var osc;

var buttonDown = false;

//this isn't reading? 
var textToSpeech = new p5.Speech();

var detailsPlaying = false;

var rate = 1.5;

var canvasHeight = 500;

var controlPress = false;
var plusPress = false;
var minusPress = false;
var quandlQ = "https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?api_key=iz12PA5nC-YLyESare9X&qopts.columns=open,high,low,close,volume"; 
var ticker = "AAPL"
var fromDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); 
var toDate = new Date(); 
var addtl = "&ticker=" + ticker + "&date.gte="+ formatDate(fromDate) + "&date.lte=" + formatDate(fromDate); 

// var query = quandlQ + addtl;
var query = "https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?api_key=iz12PA5nC-YLyESare9X&qopts.columns=open,high,low,close,volume&ticker=AAPL&date.gte=2016-07-10&date.lte=2017-01-13"; 

function formatDate(d) {
  var ret = '' + d.getUTCFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getUTCDate(); 
  return ret; 
}




function setup() {

    
    $.getJSON(query, function(json) {
      console.log(json); 
    }); 
    // $.getJSON('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=MSFT&outputsize=full&apikey=CXSGLM08JIC4DD17', function(jd) {
    //     Object.keys(jd['Time Series (Daily)']).forEach(function(elem) {
    //         var d1 = new Date(elem);
    //         d1.setTime(d1.getTime() + d1.getTimezoneOffset() * 60 * 1000);
    //         elem = d1;
    //     });

    //     console.log(jd['Time Series (Daily)']);
    // });

    createCanvas(windowWidth - 20, canvasHeight);

    osc = new p5.TriOsc();
    osc.start();
    osc.amp(0);

    dataset = loadTable("assets/wholefoods.csv", "csv", "header");
    checkLoad();

    textToSpeech.setRate(rate);
    textToSpeech.onEnd = resetDetails;

}

// A function to play a note
function playNote(note, duration) {
    osc.freq(midiToFreq(note));
    // Fade it in
    osc.fade(0.5, 0.2);

    // If we sest a duration, fade it out
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

}

function playValue() {

    if (key == ' ') {

        if (detailsPlaying == true) {
            stopSpeech();
            detailsPlaying = false;
            console.log("true");
            buttonDown = false;

        } else if (detailsPlaying == false) {

            textToSpeech.speak('hello world blah blah'); // say something 
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


    if (key == '=' && rate < 1.7) {
        rate += 0.2;
        textToSpeech.setRate(rate);
        buttonDown = false;
    }

    if (key == '-' && rate > 0.3) {
        rate -= 0.2;
        textToSpeech.setRate(rate);
        buttonDown = false;
    }
}



function keyPressed() {

    buttonDown = true;

}

function keyReleased() {

    buttonDown = false;

}


function checkLeftRight() {

    if (keyCode == LEFT_ARROW && loc > 0) {

        stopSpeech();

        loc--;

        playNote(map(dataset.getRow(loc).arr[4], lowclose, highclose, lowmap, highmap), durationLeng);

        //console.log(dataset.getRow(loc).arr[4]);

    } else if (keyCode == RIGHT_ARROW && loc < datasize - 1) {

        stopSpeech();

        loc++;

        playNote(map(dataset.getRow(loc).arr[4], lowclose, highclose, lowmap, highmap), durationLeng);

        //console.log(dataset.getRow(loc).arr[4]);

    }
}

function checkBegEnd() {

    if (key == '.') {

        stopSpeech();

        loc = datasize - 1;

        playNote(map(dataset.getRow(loc).arr[4], lowclose, highclose, lowmap, highmap), durationLeng);


    } else if (key == ',') {

        stopSpeech();

        loc = 0;

        playNote(map(dataset.getRow(loc).arr[4], lowclose, highclose, lowmap, highmap), durationLeng);


    }
}



function checkLoad() {
    if (dataset.getRowCount() != 0) {
        datasize = dataset.getRowCount();
        //console.log(datasize);
        close = dataset.getColumn("close");
        close.sort();
        //console.log(close);
        highclose = close[close.length - 1];
        //console.log(highclose);
        lowclose = close[0];
        //console.log(lowclose);
    } else {
        window.setTimeout("checkLoad();", 100);
    }
}



function drawVis() {


    if (dataset.getRow(0) != undefined) {

        var multiplier = -25;
        var shift = 1200;
        var lastY = dataset.getRow(0).arr[4] * multiplier + shift;
        var lastUB = dataset.getRow(0).arr[5] * multiplier + shift;
        var lastLB = dataset.getRow(0).arr[6] * multiplier + shift;

        for (var i = 0; i < datasize; i++) {

            if (i != 0 && i != datasize) {
                var xPos = map(i, 0, datasize, 0, width);
                var lastxPos = map(i - 1, 0, datasize, 0, width);
                stroke(0);
                line(lastxPos, lastY, xPos, dataset.getRow(i).arr[4] * multiplier + shift);

                stroke(216, 11, 207);
                line(lastxPos, lastUB, xPos, dataset.getRow(i).arr[5] * multiplier + shift);

                stroke(47, 229, 37);
                line(lastxPos, lastLB, xPos, dataset.getRow(i).arr[6] * multiplier + shift);

            }

            lastY = dataset.getRow(i).arr[4] * multiplier + shift;
            lastUB = dataset.getRow(i).arr[5] * multiplier + shift;
            lastLB = dataset.getRow(i).arr[6] * multiplier + shift;

        }
    }

    if (dataset.getRow(loc) != undefined) {

        stroke(255, 0, 0);
        var curMapped = map(loc, 0, datasize, 0, width);
        line(curMapped, 0, curMapped, canvasHeight);
        fill(255, 0, 0);
        ellipse(curMapped, dataset.getRow(loc).arr[4] * multiplier + shift, 5, 5);

    }

}

function windowResized() { resizeCanvas(windowWidth - 20, canvasHeight); }