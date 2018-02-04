var fixedTop = false;
var transparent = true;
var navbar_initialized = false;

function sendNotif(msg) {
    $.notify({
        icon: "ti-announcement",
        message: msg

    }, {
        element: '#notifications',
        type: "success",
        position: "relative",
        timer: 0,
        allow_dismiss: false,
        newest_on_top: true,
        delay: 0,
        placement: {
            from: "top",
            align: "center"
        },
        spacing: 50,
        template: '<div style="padding:10px 10px 10px 60px;" data-notify="container" class="col-xs-12  alert alert-{0}" role="alert">' +
            '<span data-notify="icon"></span> ' +
            '<span data-notify="title">{1}</span> ' +
            '<span data-notify="message">{2}</span>' +
            '<div class="progress" data-notify="progressbar">' +
            '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
            '</div>' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
            '</div>'
    });
}

$(document).ready(function() {
    $('#myModal').modal({
        backdrop: false,
        keyboard: false
    })
    window_width = $(window).width();

    // Init navigation toggle for small screens
    if (window_width <= 991) {
        pd.initRightMenu();
    }

    //  Activate the tooltips
    $('[rel="tooltip"]').tooltip();

    $('#login').click(function() {
        socket.emit('join', $('#socketID').val(), $('#studentID').val(), $('#lang').val());
    })

    socket.on('roomJoinStatus', function(auth) {
        if (auth.data) {
            $('#myModal').modal('hide')
            startCapture();
        }
        else {
            $('#error').html("Unknown room. Please try again.")
        }
    });

    socket.on('notifcation', function(data) {
        sendNotif(data.message)
    });

    $("#logout").click(function() {
        // socket.emit('logout')
        location.reload();
    })

    function camera() {
        Webcam.set({
            // live preview size
            width: 1,
            height: 1,

            // device capture size
            dest_width: 640,
            dest_height: 480,

            // final cropped size
            crop_width: 600,
            crop_height: 400,

            // format and quality
            image_format: 'jpeg',
            jpeg_quality: 100,

        });
        Webcam.attach('#my_camera');
    }

    camera();

    function preview_snapshot() {
        // freeze camera so user can preview current frame
        Webcam.freeze();
    }

    function save_photo() {
        // actually snap photo (from preview freeze) and display it
        Webcam.snap(function(data_uri) {
            console.log("snapped image")
            $.post('api/image', {
                data: data_uri
            }, function(response, err) {
                if (response) {
                    console.log("OK!");
                }
                else {
                    console.log(err)
                }
            })
            // shut down camera, stop capturing
            Webcam.reset();
        });
    }

    function startCapture() {
        console.log("At startCapture")
        setInterval(function() {
            preview_snapshot();
            save_photo();
            Webcam.unfreeze();
            camera();
            console.log("hello");
        }, 10000);

    }
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
    intervalID;
    var intervalID = setInterval(function() {
        if (currentTime == end) {
            console.log(currentTime)
            console.log('at set interval ')
            var secsLeft = end - currentTime
            var secsElapsed = currentTime - start
            destHour = Math.floor(end / 60)
            destMin = end - destHour * 60
            $('#countDown').html(destHour + ":" + destMin)
            $('#countUp').html(secsElapsed) ///convert to h:mm:ss
            currentTime++
        }
        else {
            return;
        }
    }, 60000);

}
