    function onLoad() {
        if ((/(ipad|iphone|ipod|android|windows phone)/i.test(navigator.userAgent))) {
            document.addEventListener('deviceready', checkFirstUse, false);
        } else {
            notFirstUse();
        }
    }

    function initApp() {
        if (/(android)/i.test(navigator.userAgent)){
            interstitial = new admob.InterstitialAd({
                //dev
                adUnitId: 'ca-app-pub-3940256099942544/1033173712'
                //prod
                //adUnitId: 'ca-app-pub-9249695405712287/5268064359'
              });
            }
            else if(/(ipod|iphone|ipad)/i.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
                interstitial = new admob.InterstitialAd({
                    //dev
                    adUnitId: 'ca-app-pub-3940256099942544/4411468910'
                    //prod
                    //adUnitId: 'ca-app-pub-9249695405712287/8221530759'
                  });
            }
            registerAdEvents();
            interstitial.load();
    }

    // optional, in case respond to events or handle error
    function registerAdEvents() {
        // new events, with variable to differentiate: adNetwork, adType, adEvent
        document.addEventListener('admob.ad.load', function (data) {
            document.getElementById("screen").style.display = 'none';    
        });
        document.addEventListener('admob.ad.loadfail', function (data) {
            document.getElementById("screen").style.display = 'none'; 
        });
        document.addEventListener('admob.ad.show', function (data) { 
            document.getElementById("screen").style.display = 'none';     
        });
        document.addEventListener('admob.ad.dismiss', function (data) {
            document.getElementById("screen").style.display = 'none';     
        });
    }

   function checkFirstUse()
    {
        TransitMaster.StopTimes({arrivals: true, headingLabel: "Arrival"});
        initApp();
        checkPermissions();
        askRating();
    }

   function notFirstUse()
    {
        document.getElementById("screen").style.display = 'none';
        TransitMaster.StopTimes({arrivals: true, headingLabel: "Arrival"});
    }

    function checkPermissions(){
        const idfaPlugin = cordova.plugins.idfa;
    
        idfaPlugin.getInfo()
            .then(info => {
                if (!info.trackingLimited) {
                    return info.idfa || info.aaid;
                } else if (info.trackingPermission === idfaPlugin.TRACKING_PERMISSION_NOT_DETERMINED) {
                    return idfaPlugin.requestPermission().then(result => {
                        if (result === idfaPlugin.TRACKING_PERMISSION_AUTHORIZED) {
                            return idfaPlugin.getInfo().then(info => {
                                return info.idfa || info.aaid;
                            });
                        }
                    });
                }
            });
    }

    function askRating()
    {
        const appRatePlugin = AppRate;
        appRatePlugin.setPreferences({
            reviewType: {
                ios: 'AppStoreReview',
                android: 'InAppBrowser'
                },
        useLanguage:  'en',
        usesUntilPrompt: 10,
        promptAgainForEachNewVersion: true,
        storeAppURL: {
                    ios: '1250711727',
                    android: 'market://details?id=com.duluth.free'
                   }
        });
        
        AppRate.promptForRating(false);        
    }

function loadFaves()
{
    showAd();
    window.location = "Favorites.html";
}

function saveFavorites()
{
    var favStop = localStorage.getItem("Favorites");
    var newFave = $('#MainMobileContent_routeList option:selected').val() + ">" + $("#MainMobileContent_directionList option:selected").val() + ">'" + $("#MainMobileContent_stopList option:selected").val() + "':" + $('#MainMobileContent_routeList option:selected').text() + " > " + $("#MainMobileContent_directionList option:selected").text() + " > " + $("#MainMobileContent_stopList option:selected").text();
        if (favStop == null)
        {
            favStop = newFave;
        }   
        else if(favStop.indexOf(newFave) == -1)
        {
            favStop = favStop + "|" + newFave;               
        }
        else
        {
            $("#message").text('Stop is already favorited!!');
            return;
        }
        localStorage.setItem("Favorites", favStop);
        $("#message").text('Stop added to favorites!!');
}

function showAd()
{
    if ((/(ipad|iphone|ipod|android|windows phone)/i.test(navigator.userAgent))) {
        document.getElementById("screen").style.display = 'block';     
        interstitial.show();
        document.getElementById("screen").style.display = 'none'; 
    }
}

var	TransitMaster =	TransitMaster || {};

TransitMaster.StopTimes = function (options) {
    var settings = { arrivals: null, headingLabel: null, includeStops: true };
    $.extend(settings, options);

    var timer = null;
    var initialView = true;
    initialize();

    function initialize() {
        $("#MainMobileContent_routeList").bind("change", function () {
            var temp = $("#MainContent_routeList").val();

            if (temp != "") {
                $.cookie("route", temp, { expires: 30 });
                getDirections();
            }
        });

        $("#MainMobileContent_directionList").bind("change", function () {
            var temp = $("#MainContent_directionList").val();

            if (temp != "") {
                $.cookie("direction", temp, { expires: 30 });
                reset();

                if (settings.includeStops)
                    getStops();
            }
        });

        if (settings.includeStops) {
            $("#MainMobileContent_stopList").bind("change", function () {
                var temp = $("#MainMobileContent_stopList").val();

                if (temp != "") {
                    $.cookie("stop", temp, { expires: 30 });
                    getArrivalTimes();
                }
            });
        }

        getRoutes();
    }


    function checkListCookie(key, list) {
        if (initialView) {
            var temp = $.cookie(key);
            if (temp != null && $("#" + list + " option[value=" + temp + "]").length > 0) {
                $("#" + list).val(temp).change();
                return true;
            }
            else
                initialView = false;
        }

        return false;
    }

    function getRoutes() {
        //$("#MainMobileContent_routeList").text("Loading	routes...");
        $("#routeWait").removeClass("hidden");

        $.ajax({
            type: "POST",
            url: "http://webwatch.duluthtransit.com/Arrivals.aspx/getRoutes",
            contentType: "application/json;	charset=utf-8",
            dataType: "json",
            success: function (msg) {
                if (msg.d == null || msg.d.length == 0) {
                    $("#MainMobileContent_routeList").text("No routes found");
                    return;
                }

                var list = $("#MainMobileContent_routeList");

                $(list).get(0).options[$(list).get(0).options.length] = new Option("Select a route...", "0");
                $.each(msg.d, function (index, item) {
                    $(list).append($("<option />").val(item.id).text(item.name));
                    //$(list).get(0).options[$(list).get(0).options.length] = new Option(item.name, item.id);
                });
                $(list).val('0');
                checkListCookie("route", "MainMobileContent_routeList");
            },
            error: function () {
                displayError("Realtime arrivals is currently unavailable. Please try again later.");
            },
            complete: function (jqXHR, textStatus) {
                $("#routeWait").addClass("hidden");
            }
        });
        $("span").remove();
        $(".dropList").select2();
    }

    function getDirections() {
        reset();

        // Clear cookies if	this is	a new selection
        if (!initialView) {
            $.cookie("direction", null);
            $.cookie("stop", null);
        }

        if (settings.includeStops) {
            $("#MainMobileContent_stopList").get(0).options.length = 0;
        }


        var list = $("#MainMobileContent_directionList");
        $(list).empty();
        $("#MainMobileContent_stopList").empty();
        $(list).get(0).options.length = 0;
        //$("#MainMobileContent_directionList").text("Loading	directions...");
        $("#directionWait").removeClass("hidden");

        $.ajax({
            type: "POST",
            url: "http://webwatch.duluthtransit.com/Arrivals.aspx/getDirections",
            data: "{routeID: " + $("#MainMobileContent_routeList").val() + "}",
            contentType: "application/json;	charset=utf-8",
            dataType: "json",
            success: function (msg) {
                if (msg.d == null || msg.d.length == 0) {
                    $("#MainMobileContent_directionList").text("No directions found");
                    return;
                }

                $(list).get(0).options[$(list).get(0).options.length] = new Option("Select a direction...", "");
                $.each(msg.d, function (index, item) {
                    $(list).append($("<option />").val(item.id).text(item.name));
                    //$(list).get(0).options[$(list).get(0).options.length] = new Option(item.name, item.id);
                });

                checkListCookie("direction", "MainMobileContent_directionList");

                if (!settings.includeStops)
                    initialView = false;
            },
            error: function () {
                displayError("Realtime arrivals is currently unavailable. Please try again later.");
            },
            complete: function (jqXHR, textStatus) {
                $("#directionWait").addClass("hidden");
            }
        });
        $("span").remove();
        $(".dropList").select2();
    }

    function getStops() {
        // Clear cookies if	this is	a new selection
        if (!initialView)
            $.cookie("stop", null);

        var list = $("#MainMobileContent_stopList");

        $(list).get(0).options.length = 0;
        //$("#MainMobileContent_stopList").text("Loading stops...");
        $("#stopWait").removeClass("hidden");

        $.ajax({
            type: "POST",
            url: "http://webwatch.duluthtransit.com/Arrivals.aspx/getStops",
            data: "{routeID: " + $("#MainMobileContent_routeList").val() + ",	directionID: " + $("#MainMobileContent_directionList").val() + "}",
            contentType: "application/json;	charset=utf-8",
            dataType: "json",
            success: function (msg) {
                if (msg.d == null || msg.d.length == 0) {
                    $("#MainMobileContent_stopList").text("No stops	found");
                    return;
                }
                $(list).empty();
                $(list).get(0).options[$(list).get(0).options.length] = new Option("Select a stop...", "");

                $.each(msg.d, function (index, item) {
                    $(list).append($("<option />").val(item.id + "_" + item.tp).text(item.name));
                    //$(list).get(0).options[$(list).get(0).options.length] = new Option(item.name, item.id);
                });

                checkListCookie("stop", "MainMobileContent_stopList");

                initialView = false;
            },
            error: function () {
                displayError("Realtime arrivals is currently unavailable. Please try again later.");
            },
            complete: function (jqXHR, textStatus) {
                $("#stopWait").addClass("hidden");
            }
        });
        $("span").remove();
        $(".dropList").select2();
    }

    function getArrivalTimes(refresh) {
        showAd();
        if (!refresh) {
            reset(true);
            $("#stopWait").removeClass("hidden");
        }

        var sInfo = $("#MainMobileContent_stopList").val();
		var s_tp = sInfo.split("_");

        $.ajax({
            type: "POST",
            url: "http://webwatch.duluthtransit.com/Arrivals.aspx/getStopTimes",
            data: "{routeID: " + $("#MainMobileContent_routeList").val() + ",	directionID: " + $("#MainMobileContent_directionList").val() + ",	stopID:	" + s_tp[0] + ",	tpID:	" + s_tp[1] + ", useArrivalTimes:	" + settings.arrivals + "}",
			contentType: "application/json;	charset=utf-8",
			dataType: "json",
            success: function (msg) {
                if (msg.d == null) {
                    msg.d = { errorMessage: "Realtime arrivals is currently unavailable. Please try again later." };
                }

				if (msg.d.errorMessage == null && (msg.d.routeStops == null || msg.d.routeStops[0].stops == null || msg.d.routeStops[0].stops[0].crossings == null || msg.d.routeStops[0].stops[0].crossings.length == 0))
					msg.d.errorMessage = "No upcoming arrivals.";

                if (msg.d.errorMessage != null) {
                    displayError(msg.d.errorMessage);
                    return;
                }

                msg.d.stops = msg.d.routeStops[0].stops;
				var count = msg.d.stops[0].crossings.length;
				msg.d.heading = "Next " + (count > 1 ? count : "") + " Vehicle " + settings.headingLabel + (count > 1 ? "s" : "");

                var result = $("#stopTemplate").render(msg.d);

                if (refresh)
                    $("#resultBox").html($(result).html());
                else
                    displayResultsBox(result);

                if (!refresh)
                    timer = window.setInterval(function () {
                        getArrivalTimes(true);
                    }, 30000);
            },
            error: function () {
                displayError("Realtime arrivals is currently unavailable. Please try again later.");
            },
            complete: function (jqXHR, textStatus) {
                $("#stopWait").addClass("hidden");
            }
        });
        $("span").remove();
        $(".dropList").select2();
    }

    function displayError(error) {
        reset(true);
        displayResultsBox($("#errorTemplate").render({ error: error }));
    }

    function displayResultsBox(html) {
        // Unfortunately IE9 leaves	artifacts
        var radius = $("#contentBox").css("border-radius");

        $(html).hide().appendTo("#contentBox").toggle(500, function () {
            $("#contentBox").css("border-radius", radius);
            $(this).animate({ opacity: "1" }, 200);
        });
    }

    function reset(instantRemove) {
        if (timer != null) {
            window.clearInterval(timer);
            timer = null;
        }

        if ($("#resultBox").length > 0) {
            if (instantRemove)
                $("#resultBox").remove();
            else
                removeResultBox();
        }
    }

    function removeResultBox() {
        // Unfortunately IE9 leaves	artifacts
        var shadow = $("#contentBox").css("box-shadow");
        var shadowHide = shadow;

        $("#resultBox").animate({ opacity: "0" }, 200, function () {
            $("#contentBox").css("box-shadow", shadowHide);
            $(this).toggle(500, function () {
                $("#contentBox").css("box-shadow", shadow);
                $(this).remove();
            })
        });
    }

    return {
        displayError: displayError
    };
}