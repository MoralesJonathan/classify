var fixedTop = false;
var transparent = true;
var navbar_initialized = false;
var xVal = 0;
var id;
$(document).ready(function() {
    const socket = io.connect();
    if (annyang) {
        var commands = {
            'stop lecture': function(){
                annyang.pause();
            },
            '(start lecture) *words': function(words) { 
                console.log(words)
                socket.emit('pretranscription', words);
            }
        };
        annyang.addCommands(commands);

    }
    $('#startLecture').click(function() {
        annyang.start();
    })
    socket.on('connect', () => {
        id = socket.id;
        $('#socketID').html(id)
    });
    socket.on('graphUpdate', function(data) {
        var yVal = data.value
        dps.push({
            x: xVal,
            y: yVal
        });
        xVal++;
        if (dps.length > 15) {
            dps.shift();
        }
        chart.render();
    });
    socket.on('updateAttendance', function(data) {
        $('#curAttendance').html(data)
    })
    updateTimes()
    var dps = [];
    var chart = new CanvasJS.Chart("chartContainer", {
        exportEnabled: false,
        title: {
            text: "Class Emotions",
            fontFamily: "arial",
            fontWeight: "lighter",
            fontSize: 30,
            padding: 15
        },
        axisY: {
            includeZero: false,
            gridColor: "#c9c9c9"
        },
        data: [{
            type: "spline",
            markerSize: 0,
            dataPoints: dps
        }]
    });

    window_width = $(window).width();

    // Init navigation toggle for small screens
    if (window_width <= 991) {
        pd.initRightMenu();
    }

    //  Activate the tooltips
    $('[rel="tooltip"]').tooltip();

});

// activate collapse right menu when the windows is resized
$(window).resize(function() {
    if ($(window).width() <= 991) {
        pd.initRightMenu();
    }
});

pd = {
    misc: {
        navbar_menu_visible: 0
    },
    checkScrollForTransparentNavbar: debounce(function() {
        if ($(document).scrollTop() > 381) {
            if (transparent) {
                transparent = false;
                $('.navbar-color-on-scroll').removeClass('navbar-transparent');
                $('.navbar-title').removeClass('hidden');
            }
        }
        else {
            if (!transparent) {
                transparent = true;
                $('.navbar-color-on-scroll').addClass('navbar-transparent');
                $('.navbar-title').addClass('hidden');
            }
        }
    }),
    initRightMenu: function() {
        if (!navbar_initialized) {
            $off_canvas_sidebar = $('nav').find('.navbar-collapse').first().clone(true);

            $sidebar = $('.sidebar');
            sidebar_bg_color = $sidebar.data('background-color');
            sidebar_active_color = $sidebar.data('active-color');

            $logo = $sidebar.find('.logo').first();
            logo_content = $logo[0].outerHTML;

            ul_content = '';

            // set the bg color and active color from the default sidebar to the off canvas sidebar;
            $off_canvas_sidebar.attr('data-background-color', sidebar_bg_color);
            $off_canvas_sidebar.attr('data-active-color', sidebar_active_color);

            $off_canvas_sidebar.addClass('off-canvas-sidebar');

            //add the content from the regular header to the right menu
            $off_canvas_sidebar.children('ul').each(function() {
                content_buff = $(this).html();
                ul_content = ul_content + content_buff;
            });

            // add the content from the sidebar to the right menu
            content_buff = $sidebar.find('.nav').html();
            ul_content = ul_content + '<li class="divider"></li>' + content_buff;

            ul_content = '<ul class="nav navbar-nav">' + ul_content + '</ul>';

            navbar_content = logo_content + ul_content;
            navbar_content = '<div class="sidebar-wrapper">' + navbar_content + '</div>';

            $off_canvas_sidebar.html(navbar_content);

            $('body').append($off_canvas_sidebar);

            $toggle = $('.navbar-toggle');

            $off_canvas_sidebar.find('a').removeClass('btn btn-round btn-default');
            $off_canvas_sidebar.find('button').removeClass('btn-round btn-fill btn-info btn-primary btn-success btn-danger btn-warning btn-neutral');
            $off_canvas_sidebar.find('button').addClass('btn-simple btn-block');

            $toggle.click(function() {
                if (pd.misc.navbar_menu_visible == 1) {
                    $('html').removeClass('nav-open');
                    pd.misc.navbar_menu_visible = 0;
                    $('#bodyClick').remove();
                    setTimeout(function() {
                        $toggle.removeClass('toggled');
                    }, 400);

                }
                else {
                    setTimeout(function() {
                        $toggle.addClass('toggled');
                    }, 430);

                    div = '<div id="bodyClick"></div>';
                    $(div).appendTo("body").click(function() {
                        $('html').removeClass('nav-open');
                        pd.misc.navbar_menu_visible = 0;
                        $('#bodyClick').remove();
                        setTimeout(function() {
                            $toggle.removeClass('toggled');
                        }, 400);
                    });

                    $('html').addClass('nav-open');
                    pd.misc.navbar_menu_visible = 1;

                }
            });
            navbar_initialized = true;
        }

    }
}


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    };
};

function updateTimes() {
    var start = 60; //hardcoded val. pull from backend.
    var destHour;
    var destMin;
    var end = 1090; //hardcoded val. pull from backend.
    var d = new Date()
    var hour = d.getHours()
    var min = d.getMinutes()
    var currentTime = hour * 60 + min;
    var destHour = Math.floor(end / 60)
    var destMin = end - destHour * 60
    intervalID;
    var intervalID = setInterval(function() {
        if (currentTime != end) {
            console.log(currentTime)
            console.log('at set interval ')
            var minsElapsed = currentTime - start
            if(destMin > 0 ){
                destMin--
            } else {
                destMin = 59
                destHour--
            }
            $('#countDown').html(destHour + ":" + destMin)
            if(minsElapsed > 60){
                var hour = Math.floor(minsElapsed/60)
                var min  = minsElapsed % 60
            }
            $('#countUp').html(hour+":"+min) /
            currentTime++
        }
        else {
            return;
        }
    }, 60000);
}
